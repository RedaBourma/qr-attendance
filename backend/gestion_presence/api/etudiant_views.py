from functools import reduce
from operator import or_
import csv
from io import TextIOWrapper
import openpyxl

from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from gestion_presence.api.auth_views import serialize_user
from gestion_presence.models import Cours, Etudiant, Filiere, Module, User


def serialize_filiere(filiere):
    return {
        "id": filiere.id,
        "nom": filiere.nom,
        "semesters": filiere.semesters,
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
        "modules": [serialize_module(module) for module in modules],
    }


def build_student_scope_from_modules(modules):
    filiere_ids = set(modules.values_list("filiere_id", flat=True))

    if not filiere_ids:
        return Q(pk__in=[])

    return Q(filiere_id__in=filiere_ids)


def modules_for_student(etudiant, allowed_module_ids):
    modules = Module.objects.filter(
        filiere_id=etudiant.filiere_id,
    ).select_related("filiere")

    if allowed_module_ids is not None:
        modules = modules.filter(id__in=allowed_module_ids)

    return modules


@api_view(["GET"])
def list_etudiants(request):
    filiere_id = request.query_params.get("filiere")
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

    accessible_module_ids = set(accessible_modules.values_list("id", flat=True))
    serialized_etudiants = []

    for etudiant in etudiants:
        modules = modules_for_student(etudiant, accessible_module_ids)
        serialized_etudiants.append(serialize_etudiant(etudiant, modules, request))

    return Response(
        {
            "filters": {
                "filieres": [serialize_filiere(filiere) for filiere in accessible_filieres],
            },
            "etudiants": serialized_etudiants,
        }
    )


