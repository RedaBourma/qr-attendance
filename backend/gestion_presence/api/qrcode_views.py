import csv
import secrets
from datetime import datetime, timedelta

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from unicodedata import normalize

from gestion_presence.models import Cours, Etudiant, Presence, QRCode, Seance, User
from gestion_presence.utils.qr_generator import (
    build_qr_payload,
    make_qr_image_base64,
)


DEFAULT_VALIDITY_MINUTES = 15


def get_frontend_base_url():
    return getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")


def can_access_seance(user, seance):
    if user.role == User.Role.ADMIN:
        return True

    if user.role == User.Role.ENSEIGNANT:
        try:
            return seance.cours.enseignant_id == user.enseignant_profile.id
        except Exception:
            return False

    return False


def get_eligible_students(seance):
    module = seance.cours.module

    return (
        Etudiant.objects.select_related("user", "filiere")
        .filter(filiere=module.filiere, semester=module.semestre)
        .distinct()
    )


def normalize_name(value):
    normalized = normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return " ".join(normalized.lower().split())


def name_matches_student(submitted_name, etudiant):
    submitted = normalize_name(submitted_name)
    expected_full = normalize_name(f"{etudiant.user.prenom} {etudiant.user.nom}")
    expected_reverse = normalize_name(f"{etudiant.user.nom} {etudiant.user.prenom}")

    return submitted in {expected_full, expected_reverse}


def serialize_student(etudiant, presence=None):
    user = etudiant.user

    return {
        "id": etudiant.id,
        "nom": user.nom,
        "prenom": user.prenom,
        "name": f"{user.prenom} {user.nom}".strip(),
        "code_massar": etudiant.code_massar,
        "filiere": etudiant.filiere.nom,
        "validated_at": presence.heure_validation.isoformat() if presence else None,
    }


def serialize_qr_session(seance):
    cours = seance.cours
    module = cours.module
    qr = getattr(seance, "qrcode", None)
    eligible_students = list(get_eligible_students(seance))
    presences = {
        presence.etudiant_id: presence
        for presence in seance.presences.select_related("etudiant", "etudiant__user", "etudiant__filiere").all()
    }
    attended = [
        serialize_student(etudiant, presences[etudiant.id])
        for etudiant in eligible_students
        if etudiant.id in presences
    ]
    missed = [
        serialize_student(etudiant)
        for etudiant in eligible_students
        if etudiant.id not in presences
    ]
    now = timezone.now()
    running = bool(seance.est_ouverte and qr and now < qr.expiration)
    frontend_base = get_frontend_base_url()
    payload = build_qr_payload(seance, qr.token, frontend_base) if qr else None

    return {
        "id": seance.id,
        "running": running,
        "status": "active" if running else "ended",
        "date": seance.date_seance.isoformat(),
        "startsAt": seance.heure_debut.isoformat(),
        "expiresAt": qr.expiration.isoformat() if qr else None,
        "token": qr.token if qr else None,
        "scanUrl": payload["scan_url"] if payload else None,
        "qrPayload": payload,
        "qrImage": make_qr_image_base64(payload["scan_url"]) if payload else None,
        "module": module.nom,
        "filiere": module.filiere.nom,
        "semestre": module.semestre,
        "cours": f"{cours.heure_debut.strftime('%H:%M')} - {cours.heure_fin.strftime('%H:%M')}",
        "room": cours.salle or "Non precisee",
        "eligibleCount": len(eligible_students),
        "presentCount": len(attended),
        "absentCount": len(missed),
        "attended": attended,
        "missed": missed,
    }


def create_or_refresh_qr(seance, validite_min):
    token = f"QRP-{secrets.token_urlsafe(24)}"
    expiration = timezone.now() + timedelta(minutes=validite_min)
    frontend_base = get_frontend_base_url()
    payload = build_qr_payload(seance, token, frontend_base)

    seance.est_ouverte = True
    seance.token_qr = token
    seance.validite_min = validite_min
    seance.save(update_fields=["est_ouverte", "token_qr", "validite_min"])

    QRCode.objects.update_or_create(
        seance=seance,
        defaults={
            "token": token,
            "url_cible": payload["scan_url"],
            "expiration": expiration,
        },
    )

    seance.refresh_from_db()
    return seance


