from django.shortcuts import redirect
from django.conf import settings

def home_redirect(request):
    frontend_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    return redirect(f"{frontend_url}/login")