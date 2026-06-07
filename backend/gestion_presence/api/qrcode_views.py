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

from gestion_presence.models import Cours, Etudiant, Presence, QRCode, Seance, TemporaryPresence, TemporarySeance, User
from gestion_presence.utils.qr_generator import (
    build_scan_url,
    build_qr_payload,
    make_qr_image_base64,
)


QR_VALIDITY_MINUTES = 10


def get_frontend_base_url():
    return getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")


def is_temporary_id(value):
    return str(value).startswith("temp-")


def temporary_public_id(seance):
    return f"temp-{seance.id}"


def parse_temporary_id(value):
    if not is_temporary_id(value):
        return None

    try:
        return int(str(value).split("-", 1)[1])
    except (TypeError, ValueError):
        return None


def delete_expired_temporary_seances():
    pass


def can_access_seance(user, seance):
    if user.role == User.Role.ADMIN:
        return True

    if user.role == User.Role.ENSEIGNANT:
        try:
            owner_id = seance.enseignant_id if isinstance(seance, TemporarySeance) else seance.cours.enseignant_id
            return owner_id == user.enseignant_profile.id
        except Exception:
            return False

    return False


def get_eligible_students(seance):
    module = seance.module if isinstance(seance, TemporarySeance) else seance.cours.module

    return (
        Etudiant.objects.select_related("user", "filiere")
        .filter(filiere=module.filiere)
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


def build_temporary_qr_payload(seance, token, frontend_base_url):
    metadata = {
        "v": 1,
        "token": token,
        "seance_id": temporary_public_id(seance),
        "cours_id": temporary_public_id(seance),
        "module": seance.module.nom,
        "module_id": seance.module_id,
        "filiere": seance.module.filiere.nom,
        "filiere_id": seance.module.filiere_id,
        "niveau": "",
        "semestre": seance.module.semestre,
        "salle": seance.salle or "",
        "date": seance.date_seance.isoformat(),
        "heure": (
            f"{timezone.localtime(seance.heure_debut).strftime('%H:%M')}-"
            f"{timezone.localtime(seance.heure_fin).strftime('%H:%M')}"
        ),
        "expires_at": seance.expiration.isoformat(),
    }
    scan_url = build_scan_url(frontend_base_url, token, metadata)

    return {
        **metadata,
        "scan_url": scan_url,
    }


def serialize_qr_session(seance):
    is_temp = isinstance(seance, TemporarySeance)
    cours = None if is_temp else seance.cours
    module = seance.module if is_temp else cours.module
    qr = None if is_temp else getattr(seance, "qrcode", None)
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
    expires_at = seance.expiration if is_temp else (qr.expiration if qr else None)
    token = seance.token_qr if is_temp else (qr.token if qr else None)
    running = bool(seance.est_ouverte and token and expires_at and now < expires_at)
    frontend_base = get_frontend_base_url()
    if is_temp:
        payload = build_temporary_qr_payload(seance, token, frontend_base) if token else None
        starts_at = seance.heure_debut
        course_label = (
            f"{timezone.localtime(seance.heure_debut).strftime('%H:%M')} - "
            f"{timezone.localtime(seance.heure_fin).strftime('%H:%M')}"
        )
        room = seance.salle or "Non precisee"
        public_id = temporary_public_id(seance)
    else:
        payload = build_qr_payload(seance, token, frontend_base) if qr else None
        starts_at = seance.heure_debut
        course_label = f"{cours.heure_debut.strftime('%H:%M')} - {cours.heure_fin.strftime('%H:%M')}"
        room = cours.salle or "Non precisee"
        public_id = str(seance.id)

    return {
        "id": public_id,
        "running": running,
        "status": "active" if running else "ended",
        "date": seance.date_seance.isoformat(),
        "startsAt": starts_at.isoformat(),
        "expiresAt": expires_at.isoformat() if expires_at else None,
        "token": token,
        "scanUrl": payload["scan_url"] if payload else None,
        "qrPayload": payload,
        "qrImage": make_qr_image_base64(payload["scan_url"]) if payload else None,
        "module": module.nom,
        "filiere": module.filiere.nom,
        "niveau": "",
        "semestre": module.semestre,
        "cours": course_label,
        "room": room,
        "eligibleCount": len(eligible_students),
        "presentCount": len(attended),
        "absentCount": len(missed),
        "attended": attended,
        "missed": missed,
    }


def create_or_refresh_temporary_qr(seance, validite_min, latitude=None, longitude=None):
    token = f"QRP-{secrets.token_urlsafe(24)}"
    expiration = timezone.now() + timedelta(minutes=validite_min)
    seance.est_ouverte = True
    seance.token_qr = token
    seance.qr_expiration = expiration
    seance.latitude = latitude
    seance.longitude = longitude
    seance.save(update_fields=["est_ouverte", "token_qr", "qr_expiration", "latitude", "longitude"])
    seance.refresh_from_db()
    return seance


def create_or_refresh_qr(seance, validite_min, latitude=None, longitude=None):
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
            "latitude": latitude,
            "longitude": longitude,
        },
    )

    seance.refresh_from_db()
    return seance


