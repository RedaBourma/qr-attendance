from datetime import datetime, timedelta

from django.core.exceptions import ValidationError
from django.db import IntegrityError, models
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from gestion_presence.models import Cours, Enseignant, Etudiant, Filiere, Module, TemporarySeance, User


def build_filiere_tracks(filiere):
    semesters = filiere.semesters or []
    student_count = Etudiant.objects.filter(filiere=filiere).count()
    
    semester_details = []
    for sem in semesters:
        semester_details.append(
            {
                "code": sem,
                "studentCount": student_count,
                "moduleCount": Module.objects.filter(
                    filiere=filiere,
                    semestre=sem,
                ).count(),
            }
        )
    return [
        {
            "filiereId": filiere.id,
            "nom": filiere.nom,
            "semesters": semester_details,
        }
    ]


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


def serialize_academic_cours(cours):
    return {
        **serialize_cours(cours),
        "moduleId": cours.module_id,
        "enseignantId": cours.enseignant_id,
        "actif": cours.actif,
    }


def serialize_filiere(filiere):
    return {
        "id": filiere.id,
        "nom": filiere.nom,
        "semesters": filiere.semesters or [],
    }


def serialize_module(module):
    return {
        "id": module.id,
        "nom": module.nom,
        "filiereId": module.filiere_id,
        "filiere": module.filiere.nom,
        "semestre": module.semestre,
    }


def serialize_enseignant(enseignant):
    user = enseignant.user
    return {
        "id": enseignant.id,
        "nom": user.nom,
        "prenom": user.prenom,
        "email": user.email,
        "name": str(enseignant),
    }


def delete_expired_temporary_seances():
    pass