@api_view(["POST"])
def create_etudiant(request):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Accès réservé à l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    nom = (request.data.get("nom") or "").strip()
    prenom = (request.data.get("prenom") or "").strip()
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""
    code_massar = (request.data.get("code_massar") or "").strip()
    filiere_id = request.data.get("filiere_id")

    if not all([nom, prenom, code_massar, filiere_id]):
        return Response(
            {"message": "Nom, prénom, code Massar et filière sont requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    clean_nom = nom.replace(" ", "").lower()
    clean_prenom = prenom.replace(" ", "").lower()

    if not email:
        first_prenom_char = clean_prenom[0] if clean_prenom else ""
        email = f"{first_prenom_char}.{clean_nom}@edu.umi.ac.ma"

    if not password:
        first_nom_char = clean_nom[0] if clean_nom else ""
        first_4_massar = code_massar[:4]
        password = f"{clean_prenom}{first_nom_char}@{first_4_massar}"

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filière introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password,
                nom=nom,
                prenom=prenom,
                role=User.Role.ETUDIANT,
              )
            etudiant = Etudiant.objects.create(
                user=user,
                code_massar=code_massar,
                filiere=filiere,
            )
    except IntegrityError:
        return Response(
            {"message": "Un utilisateur avec cet email ou ce code Massar existe déjà."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    modules = modules_for_student(etudiant, None)
    return Response(
        serialize_etudiant(etudiant, modules, request),
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def import_etudiants(request):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Accès réservé à l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    filiere_id = request.data.get("filiere_id")
    if not filiere_id:
        return Response({"message": "La filière est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filière introuvable."}, status=status.HTTP_404_NOT_FOUND)

    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return Response({"message": "Aucun fichier n'a été fourni."}, status=status.HTTP_400_BAD_REQUEST)

    file_name = uploaded_file.name.lower()
    rows = []

    if file_name.endswith(".xlsx"):
        try:
            wb = openpyxl.load_workbook(uploaded_file, read_only=True)
            sheet = wb.active
            if not sheet:
                return Response({"message": "Le fichier Excel est vide ou invalide."}, status=status.HTTP_400_BAD_REQUEST)
            
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not any(row):  
                    continue
                prenom = str(row[0]).strip() if len(row) > 0 and row[0] is not None else ""
                nom = str(row[1]).strip() if len(row) > 1 and row[1] is not None else ""
                code_massar = str(row[2]).strip() if len(row) > 2 and row[2] is not None else ""
                email = str(row[3]).strip() if len(row) > 3 and row[3] is not None else ""
                if prenom or nom or code_massar:
                    rows.append({
                        "prenom": prenom,
                        "nom": nom,
                        "code_massar": code_massar,
                        "email": email
                    })
        except Exception as e:
            return Response({"message": f"Erreur lors de la lecture du fichier Excel : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    elif file_name.endswith(".csv"):
        try:
            csv_file = TextIOWrapper(uploaded_file.file, encoding="utf-8-sig")
            sample = csv_file.read(2048)
            csv_file.seek(0)
            delimiter = ";" if ";" in sample else ","
            reader = csv.reader(csv_file, delimiter=delimiter)
            header = next(reader, None)  
            for row in reader:
                if not any(row):
                    continue
                prenom = row[0].strip() if len(row) > 0 else ""
                nom = row[1].strip() if len(row) > 1 else ""
                code_massar = row[2].strip() if len(row) > 2 else ""
                email = row[3].strip() if len(row) > 3 else ""
                if prenom or nom or code_massar:
                    rows.append({
                        "prenom": prenom,
                        "nom": nom,
                        "code_massar": code_massar,
                        "email": email
                    })
        except Exception as e:
            return Response({"message": f"Erreur lors de la lecture du fichier CSV : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({"message": "Le format du fichier doit être Excel (.xlsx) ou CSV (.csv)."}, status=status.HTTP_400_BAD_REQUEST)

    if not rows:
        return Response({"message": "Aucun étudiant valide n'a été trouvé dans le fichier. Veuillez vous assurer que le fichier contient des données à partir de la deuxième ligne."}, status=status.HTTP_400_BAD_REQUEST)

    success_count = 0
    errors = []

    for index, row_data in enumerate(rows, start=2):
        prenom = row_data["prenom"]
        nom = row_data["nom"]
        code_massar = row_data["code_massar"]
        email = row_data["email"]

        if not all([prenom, nom, code_massar]):
            errors.append(f"Ligne {index} : Le prénom, le nom et le code Massar sont obligatoires.")
            continue

        clean_nom = nom.replace(" ", "").lower()
        clean_prenom = prenom.replace(" ", "").lower()

        if not email:
            first_prenom_char = clean_prenom[0] if clean_prenom else ""
            email = f"{first_prenom_char}.{clean_nom}@edu.umi.ac.ma"

        first_nom_char = clean_nom[0] if clean_nom else ""
        first_4_massar = code_massar[:4]
        password = f"{clean_prenom}{first_nom_char}@{first_4_massar}"

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    nom=nom,
                    prenom=prenom,
                    role=User.Role.ETUDIANT,
                )
                Etudiant.objects.create(
                    user=user,
                    code_massar=code_massar,
                    filiere=filiere,
                )
                success_count += 1
        except IntegrityError:
            errors.append(f"Ligne {index} ({prenom} {nom}) : Un utilisateur avec cet email ou ce code Massar existe déjà.")
        except Exception as e:
            errors.append(f"Ligne {index} ({prenom} {nom}) : {str(e)}")

    return Response({
        "success": success_count,
        "total": len(rows),
        "errors": errors
    }, status=status.HTTP_200_OK if success_count > 0 else status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "POST"])
def update_etudiant(request, etudiant_id):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Accès réservé à l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    etudiant = Etudiant.objects.filter(id=etudiant_id).select_related("user").first()
    if not etudiant:
        return Response({"message": "Étudiant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    nom = (request.data.get("nom") or "").strip()
    prenom = (request.data.get("prenom") or "").strip()
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password") or ""
    code_massar = (request.data.get("code_massar") or "").strip()
    filiere_id = request.data.get("filiere_id")

    if not all([nom, prenom, code_massar, filiere_id]):
        return Response(
            {"message": "Nom, prénom, code Massar et filière sont requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    filiere = Filiere.objects.filter(id=filiere_id).first()
    if not filiere:
        return Response({"message": "Filière introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        with transaction.atomic():
            user = etudiant.user
            user.nom = nom
            user.prenom = prenom
            if email:
                user.email = email
            if password:
                user.set_password(password)
            user.save()

            etudiant.code_massar = code_massar
            etudiant.filiere = filiere
            etudiant.save()
    except IntegrityError:
        return Response(
            {"message": "Un utilisateur avec cet email ou ce code Massar existe déjà."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    modules = modules_for_student(etudiant, None)
    return Response(
        serialize_etudiant(etudiant, modules, request),
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE", "POST"])
def delete_etudiant(request, etudiant_id):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Accès réservé à l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    etudiant = Etudiant.objects.filter(id=etudiant_id).select_related("user").first()
    if not etudiant:
        return Response({"message": "Étudiant introuvable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        with transaction.atomic():
            user = etudiant.user
            user.delete()
    except Exception as e:
        return Response(
            {"message": f"Erreur lors de la suppression : {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"message": "Étudiant supprimé avec succès."}, status=status.HTTP_200_OK)


@api_view(["POST"])
def bulk_delete_etudiants(request):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Accès réservé à l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    ids = request.data.get("ids", [])
    if not ids:
        return Response(
            {"message": "Aucun étudiant sélectionné."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            etudiants = Etudiant.objects.filter(id__in=ids).select_related("user")
            users_to_delete = [e.user for e in etudiants]
            for user in users_to_delete:
                user.delete()
    except Exception as e:
        return Response(
            {"message": f"Erreur lors de la suppression en masse : {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({"message": "Étudiants supprimés avec succès."}, status=status.HTTP_200_OK)
