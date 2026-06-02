from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from gestion_presence.models import Cours, Enseignant, Filiere, Module, User
from gestion_presence.utils.qr_generator import find_available_time_slot


def get_base_cours():
    return Cours.objects.select_related("module", "module__filiere", "enseignant", "enseignant__user").filter(actif=True)


def get_enseignant_cours(enseignant):
    return get_base_cours().filter(enseignant=enseignant)


def get_admin_cours(request):
    enseignant_id = request.query_params.get("enseignant")
    cours = get_base_cours()

    if not enseignant_id:
        return cours

    return cours.filter(enseignant_id=enseignant_id)


def serialize_owner(enseignant):
    user = enseignant.user

    return {
        "id": enseignant.id,
        "nom": user.nom,
        "prenom": user.prenom,
        "email": user.email,
    }


def serialize_cours(cours, temporary=False):
    return {
        "id": str(cours.id),
        "day": cours.jour,
        "start": cours.heure_debut.strftime("%H:%M"),
        "end": cours.heure_fin.strftime("%H:%M"),
        "module": cours.module.nom,
        "filiere": f"{cours.module.filiere.nom} {cours.module.semestre}".strip(),
        "filiereId": cours.module.filiere_id,
        "semestre": cours.module.semestre,
        "room": cours.salle or "Non precisee",
        "enseignant": str(cours.enseignant),
        "temporary": temporary,
    }


def get_teaching_scope(request):
    if request.user.role == User.Role.ENSEIGNANT:
        try:
            enseignant = request.user.enseignant_profile
        except Exception:
            return None, Cours.objects.none(), Filiere.objects.none(), Module.objects.none()

        cours = get_enseignant_cours(enseignant)
        filieres = Filiere.objects.filter(modules__cours__in=cours).distinct()
        modules = Module.objects.filter(cours__in=cours).select_related("filiere").distinct()
        return enseignant, cours, filieres, modules

    if request.user.role == User.Role.ADMIN:
        cours = get_admin_cours(request)
        filieres = Filiere.objects.filter(modules__cours__in=cours).distinct()
        modules = Module.objects.filter(cours__in=cours).select_related("filiere").distinct()
        return None, cours, filieres, modules

    return None, Cours.objects.none(), Filiere.objects.none(), Module.objects.none()


@api_view(["GET"])
def list_seances(request):
    if request.user.role not in [User.Role.ADMIN, User.Role.ENSEIGNANT]:
        return Response(
            {"message": "Acces non autorise."},
            status=status.HTTP_403_FORBIDDEN,
        )

    owner = None

    if request.user.role == User.Role.ENSEIGNANT:
        try:
            owner = request.user.enseignant_profile
        except Exception:
            return Response({"seances": [], "owner": None})

        cours = get_enseignant_cours(owner)
    else:
        cours = get_admin_cours(request)
        enseignant_id = request.query_params.get("enseignant")

        if enseignant_id:
            owner = Enseignant.objects.select_related("user").filter(id=enseignant_id).first()

    return Response(
        {
            "seances": [serialize_cours(item) for item in cours],
            "owner": serialize_owner(owner) if owner else None,
        }
    )


@api_view(["GET"])
def teaching_filters(request):
    if request.user.role not in [User.Role.ADMIN, User.Role.ENSEIGNANT]:
        return Response({"message": "Acces non autorise."}, status=status.HTTP_403_FORBIDDEN)

    filieres = Filiere.objects.all().order_by("nom")
    modules = Module.objects.select_related("filiere").all()
    semesters_by_filiere = {}

    for module in modules:
        semesters_by_filiere.setdefault(module.filiere_id, set()).add(module.semestre)

    return Response(
        {
            "filieres": [{"id": filiere.id, "nom": filiere.nom} for filiere in filieres.order_by("nom")],
            "semestersByFiliere": {
                str(filiere_id): sorted(values)
                for filiere_id, values in semesters_by_filiere.items()
            },
        }
    )


@api_view(["POST"])
def create_temporary_seance(request):
    if request.user.role != User.Role.ENSEIGNANT:
        return Response({"message": "Seul un enseignant peut creer une seance temporaire."}, status=status.HTTP_403_FORBIDDEN)

    try:
        enseignant = request.user.enseignant_profile
    except Exception:
        return Response({"message": "Profil enseignant introuvable."}, status=status.HTTP_403_FORBIDDEN)

    module_name = (request.data.get("module") or "").strip()
    filiere_id = request.data.get("filiere_id")
    semestre = (request.data.get("semestre") or "").strip()
    salle = (request.data.get("salle") or "").strip() or "Non precisee"
    validite_min = int(request.data.get("validite_min") or 120)

    if not module_name:
        return Response({"message": "Le nom du module est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    if not filiere_id:
        return Response({"message": "La filiere est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    if not semestre:
        return Response({"message": "Le semestre est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filiere introuvable."}, status=status.HTTP_404_NOT_FOUND)

    module, _ = Module.objects.get_or_create(
        nom=module_name,
        filiere=filiere,
        semestre=semestre,
    )

    now = timezone.localtime()
    today = now.date()
    jour = now.isoweekday()
    start_time = now.time().replace(second=0, microsecond=0)
    start_time = find_available_time_slot(enseignant, module, jour, start_time)
    end_dt = datetime.combine(today, start_time) + timedelta(minutes=validite_min)
    end_time = end_dt.time()

    cours = Cours.objects.create(
        module=module,
        enseignant=enseignant,
        salle=salle,
        jour=jour,
        heure_debut=start_time,
        heure_fin=end_time,
        actif=True,
    )

    return Response(
        {
            "message": "Seance temporaire creee.",
            "seance": serialize_cours(cours, temporary=True),
        },
        status=status.HTTP_201_CREATED,
    )
