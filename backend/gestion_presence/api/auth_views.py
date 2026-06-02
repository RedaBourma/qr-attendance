from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.decorators import parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


def serialize_user(user, request=None):
    profile_picture = None

    if user.profile_picture:
        profile_picture = user.profile_picture.url

        if request is not None:
            profile_picture = request.build_absolute_uri(profile_picture)

    return {
        "id": user.id,
        "email": user.email,
        "nom": user.nom,
        "prenom": user.prenom,
        "role": user.role,
        "profile_picture": profile_picture,
    }

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"message": "email et mot de passe requis."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        return Response(
            {"message": "Identifiants incorrects."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    
    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": serialize_user(user, request),
    })


@api_view(["GET", "PATCH", "DELETE"])
@parser_classes([MultiPartParser, FormParser])
def me_view(request):
    user = request.user

    if request.method == "GET":
        return Response({"user": serialize_user(user, request)})

    if request.method == "DELETE":
        if user.profile_picture:
            user.profile_picture.delete(save=False)
            user.profile_picture = None
            user.save(update_fields=["profile_picture"])

        return Response({"user": serialize_user(user, request)})

    profile_picture = request.FILES.get("profile_picture")

    if not profile_picture:
        return Response(
            {"message": "profile_picture est requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.profile_picture:
        user.profile_picture.delete(save=False)

    user.profile_picture = profile_picture
    user.save(update_fields=["profile_picture"])

    return Response({"user": serialize_user(user, request)})