@api_view(["POST"])
def generate_qr_for_cours(request):
    if request.user.role != User.Role.ENSEIGNANT:
        return Response({"message": "Seul un enseignant peut generer un QR code."}, status=status.HTTP_403_FORBIDDEN)

    cours_id = request.data.get("cours_id")
    validite_min = int(request.data.get("validite_min") or DEFAULT_VALIDITY_MINUTES)

    try:
        enseignant = request.user.enseignant_profile
    except Exception:
        return Response({"message": "Profil enseignant introuvable."}, status=status.HTTP_403_FORBIDDEN)

    cours = Cours.objects.select_related("module", "module__filiere").filter(
        id=cours_id,
        enseignant=enseignant,
        actif=True,
    ).first()

    if not cours:
        return Response({"message": "Cours introuvable ou non autorise."}, status=status.HTTP_404_NOT_FOUND)

    now = timezone.localtime()
    today = now.date()
    heure_debut = timezone.make_aware(datetime.combine(today, cours.heure_debut))

    seance, created = Seance.objects.get_or_create(
        cours=cours,
        enseignant=enseignant,
        date_seance=today,
        defaults={
            "heure_debut": heure_debut,
            "validite_min": validite_min,
            "est_ouverte": True,
        },
    )

    qr = getattr(seance, "qrcode", None)
    if qr and seance.est_ouverte and timezone.now() < qr.expiration and not request.data.get("force"):
        return Response({"seance": serialize_qr_session(seance)})

    if not created:
        seance.heure_debut = heure_debut
        seance.save(update_fields=["heure_debut"])

    create_or_refresh_qr(seance, validite_min)

    return Response({"seance": serialize_qr_session(seance)}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def current_qr_session(request):
    if request.user.role not in [User.Role.ADMIN, User.Role.ENSEIGNANT]:
        return Response({"message": "Acces non autorise."}, status=status.HTTP_403_FORBIDDEN)

    qs = (
        Seance.objects.select_related("cours", "cours__module", "cours__module__filiere", "qrcode")
        .prefetch_related("presences")
        .filter(est_ouverte=True, qrcode__expiration__gt=timezone.now())
        .order_by("-qrcode__expiration")
    )

    if request.user.role == User.Role.ENSEIGNANT:
        try:
            qs = qs.filter(cours__enseignant=request.user.enseignant_profile)
        except Exception:
            qs = Seance.objects.none()

    seance = qs.first()
    return Response({"seance": serialize_qr_session(seance) if seance else None})


@api_view(["GET"])
def qr_session_detail(request, seance_id):
    seance = (
        Seance.objects.select_related("cours", "cours__module", "cours__module__filiere", "qrcode")
        .prefetch_related("presences")
        .filter(id=seance_id)
        .first()
    )

    if not seance:
        return Response({"message": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not can_access_seance(request.user, seance):
        return Response({"message": "Acces non autorise."}, status=status.HTTP_403_FORBIDDEN)

    return Response({"seance": serialize_qr_session(seance)})


@api_view(["POST"])
def close_qr_session(request, seance_id):
    seance = Seance.objects.select_related("cours", "cours__module", "cours__module__filiere", "qrcode").filter(id=seance_id).first()

    if not seance:
        return Response({"message": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not can_access_seance(request.user, seance):
        return Response({"message": "Acces non autorise."}, status=status.HTTP_403_FORBIDDEN)

    seance.est_ouverte = False
    seance.save(update_fields=["est_ouverte"])

    return Response({"seance": serialize_qr_session(seance)})


@api_view(["GET"])
def export_qr_session(request, seance_id):
    seance = Seance.objects.select_related("cours", "cours__module", "cours__module__filiere", "qrcode").filter(id=seance_id).first()

    if not seance:
        return Response({"message": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not can_access_seance(request.user, seance):
        return Response({"message": "Acces non autorise."}, status=status.HTTP_403_FORBIDDEN)

    export_type = request.query_params.get("type", "all")
    data = serialize_qr_session(seance)
    rows = []

    if export_type in ["all", "present"]:
        rows.extend([("present", student) for student in data["attended"]])

    if export_type in ["all", "absent"]:
        rows.extend([("absent", student) for student in data["missed"]])

    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="presence_seance_{seance.id}_{export_type}.csv"'
    response.write("\ufeff")
    writer = csv.writer(response)
    writer.writerow(["statut", "nom", "prenom", "code_massar", "filiere", "validation"])

    for row_status, student in rows:
        writer.writerow([
            row_status,
            student["nom"],
            student["prenom"],
            student["code_massar"],
            student["filiere"],
            student["validated_at"] or "",
        ])

    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def scan_qr_info(request, token):
    qr = QRCode.objects.select_related(
        "seance",
        "seance__cours",
        "seance__cours__module",
        "seance__cours__module__filiere",
    ).filter(token=token).first()

    if not qr:
        return Response({"message": "QR code introuvable."}, status=status.HTTP_404_NOT_FOUND)

    return Response({"seance": serialize_qr_session(qr.seance)})


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_qr_scan(request, token):
    qr = QRCode.objects.select_related(
        "seance",
        "seance__cours",
        "seance__cours__module",
        "seance__cours__module__filiere",
    ).filter(token=token).first()

    if not qr:
        return Response({"message": "QR code introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if qr.est_expire or not qr.seance.est_ouverte:
        return Response({"message": "Cette seance est terminee."}, status=status.HTTP_400_BAD_REQUEST)

    code_massar = (request.data.get("code_massar") or "").strip()
    submitted_name = (request.data.get("name") or "").strip()
    if not code_massar:
        return Response({"message": "Le code Massar est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    if not submitted_name:
        return Response({"message": "Le nom complet est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    etudiant = Etudiant.objects.select_related("user", "filiere").filter(code_massar=code_massar).first()

    if not etudiant:
        return Response({"message": "Etudiant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not name_matches_student(submitted_name, etudiant):
        return Response({"message": "Le nom ne correspond pas au code Massar."}, status=status.HTTP_403_FORBIDDEN)

    module = qr.seance.cours.module
    if etudiant.filiere_id != module.filiere_id or etudiant.semester != module.semestre:
        return Response(
            {"message": "Cet etudiant n'appartient pas a cette classe ou filiere."},
            status=status.HTTP_403_FORBIDDEN,
        )

    presence, created = Presence.objects.get_or_create(
        etudiant=etudiant,
        seance=qr.seance,
        defaults={"statut": Presence.Statut.PRESENT},
    )

    if not created and presence.statut != Presence.Statut.PRESENT:
        presence.statut = Presence.Statut.PRESENT
        presence.save(update_fields=["statut"])

    return Response(
        {
            "message": "Presence enregistree." if created else "Presence deja enregistree.",
            "student": serialize_student(etudiant, presence),
            "already_registered": not created,
        }
    )
