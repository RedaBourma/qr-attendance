from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from gestion_presence.models import Cours, Enseignant, Etudiant, Presence, Seance, TemporaryPresence, TemporarySeance, User


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


def get_visible_temporary_seances(user):
    seances = (
        TemporarySeance.objects.select_related(
            "module",
            "module__filiere",
            "enseignant",
            "enseignant__user",
        )
        .prefetch_related("presences")
        .annotate(presence_count=Count("presences"))
    )

    if user.role == User.Role.ADMIN:
        return seances

    if user.role == User.Role.ENSEIGNANT:
        try:
            return seances.filter(enseignant=user.enseignant_profile)
        except Exception:
            return TemporarySeance.objects.none()

    return TemporarySeance.objects.none()


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
        "isTemporary": False,
        "enseignant": str(cours.enseignant),
        "professor": None,
    }


def serialize_temporary_seance(seance):
    expiration = seance.expiration
    is_active = seance.est_ouverte and timezone.now() < expiration
    module = seance.module
    professor_user = seance.enseignant.user

    return {
        "id": f"temp-{seance.id}",
        "module": module.nom,
        "filiere": module.filiere.nom,
        "semestre": module.semestre,
        "cours": f"{timezone.localtime(seance.heure_debut).strftime('%H:%M')} - {timezone.localtime(seance.heure_fin).strftime('%H:%M')} | Salle {seance.salle or 'Non precisee'}",
        "date": seance.date_seance.isoformat(),
        "startsAt": seance.heure_debut.isoformat(),
        "expiresAt": expiration.isoformat(),
        "status": "active" if is_active else "expired",
        "presences": seance.presence_count,
        "scanUrl": None,
        "isTemporary": True,
        "enseignant": str(seance.enseignant),
        "professor": {
            "id": seance.enseignant_id,
            "nom": professor_user.nom,
            "prenom": professor_user.prenom,
            "email": professor_user.email,
        },
    }


def rate(present, eligible):
    return round((present / eligible) * 100) if eligible else 0


def presence_counts_by_student(model):
    return {
        item["etudiant_id"]: item["total"]
        for item in model.objects.values("etudiant_id").annotate(total=Count("id"))
    }