def serialize_temporary_seance(seance):
    return {
        "id": f"temp-{seance.id}",
        "day": timezone.localtime(seance.heure_debut).isoweekday(),
        "start": timezone.localtime(seance.heure_debut).strftime("%H:%M"),
        "end": timezone.localtime(seance.heure_fin).strftime("%H:%M"),
        "module": seance.module.nom,
        "filiere": f"{seance.module.filiere.nom} {seance.module.semestre}".strip(),
        "filiereId": seance.module.filiere_id,
        "semestre": seance.module.semestre,
        "room": seance.salle or "Non precisee",
        "enseignant": str(seance.enseignant),
        "temporary": True,
        "heure_debut_iso": seance.heure_debut.isoformat(),
        "heure_fin_iso": seance.heure_fin.isoformat(),
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

    delete_expired_temporary_seances()
    owner = None
    temporary_seances = TemporarySeance.objects.none()

    if request.user.role == User.Role.ENSEIGNANT:
        try:
            owner = request.user.enseignant_profile
        except Exception:
            return Response({"seances": [], "owner": None})

        cours = get_enseignant_cours(owner)
        temporary_seances = TemporarySeance.objects.select_related("module", "module__filiere", "enseignant").filter(
            enseignant=owner,
            heure_fin__gt=timezone.now(),
        )
    else:
        cours = get_admin_cours(request)
        enseignant_id = request.query_params.get("enseignant")

        if enseignant_id:
            owner = Enseignant.objects.select_related("user").filter(id=enseignant_id).first()
            temporary_seances = TemporarySeance.objects.select_related("module", "module__filiere", "enseignant").filter(
                enseignant_id=enseignant_id,
                heure_fin__gt=timezone.now(),
            )

    return Response(
        {
            "seances": [serialize_cours(item) for item in cours]
            + [serialize_temporary_seance(item) for item in temporary_seances],
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
            "modules": [
                {
                    "id": module.id,
                    "nom": module.nom,
                    "filiereId": module.filiere_id,
                    "semestre": module.semestre,
                }
                for module in modules.order_by("filiere__nom", "semestre", "nom")
            ],
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

    module_id = request.data.get("module_id")
    filiere_id = request.data.get("filiere_id")
    salle = (request.data.get("salle") or "").strip() or "Non precisee"
    validite_min = int(request.data.get("validite_min") or 120)

    if not module_id:
        return Response({"message": "Le module est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    if not filiere_id:
        return Response({"message": "La filiere est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filiere introuvable."}, status=status.HTTP_404_NOT_FOUND)

    module = Module.objects.select_related("filiere").filter(id=module_id, filiere=filiere).first()
    if not module:
        return Response(
            {"message": "Module introuvable pour cette filiere."},
            status=status.HTTP_404_NOT_FOUND,
        )

    now = timezone.now().replace(second=0, microsecond=0)
    end_dt = now + timedelta(minutes=validite_min)

    seance = TemporarySeance.objects.create(
        module=module,
        enseignant=enseignant,
        salle=salle,
        date_seance=timezone.localdate(now),
        heure_debut=now,
        heure_fin=end_dt,
        validite_min=validite_min,
    )

    return Response(
        {
            "message": "Seance temporaire creee.",
            "seance": serialize_temporary_seance(seance),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def academic_management(request):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    filieres = Filiere.objects.all().order_by("nom")
    modules = Module.objects.select_related("filiere").all().order_by("filiere__nom", "semestre", "nom")
    enseignants = Enseignant.objects.select_related("user").all()
    cours = get_base_cours()

    # semesters list from filieres
    semesters = set()
    for f in filieres:
        if f.semesters:
            semesters.update(f.semesters)
    semesters = sorted(list(semesters))

    return Response(
        {
            "filieres": [serialize_filiere(filiere) for filiere in filieres],
            "modules": [serialize_module(module) for module in modules],
            "enseignants": [serialize_enseignant(enseignant) for enseignant in enseignants],
            "cours": [serialize_academic_cours(item) for item in cours],
            "semesters": semesters,
        }
    )


@api_view(["POST"])
def create_academic_filiere(request):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    nom = (request.data.get("nom") or "").strip()
    semesters = request.data.get("semesters") or []
    if not nom:
        return Response({"message": "Le nom de la filiere est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        filiere = Filiere.objects.create(nom=nom, semesters=semesters)
    except IntegrityError:
        return Response({"message": "Cette filiere existe deja."}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serialize_filiere(filiere), status=status.HTTP_201_CREATED)


@api_view(["POST"])
def update_academic_filiere(request, filiere_id):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filiere introuvable."}, status=status.HTTP_404_NOT_FOUND)

    nom = (request.data.get("nom") or "").strip()
    semesters = request.data.get("semesters") or []

    if nom:
        filiere.nom = nom
    filiere.semesters = semesters

    try:
        filiere.save()
    except IntegrityError:
        return Response({"message": "Cette filiere existe deja."}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serialize_filiere(filiere))


@api_view(["DELETE", "POST"])
def delete_academic_filiere(request, filiere_id):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filiere introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        filiere.delete()
    except models.ProtectedError:
        return Response(
            {"message": "Impossible de supprimer cette filière car elle est associée à des étudiants ou des modules."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"message": "Filière supprimée avec succès."}, status=status.HTTP_200_OK)


@api_view(["POST", "PATCH"])
def update_academic_module(request, module_id):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    module = Module.objects.filter(id=module_id).select_related("filiere").first()
    if not module:
        return Response({"message": "Module introuvable."}, status=status.HTTP_404_NOT_FOUND)

    nom = (request.data.get("nom") or "").strip()
    semestre = (request.data.get("semestre") or "").strip()

    if nom:
        module.nom = nom
    if semestre:
        if semestre not in (module.filiere.semesters or []):
            return Response({"message": "Ce semestre ne correspond pas a la filiere."}, status=status.HTTP_400_BAD_REQUEST)
        module.semestre = semestre

    try:
        module.save()
    except IntegrityError:
        return Response({"message": "Ce module existe deja pour cette filiere et ce semestre."}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serialize_module(module))


@api_view(["DELETE", "POST"])
def delete_academic_module(request, module_id):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    module = Module.objects.filter(id=module_id).first()
    if not module:
        return Response({"message": "Module introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        module.delete()
    except models.ProtectedError:
        return Response(
            {"message": "Impossible de supprimer ce module car il est associé à des cours existants."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"message": "Module supprimé avec succès."}, status=status.HTTP_200_OK)


@api_view(["POST"])
def create_academic_module(request):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    nom = (request.data.get("nom") or "").strip()
    filiere_id = request.data.get("filiere_id")
    semestre = (request.data.get("semestre") or "").strip()

    if not all([nom, filiere_id, semestre]):
        return Response({"message": "Nom, filiere et semestre sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filiere introuvable."}, status=status.HTTP_404_NOT_FOUND)

    if semestre not in (filiere.semesters or []):
        return Response({"message": "Ce semestre ne correspond pas a la filiere."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        module = Module.objects.create(nom=nom, filiere=filiere, semestre=semestre)
    except IntegrityError:
        return Response({"message": "Ce module existe deja pour cette filiere et ce semestre."}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serialize_module(module), status=status.HTTP_201_CREATED)


@api_view(["POST"])
def create_academic_cours(request):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    module_id = request.data.get("module_id")
    enseignant_id = request.data.get("enseignant_id")
    jour = request.data.get("jour")
    heure_debut = request.data.get("heure_debut")
    heure_fin = request.data.get("heure_fin")
    salle = (request.data.get("salle") or "").strip()

    if not all([module_id, enseignant_id, jour, heure_debut, heure_fin]):
        return Response({"message": "Module, enseignant, jour et heures sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

    module = Module.objects.filter(id=module_id).first()
    enseignant = Enseignant.objects.filter(id=enseignant_id).first()
    if not module or not enseignant:
        return Response({"message": "Module ou enseignant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        def clean_time_str(t_str):
            t_str = (t_str or "").strip()
            if len(t_str) >= 5:
                t_str = t_str[:5]
            return datetime.strptime(t_str, "%H:%M").time()

        t_debut = clean_time_str(heure_debut)
        t_fin = clean_time_str(heure_fin)
    except ValueError as e:
        return Response(
            {"message": f"Format d'heure invalide (attendu HH:MM) : {e}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        cours = Cours.objects.create(
            module=module,
            enseignant=enseignant,
            salle=salle,
            jour=int(jour),
            heure_debut=t_debut,
            heure_fin=t_fin,
            actif=True,
        )
    except IntegrityError as e:
        if "unique_cours_assignment" in str(e):
            return Response(
                {"message": "Un cours est déjà planifié sur ce créneau pour cet enseignant ou ce module."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"message": f"Erreur d'intégrité de la base de données : {e}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ValidationError as e:
        err_msg = e.message_dict if hasattr(e, "message_dict") else e.messages
        return Response(
            {"message": f"Erreur de validation : {err_msg}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(serialize_academic_cours(cours), status=status.HTTP_201_CREATED)


@api_view(["GET"])
def filiere_transition_options(request, filiere_id):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filiere introuvable."}, status=status.HTTP_404_NOT_FOUND)

    tracks = build_filiere_tracks(filiere)
    other_filieres = Filiere.objects.exclude(id=filiere_id).order_by("nom")
    student_count = Etudiant.objects.filter(filiere=filiere).count()
    suggestions = []

    for other in other_filieres:
        suggestions.append({
            "label": f"Vers {other.nom}",
            "fromFiliereId": filiere.id,
            "toFiliereId": other.id,
            "studentCount": student_count,
        })

    return Response(
        {
            "filiereId": filiere.id,
            "filiere": filiere.nom,
            "tracks": tracks,
            "suggestions": suggestions,
            "allFilieres": [
                {"id": f.id, "nom": f.nom}
                for f in other_filieres
            ]
        }
    )


@api_view(["POST"])
def transition_academic_semester(request):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    from_filiere_id = request.data.get("from_filiere_id") or request.data.get("filiere_id")
    to_filiere_id = request.data.get("to_filiere_id")

    if not all([from_filiere_id, to_filiere_id]):
        return Response(
            {"message": "Filiere source et filiere cible sont obligatoires."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from_filiere = Filiere.objects.filter(id=from_filiere_id).first()
    to_filiere = Filiere.objects.filter(id=to_filiere_id).first()
    if not from_filiere or not to_filiere:
        return Response({"message": "Filiere source ou cible introuvable."}, status=status.HTTP_404_NOT_FOUND)

    students = Etudiant.objects.filter(filiere_id=from_filiere_id)
    updated = students.update(filiere_id=to_filiere_id)

    return Response(
        {
            "message": f"Transition appliquee. {updated} etudiants transferes.",
            "updatedStudents": updated,
            "fromFiliere": from_filiere.nom,
            "toFiliere": to_filiere.nom,
        }
    )


@api_view(["POST"])
def update_academic_cours(request, cours_id):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    cours = Cours.objects.filter(id=cours_id).first()
    if not cours:
        return Response({"message": "Cours introuvable."}, status=status.HTTP_404_NOT_FOUND)

    module_id = request.data.get("module_id")
    enseignant_id = request.data.get("enseignant_id")
    jour = request.data.get("jour")
    heure_debut = request.data.get("heure_debut")
    heure_fin = request.data.get("heure_fin")
    salle = (request.data.get("salle") or "").strip()

    if not all([module_id, enseignant_id, jour, heure_debut, heure_fin]):
        return Response({"message": "Module, enseignant, jour et heures sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

    module = Module.objects.filter(id=module_id).first()
    enseignant = Enseignant.objects.filter(id=enseignant_id).first()
    if not module or not enseignant:
        return Response({"message": "Module ou enseignant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        def clean_time_str(t_str):
            t_str = (t_str or "").strip()
            if len(t_str) >= 5:
                t_str = t_str[:5]
            return datetime.strptime(t_str, "%H:%M").time()

        t_debut = clean_time_str(heure_debut)
        t_fin = clean_time_str(heure_fin)
    except ValueError as e:
        return Response(
            {"message": f"Format d'heure invalide (attendu HH:MM) : {e}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        cours.module = module
        cours.enseignant = enseignant
        cours.salle = salle
        cours.jour = int(jour)
        cours.heure_debut = t_debut
        cours.heure_fin = t_fin
        cours.save()
    except IntegrityError as e:
        if "unique_cours_assignment" in str(e):
            return Response(
                {"message": "Un cours est déjà planifié sur ce créneau pour cet enseignant ou ce module."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"message": f"Erreur d'intégrité de la base de données : {e}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except ValidationError as e:
        err_msg = e.message_dict if hasattr(e, "message_dict") else e.messages
        return Response(
            {"message": f"Erreur de validation : {err_msg}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(serialize_academic_cours(cours))


@api_view(["POST"])
def delete_academic_cours(request, cours_id):
    if request.user.role != User.Role.ADMIN:
        return Response({"message": "Acces reserve a l'admin."}, status=status.HTTP_403_FORBIDDEN)

    cours = Cours.objects.filter(id=cours_id).first()
    if not cours:
        return Response({"message": "Cours introuvable."}, status=status.HTTP_404_NOT_FOUND)

    cours.delete()
    return Response({"message": "Cours supprime avec succes."})
