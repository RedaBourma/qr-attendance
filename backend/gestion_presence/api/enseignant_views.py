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

    nom = request.data.get("nom")
    prenom = request.data.get("prenom")
    email = request.data.get("email")
    password = request.data.get("password")

    if not all([nom, prenom, email, password]):
        return Response(
            {"message": "nom, prenom, email et password sont requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

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
