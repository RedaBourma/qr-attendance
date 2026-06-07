from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.decorators import parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


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


@api_view(["POST"])
def change_password_view(request):
    user = request.user
    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")

    if not current_password or not new_password:
        return Response(
            {"message": "Le mot de passe actuel et le nouveau mot de passe sont requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.check_password(current_password):
        return Response(
            {"message": "Le mot de passe actuel est incorrect."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(new_password) < 6:
        return Response(
            {"message": "Le nouveau mot de passe doit contenir au moins 6 caractères."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()

    return Response({"message": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request_view(request):
    email = (request.data.get("email") or "").strip()
    if not email:
        return Response(
            {"message": "L'adresse e-mail est obligatoire."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    success_msg = "Si un compte est associé à cette adresse e-mail, un e-mail de réinitialisation vous a été envoyé."
    user = User.objects.filter(email__iexact=email).first()

    if user:
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        frontend_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
        reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"
        
        subject = "Réinitialisation de votre mot de passe"
        message = (
            f"Bonjour {user.prenom} {user.nom},\n\n"
            "Vous avez demandé la réinitialisation de votre mot de passe pour votre compte QR Attendance.\n"
            "Veuillez cliquer sur le lien ci-dessous pour choisir un nouveau mot de passe :\n\n"
            f"{reset_link}\n\n"
            "Ce lien expirera dans quelques heures.\n"
            "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.\n\n"
            "Cordialement,\n"
            "L'équipe QR Attendance"
        )
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending password reset email: {e}")

    return Response({"message": success_msg}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    uid = request.data.get("uid")
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not all([uid, token, new_password]):
        return Response(
            {"message": "UID, token et nouveau mot de passe sont requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(new_password) < 6:
        return Response(
            {"message": "Le nouveau mot de passe doit contenir au moins 6 caractères."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.filter(pk=pk).first()
    except (TypeError, ValueError, OverflowError):
        user = None

    if user is None or not default_token_generator.check_token(user, token):
        return Response(
            {"message": "Le lien de réinitialisation est invalide ou a expiré."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()

    return Response(
        {"message": "Votre mot de passe a été réinitialisé avec succès."},
        status=status.HTTP_200_OK,
    )

