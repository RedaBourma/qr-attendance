from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from gestion_presence.models import Seance, User


def get_visible_seances(user):
    seances = (
        Seance.objects.select_related("cours", "cours__module", "cours__module__filiere", "cours__enseignant")
        .prefetch_related("presences")
        .annotate(presence_count=Count("presences"))
        .filter(qrcode__isnull=False)
    )

    if user.role == User.Role.ADMIN:
        return seances

    if user.role == User.Role.ENSEIGNANT:
        try:
            return seances.filter(cours__enseignant=user.enseignant_profile)
        except Exception:
            return Seance.objects.none()

    return Seance.objects.none()


def get_expiration(seance):
    try:
        return seance.qrcode.expiration
    except Exception:
        return seance.heure_debut + timedelta(minutes=seance.validite_min)


def serialize_seance(seance):
    expiration = get_expiration(seance)
    is_active = seance.est_ouverte and timezone.now() < expiration
    cours = seance.cours

    return {
        "id": str(seance.id),
        "module": cours.module.nom,
        "filiere": cours.module.filiere.nom,
        "semestre": cours.module.semestre,
        "cours": f"{cours.heure_debut.strftime('%H:%M')} - {cours.heure_fin.strftime('%H:%M')} | Salle {cours.salle or 'Non precisee'}",
        "date": seance.date_seance.isoformat(),
        "startsAt": seance.heure_debut.isoformat(),
        "expiresAt": expiration.isoformat(),
        "status": "active" if is_active else "expired",
        "presences": seance.presence_count,
        "scanUrl": seance.qrcode.url_cible if hasattr(seance, "qrcode") else None,
    }


@api_view(["GET"])
def dashboard_view(request):
    user = request.user

    if user.role not in [User.Role.ADMIN, User.Role.ENSEIGNANT]:
        return Response(
            {"message": "Acces non autorise."},
            status=status.HTTP_403_FORBIDDEN,
        )

    seances = list(get_visible_seances(user))
    serialized_all = [serialize_seance(seance) for seance in seances]
    total_seances = len(seances)
    active_count = sum(1 for seance in serialized_all if seance["status"] == "active")
    total_presences = sum(seance.presence_count for seance in seances)
    avg_presences = round(total_presences / total_seances) if total_seances else 0

    return Response(
        {
            "stats": {
                "totalSeances": total_seances,
                "activeSeances": active_count,
                "totalPresences": total_presences,
                "avgPresences": avg_presences,
            },
            "seances": serialized_all[:20],
        }
    )
