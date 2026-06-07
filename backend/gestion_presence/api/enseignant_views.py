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
    }


@api_view(["GET"])
def list_enseignants(request):
    if request.user.role != User.Role.ADMIN:
        return Response(
            {"message": "Acces reserve a l'admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    enseignants = Enseignant.objects.select_related("user").prefetch_related("cours").all()
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