def build_analytics(seances, temporary_seances):
    students = list(Etudiant.objects.select_related("user", "filiere").all())
    teachers = list(Enseignant.objects.select_related("user").all())
    courses = list(Cours.objects.select_related("module", "module__filiere", "enseignant", "enseignant__user").filter(actif=True))

    eligible_by_module = {}
    for item in Etudiant.objects.values("filiere_id").annotate(total=Count("id")).order_by():
        eligible_by_module[item["filiere_id"]] = item["total"]

    session_count_by_scope = {}
    total_eligible = 0

    course_rows = {
        cours.id: {
            "id": cours.id,
            "module": cours.module.nom,
            "filiere": cours.module.filiere.nom,
            "semestre": cours.module.semestre,
            "enseignant": str(cours.enseignant),
            "sessions": 0,
            "presences": 0,
            "eligible": 0,
            "attendanceRate": 0,
        }
        for cours in courses
    }

    teacher_rows = {
        teacher.id: {
            "id": teacher.id,
            "name": str(teacher),
            "email": teacher.user.email,
            "courses": 0,
            "sessions": 0,
            "temporarySessions": 0,
            "presences": 0,
            "eligible": 0,
            "attendanceRate": 0,
        }
        for teacher in teachers
    }

    for cours in courses:
        if cours.enseignant_id in teacher_rows:
            teacher_rows[cours.enseignant_id]["courses"] += 1

    for seance in seances:
        module = seance.cours.module
        filiere_id = module.filiere_id
        eligible = eligible_by_module.get(filiere_id, 0)
        presences = seance.presence_count
        total_eligible += eligible
        session_count_by_scope[filiere_id] = session_count_by_scope.get(filiere_id, 0) + 1

        if seance.cours_id in course_rows:
            course_rows[seance.cours_id]["sessions"] += 1
            course_rows[seance.cours_id]["presences"] += presences
            course_rows[seance.cours_id]["eligible"] += eligible

        if seance.enseignant_id in teacher_rows:
            teacher_rows[seance.enseignant_id]["sessions"] += 1
            teacher_rows[seance.enseignant_id]["presences"] += presences
            teacher_rows[seance.enseignant_id]["eligible"] += eligible

    for seance in temporary_seances:
        module = seance.module
        filiere_id = module.filiere_id
        eligible = eligible_by_module.get(filiere_id, 0)
        presences = seance.presence_count
        total_eligible += eligible
        session_count_by_scope[filiere_id] = session_count_by_scope.get(filiere_id, 0) + 1

        if seance.enseignant_id in teacher_rows:
            teacher_rows[seance.enseignant_id]["sessions"] += 1
            teacher_rows[seance.enseignant_id]["temporarySessions"] += 1
            teacher_rows[seance.enseignant_id]["presences"] += presences
            teacher_rows[seance.enseignant_id]["eligible"] += eligible

    regular_presence_counts = presence_counts_by_student(Presence)
    temporary_presence_counts = presence_counts_by_student(TemporaryPresence)
    student_rows = []

    for student in students:
        eligible = session_count_by_scope.get(student.filiere_id, 0)
        present = regular_presence_counts.get(student.id, 0) + temporary_presence_counts.get(student.id, 0)
        student_rows.append(
            {
                "id": student.id,
                "name": f"{student.user.prenom} {student.user.nom}".strip(),
                "email": student.user.email,
                "codeMassar": student.code_massar,
                "filiere": student.filiere.nom,
                "eligibleSessions": eligible,
                "presences": present,
                "absences": max(eligible - present, 0),
                "attendanceRate": rate(present, eligible),
            }
        )

    for row in course_rows.values():
        row["attendanceRate"] = rate(row["presences"], row["eligible"])

    for row in teacher_rows.values():
        row["attendanceRate"] = rate(row["presences"], row["eligible"])

    return {
        "summary": {
            "totalStudents": len(students),
            "totalTeachers": len(teachers),
            "totalCourses": len(courses),
            "totalEligible": total_eligible,
        },
        "students": sorted(student_rows, key=lambda item: (item["attendanceRate"], -item["eligibleSessions"], item["name"])),
        "courses": sorted(course_rows.values(), key=lambda item: (-item["attendanceRate"], item["module"])),
        "teachers": sorted(teacher_rows.values(), key=lambda item: (-item["attendanceRate"], item["name"])),
    }


@api_view(["GET"])
def dashboard_view(request):
    user = request.user

    if user.role not in (User.Role.ADMIN, User.Role.ENSEIGNANT):
        return Response(
            {"message": "Acces non autorise."},
            status=status.HTTP_403_FORBIDDEN,
        )

    seances = list(get_visible_seances(user))
    temporary_seances = list(get_visible_temporary_seances(user))
    serialized_all = [serialize_seance(seance) for seance in seances] + [
        serialize_temporary_seance(seance) for seance in temporary_seances
    ]
    serialized_all.sort(key=lambda seance: seance["startsAt"], reverse=True)
    total_seances = len(serialized_all)
    active_count = sum(1 for seance in serialized_all if seance["status"] == "active")
    total_presences = sum(seance["presences"] for seance in serialized_all)
    avg_presences = round(total_presences / total_seances) if total_seances else 0

    if user.role == User.Role.ENSEIGNANT:
        return Response(
            {
                "stats": {
                    "totalSeances": total_seances,
                    "activeSeances": active_count,
                    "totalPresences": total_presences,
                    "avgPresences": avg_presences,
                },
                "seances": serialized_all,
            }
        )

    analytics = build_analytics(seances, temporary_seances)

    return Response(
        {
            "stats": {
                "totalSeances": total_seances,
                "activeSeances": active_count,
                "totalPresences": total_presences,
                "avgPresences": avg_presences,
                "attendanceRate": rate(total_presences, analytics["summary"]["totalEligible"]),
                **analytics["summary"],
            },
            "analytics": {
                "students": analytics["students"],
                "courses": analytics["courses"],
                "teachers": analytics["teachers"],
            },
            "seances": serialized_all[:20],
        }
    )
