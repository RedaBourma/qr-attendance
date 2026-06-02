from django.urls import path
from gestion_presence.api.auth_views import login_view, me_view
from gestion_presence.api.dashboard_views import dashboard_view
from gestion_presence.api.enseignant_views import create_enseignant, list_enseignants
from gestion_presence.api.etudiant_views import list_etudiants
from gestion_presence.api.qrcode_views import (
    close_qr_session,
    current_qr_session,
    export_qr_session,
    generate_qr_for_cours,
    qr_session_detail,
    scan_qr_info,
    submit_qr_scan,
)
from gestion_presence.api.seance_views import (
    create_temporary_seance,
    list_seances,
    teaching_filters,
)

urlpatterns = [
    path("login/", login_view, name="login"),
    path("me/", me_view, name="me"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path("seances/", list_seances, name="list_seances"),
    path("seances/filters/", teaching_filters, name="teaching_filters"),
    path("seances/temporary/", create_temporary_seance, name="create_temporary_seance"),
    path("seances/generate-qr/", generate_qr_for_cours, name="generate_qr_for_cours"),
    path("qrcode/current/", current_qr_session, name="current_qr_session"),
    path("qrcode/<int:seance_id>/", qr_session_detail, name="qr_session_detail"),
    path("qrcode/<int:seance_id>/close/", close_qr_session, name="close_qr_session"),
    path("qrcode/<int:seance_id>/export/", export_qr_session, name="export_qr_session"),
    path("scan/<str:token>/", scan_qr_info, name="scan_qr_info"),
    path("scan/<str:token>/submit/", submit_qr_scan, name="submit_qr_scan"),
    path("enseignants/", list_enseignants, name="list_enseignants"),
    path("enseignants/create/", create_enseignant, name="create_enseignant"),
    path("etudiants/", list_etudiants, name="list_etudiants"),
]
