from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from gestion_presence.models import Enseignant, User
from gestion_presence.api.auth_views import serialize_user


def serialize_enseignant(enseignant, request=None):
    user = enseignant.user

    return {
        "id": enseignant.id,
        "user": serialize_user(user, request),
        "cours_count": enseignant.cours.count(),
        "filieres": [{"id": f.id, "nom": f.nom} for f in enseignant.filieres.all()],
        "modules": [{"id": m.id, "nom": m.nom, "filiere_id": m.filiere_id, "semestre": m.semestre} for m in enseignant.modules.all()],
    }


@api_view(["GET"])
def list_enseignants(request):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Acces reserve a l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    enseignants = Enseignant.objects.select_related("user").prefetch_related("cours", "filieres", "modules").all()
    return Response({"enseignants": [serialize_enseignant(enseignant, request) for enseignant in enseignants]})


@api_view(["POST"])
def create_enseignant(request):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Acces reserve a l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    nom = (request.data.get("nom") or "").strip()
    prenom = (request.data.get("prenom") or "").strip()
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""

    if not all([nom, prenom]):
        return Response(
            {"message": "nom et prenom sont requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not email:
        email = f"{prenom.lower()}.{nom.lower()}@umi.ac.ma"

    if not password:
        password = f"{nom.lower()}@{prenom.lower()}"

    filiere_ids = request.data.get("filiere_ids") or []
    module_ids = request.data.get("module_ids") or []

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password,
                nom=nom,
                prenom=prenom,
                role=User.Role.ENSEIGNANT,
            )
            enseignant = Enseignant.objects.create(user=user)
            if filiere_ids:
                enseignant.filieres.set(filiere_ids)
            if module_ids:
                enseignant.modules.set(module_ids)
    except IntegrityError:
        return Response(
            {"message": "Un utilisateur avec cet email existe deja."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        serialize_enseignant(enseignant, request),
        status=status.HTTP_201_CREATED,
    )


@api_view(["PATCH", "POST"])
def update_enseignant(request, enseignant_id):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Acces reserve a l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    enseignant = Enseignant.objects.filter(id=enseignant_id).select_related("user").first()
    if not enseignant:
        return Response({"message": "Enseignant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    nom = (request.data.get("nom") or "").strip()
    prenom = (request.data.get("prenom") or "").strip()
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""

    if not all([nom, prenom]):
        return Response(
            {"message": "nom et prenom sont requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    filiere_ids = request.data.get("filiere_ids") or []
    module_ids = request.data.get("module_ids") or []

    try:
        with transaction.atomic():
            user = enseignant.user
            user.nom = nom
            user.prenom = prenom
            if email:
                user.email = email
            if password:
                user.set_password(password)
            user.save()
            enseignant.filieres.set(filiere_ids)
            enseignant.modules.set(module_ids)
    except IntegrityError:
        return Response(
            {"message": "Un utilisateur avec cet email existe deja."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        serialize_enseignant(enseignant, request),
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE", "POST"])
def delete_enseignant(request, enseignant_id):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Acces reserve a l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    enseignant = Enseignant.objects.filter(id=enseignant_id).select_related("user").first()
    if not enseignant:
        return Response({"message": "Enseignant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        with transaction.atomic():
            user = enseignant.user
            user.delete()
    except Exception as e:
        return Response(
            {"message": f"Erreur lors de la suppression : {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"message": "Enseignant supprime avec succes."}, status=status.HTTP_200_OK)
