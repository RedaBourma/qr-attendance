from django.urls import path
from gestion_presence.api.auth_views import login_view
from gestion_presence.api.dashboard_views import dashboard_view
from gestion_presence.api.enseignant_views import create_enseignant, list_enseignants
from gestion_presence.api.etudiant_views import list_etudiants

urlpatterns = [
    path("login/", login_view, name="login"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path("enseignants/", list_enseignants, name="list_enseignants"),
    path("enseignants/create/", create_enseignant, name="create_enseignant"),
    path("etudiants/", list_etudiants, name="list_etudiants"),
]
