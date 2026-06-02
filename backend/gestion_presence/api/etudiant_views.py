from functools import reduce
from operator import or_

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from gestion_presence.models import Cours, Etudiant, Filiere, Module, User
from gestion_presence.api.auth_views import serialize_user


def serialize_filiere(filiere):
    return {
        "id": filiere.id,
        "nom": filiere.nom,
    }


def serialize_module(module):
    return {
        "id": module.id,
        "nom": module.nom,
        "semestre": module.semestre,
    }


def serialize_etudiant(etudiant, modules, request=None):
    return {
        "id": etudiant.id,
        "code_massar": etudiant.code_massar,
        "nom": etudiant.user.nom,
        "prenom": etudiant.user.prenom,
        "email": etudiant.user.email,
        "profile_picture": serialize_user(etudiant.user, request)["profile_picture"],
        "filiere": serialize_filiere(etudiant.filiere),
        "semester": etudiant.semester,
        "niveau": etudiant.niveau,
        "modules": [serialize_module(module) for module in modules],
    }


def build_student_scope_from_modules(modules):
    pairs = set(modules.values_list("filiere_id", "semestre"))

    if not pairs:
        return Q(pk__in=[])

    return reduce(
        or_,
        (Q(filiere_id=filiere_id, semester=semestre) for filiere_id, semestre in pairs),
    )


def modules_for_student(etudiant, allowed_module_ids):
    modules = Module.objects.filter(
        filiere_id=etudiant.filiere_id,
        semestre=etudiant.semester,
    ).select_related("filiere")

    if allowed_module_ids is not None:
        modules = modules.filter(id__in=allowed_module_ids)

    return modules


@api_view(["GET"])
def list_etudiants(request):
    filiere_id = request.query_params.get("filiere")
    semester = request.query_params.get("semester")
    user = request.user

    if user.role == User.Role.ADMIN:
        accessible_filieres = Filiere.objects.all()
        accessible_modules = Module.objects.select_related("filiere").all()
        etudiants = Etudiant.objects.select_related("user", "filiere")
    elif user.role == User.Role.ENSEIGNANT:
        try:
            enseignant = user.enseignant_profile
        except Exception:
            return Response(
                {"message": "Profil enseignant introuvable."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cours = Cours.objects.filter(enseignant=enseignant, actif=True).select_related("module", "module__filiere")
        accessible_filieres = Filiere.objects.filter(modules__cours__in=cours).distinct()
        accessible_modules = Module.objects.filter(cours__in=cours).select_related("filiere").distinct()
        etudiants = (
            Etudiant.objects.select_related("user", "filiere")
            .filter(build_student_scope_from_modules(accessible_modules))
            .distinct()
        )
    else:
        return Response(
            {"message": "Acces non autorise."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if filiere_id:
        etudiants = etudiants.filter(filiere_id=filiere_id)
        accessible_modules = accessible_modules.filter(filiere_id=filiere_id)

    if semester:
        etudiants = etudiants.filter(semester=semester).distinct()
        accessible_modules = accessible_modules.filter(semestre=semester)

    accessible_module_ids = set(accessible_modules.values_list("id", flat=True))
    serialized_etudiants = []

    for etudiant in etudiants:
        modules = modules_for_student(etudiant, accessible_module_ids)
        serialized_etudiants.append(serialize_etudiant(etudiant, modules, request))

    semesters = (
        accessible_modules.order_by("semestre")
        .values_list("semestre", flat=True)
        .distinct()
    )

    return Response(
        {
            "filters": {
                "filieres": [serialize_filiere(filiere) for filiere in accessible_filieres],
                "semesters": list(semesters),
            },
            "etudiants": serialized_etudiants,
        }
    )