@api_view(["POST"])
def generate_qr_for_cours(request):
    if request.user.role != User.Role.ENSEIGNANT:
        return Response({"message": "Seul un enseignant peut generer un QR code."}, status=status.HTTP_403_FORBIDDEN)

    cours_id = request.data.get("cours_id")
    validite_min = QR_VALIDITY_MINUTES
    latitude = request.data.get("latitude")
    longitude = request.data.get("longitude")

    try:
        enseignant = request.user.enseignant_profile
    except Exception:
        return Response({"message": "Profil enseignant introuvable."}, status=status.HTTP_403_FORBIDDEN)

    if is_temporary_id(cours_id):
        temp_id = parse_temporary_id(cours_id)
        seance = TemporarySeance.objects.select_related("module", "module__filiere").filter(
            id=temp_id,
            enseignant=enseignant,
            est_ouverte=True,
            heure_fin__gt=timezone.now(),
        ).first()

        if not seance:
            return Response({"message": "Seance temporaire introuvable ou terminee."}, status=status.HTTP_404_NOT_FOUND)

        if seance.token_qr and timezone.now() < seance.expiration and not request.data.get("force"):
            return Response({"seance": serialize_qr_session(seance)})

        create_or_refresh_temporary_qr(seance, validite_min, latitude=latitude, longitude=longitude)
        return Response({"seance": serialize_qr_session(seance)}, status=status.HTTP_201_CREATED)

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

    create_or_refresh_qr(seance, validite_min, latitude=latitude, longitude=longitude)

    return Response({"seance": serialize_qr_session(seance)}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def current_qr_session(request):
    if request.user.role not in [User.Role.ADMIN, User.Role.ENSEIGNANT]:
        return Response({"message": "Acces non autorise."}, status=status.HTTP_403_FORBIDDEN)

    delete_expired_temporary_seances()
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
    temp_qs = (
        TemporarySeance.objects.select_related("module", "module__filiere")
        .prefetch_related("presences")
        .filter(est_ouverte=True, heure_fin__gt=timezone.now(), qr_expiration__gt=timezone.now())
        .exclude(token_qr__isnull=True)
        .exclude(token_qr="")
        .order_by("-qr_expiration")
    )

    if request.user.role == User.Role.ENSEIGNANT:
        try:
            temp_qs = temp_qs.filter(enseignant=request.user.enseignant_profile)
        except Exception:
            temp_qs = TemporarySeance.objects.none()

    temp_seance = temp_qs.first()

    if temp_seance and (not seance or temp_seance.expiration > seance.qrcode.expiration):
        seance = temp_seance

    return Response({"seance": serialize_qr_session(seance) if seance else None})


@api_view(["GET"])
def qr_session_detail(request, seance_id):
    if is_temporary_id(seance_id):
        temp_id = parse_temporary_id(seance_id)
        seance = (
            TemporarySeance.objects.select_related("module", "module__filiere")
            .prefetch_related("presences")
            .filter(id=temp_id)
            .first()
        )
    else:
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
    is_temp = is_temporary_id(seance_id)
    if is_temp:
        temp_id = parse_temporary_id(seance_id)
        seance = TemporarySeance.objects.select_related("module", "module__filiere").prefetch_related("presences").filter(id=temp_id).first()
    else:
        seance = Seance.objects.select_related("cours", "cours__module", "cours__module__filiere", "qrcode").filter(id=seance_id).first()

    if not seance:
        return Response({"message": "Seance introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not can_access_seance(request.user, seance):
        return Response({"message": "Acces non autorise."}, status=status.HTTP_403_FORBIDDEN)

    if is_temp:
        seance.est_ouverte = False
        snapshot = serialize_qr_session(seance)
        seance.delete()
        return Response({"seance": snapshot})

    seance.est_ouverte = False
    seance.save(update_fields=["est_ouverte"])

    return Response({"seance": serialize_qr_session(seance)})


@api_view(["GET"])
def export_qr_session(request, seance_id):
    if is_temporary_id(seance_id):
        temp_id = parse_temporary_id(seance_id)
        seance = TemporarySeance.objects.select_related("module", "module__filiere").prefetch_related("presences").filter(id=temp_id).first()
    else:
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

    temp_seance = None
    if not qr:
        temp_seance = TemporarySeance.objects.select_related("module", "module__filiere").filter(token_qr=token).first()

    if not qr and not temp_seance:
        return Response({"message": "QR code introuvable."}, status=status.HTTP_404_NOT_FOUND)

    return Response({"seance": serialize_qr_session(temp_seance or qr.seance)})


import math

def calculate_distance(lat1, lon1, lat2, lon2):
    # Radius of the Earth in km
    R = 6371.0
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance_meters = R * c * 1000.0
    return distance_meters


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_qr_scan(request, token):
    qr = QRCode.objects.select_related(
        "seance",
        "seance__cours",
        "seance__cours__module",
        "seance__cours__module__filiere",
    ).filter(token=token).first()

    temp_seance = None
    if not qr:
        temp_seance = TemporarySeance.objects.select_related("module", "module__filiere").filter(token_qr=token).first()

    if not qr and not temp_seance:
        return Response({"message": "QR code introuvable."}, status=status.HTTP_404_NOT_FOUND)

    seance = temp_seance or qr.seance
    is_temp = temp_seance is not None

    if (seance.est_expiree if is_temp else qr.est_expire) or not seance.est_ouverte:
        return Response({"message": "Cette seance est terminee."}, status=status.HTTP_400_BAD_REQUEST)
    code_massar = (request.data.get("code_massar") or "").strip()
    submitted_name = (request.data.get("name") or "").strip()
    if not submitted_name:
        submitted_prenom = (request.data.get("prenom") or "").strip()
        submitted_nom = (request.data.get("nom") or "").strip()
        if submitted_prenom and submitted_nom:
            submitted_name = f"{submitted_prenom} {submitted_nom}"

    if not code_massar:
        return Response({"message": "Le code Massar est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    if not submitted_name:
        return Response({"message": "Le prénom et le nom sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

    device_uuid = (request.data.get("device_uuid") or "").strip()

    try:
        student_lat = float(request.data.get("latitude")) if request.data.get("latitude") is not None else None
        student_lng = float(request.data.get("longitude")) if request.data.get("longitude") is not None else None
    except (ValueError, TypeError):
        student_lat = None
        student_lng = None

    teacher_lat = seance.latitude if is_temp else qr.latitude
    teacher_lng = seance.longitude if is_temp else qr.longitude

    # Enforce Geofencing if the teacher's location is set
    if teacher_lat is not None and teacher_lng is not None:
        if student_lat is None or student_lng is None:
            return Response(
                {"message": "L'autorisation de géolocalisation est obligatoire pour valider votre présence."},
                status=status.HTTP_400_BAD_REQUEST
            )

        distance = calculate_distance(teacher_lat, teacher_lng, student_lat, student_lng)
        MAX_DISTANCE_METERS = 50.0  # 50 meters geofencing limit

        if distance > MAX_DISTANCE_METERS:
            return Response(
                {"message": f"Vous devez être présent dans la salle de classe pour valider votre présence (vous êtes trop éloigné de l'enseignant : {distance:.1f}m, limite : {MAX_DISTANCE_METERS}m)."},
                status=status.HTTP_400_BAD_REQUEST
            )

    etudiant = Etudiant.objects.select_related("user", "filiere").filter(code_massar=code_massar).first()

    if not etudiant:
        return Response({"message": "Etudiant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if not name_matches_student(submitted_name, etudiant):
        return Response({"message": "Le nom ne correspond pas au code Massar."}, status=status.HTTP_403_FORBIDDEN)

    module = seance.module if is_temp else seance.cours.module
    if etudiant.filiere_id != module.filiere_id:
        return Response(
            {"message": "Cet etudiant n'appartient pas a cette filiere."},
            status=status.HTTP_403_FORBIDDEN,
        )

    presence_model = TemporaryPresence if is_temp else Presence

    # Enforce one scan per device constraint
    if device_uuid:
        existing_other = presence_model.objects.filter(
            seance=seance,
            device_uuid=device_uuid
        ).exclude(etudiant=etudiant).first()

        if existing_other:
            return Response(
                {"message": "Ce téléphone a déjà été utilisé pour valider la présence d'un autre étudiant."},
                status=status.HTTP_400_BAD_REQUEST
            )

    presence, created = presence_model.objects.get_or_create(
        etudiant=etudiant,
        seance=seance,
        defaults={"statut": presence_model.Statut.PRESENT, "device_uuid": device_uuid},
    )

    if not created:
        update_fields = []
        if presence.statut != presence_model.Statut.PRESENT:
            presence.statut = presence_model.Statut.PRESENT
            update_fields.append("statut")
        if device_uuid and presence.device_uuid != device_uuid:
            presence.device_uuid = device_uuid
            update_fields.append("device_uuid")
        if update_fields:
            presence.save(update_fields=update_fields)

    return Response(
        {
            "message": "Presence enregistree." if created else "Presence deja enregistree.",
            "student": serialize_student(etudiant, presence),
            "already_registered": not created,
        }
    )
