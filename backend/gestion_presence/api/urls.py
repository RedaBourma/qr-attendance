from django.urls import path
from gestion_presence.api.auth_views import login_view, me_view
from gestion_presence.api.dashboard_views import dashboard_view
from gestion_presence.api.enseignant_views import create_enseignant, list_enseignants, update_enseignant, delete_enseignant
from gestion_presence.api.etudiant_views import create_etudiant, list_etudiants, import_etudiants, update_etudiant, delete_etudiant
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
    academic_management,
    create_academic_cours,
    create_academic_filiere,
    create_academic_module,
    create_temporary_seance,
    filiere_transition_options,
    list_seances,
    teaching_filters,
    transition_academic_semester,
    update_academic_filiere,
    update_academic_cours,
    delete_academic_cours,
)

urlpatterns = [
    path("login/", login_view, name="login"),
    path("me/", me_view, name="me"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path("seances/", list_seances, name="list_seances"),
    path("seances/filters/", teaching_filters, name="teaching_filters"),
    path("seances/academic/", academic_management, name="academic_management"),
    path("seances/academic/filieres/", create_academic_filiere, name="create_academic_filiere"),
    path("seances/academic/filieres/<int:filiere_id>/", update_academic_filiere, name="update_academic_filiere"),
    path(
        "seances/academic/filieres/<int:filiere_id>/transitions/",
        filiere_transition_options,
        name="filiere_transition_options",
    ),
    path("seances/academic/modules/", create_academic_module, name="create_academic_module"),
    path("seances/academic/cours/", create_academic_cours, name="create_academic_cours"),
    path("seances/academic/cours/<int:cours_id>/", update_academic_cours, name="update_academic_cours"),
    path("seances/academic/cours/<int:cours_id>/delete/", delete_academic_cours, name="delete_academic_cours"),
    path("seances/academic/transition/", transition_academic_semester, name="transition_academic_semester"),
    path("seances/temporary/", create_temporary_seance, name="create_temporary_seance"),
    path("seances/generate-qr/", generate_qr_for_cours, name="generate_qr_for_cours"),
    path("qrcode/current/", current_qr_session, name="current_qr_session"),
    path("qrcode/<str:seance_id>/", qr_session_detail, name="qr_session_detail"),
    path("qrcode/<str:seance_id>/close/", close_qr_session, name="close_qr_session"),
    path("qrcode/<str:seance_id>/export/", export_qr_session, name="export_qr_session"),
    path("scan/<str:token>/", scan_qr_info, name="scan_qr_info"),
    path("scan/<str:token>/submit/", submit_qr_scan, name="submit_qr_scan"),
    path("enseignants/", list_enseignants, name="list_enseignants"),
    path("enseignants/create/", create_enseignant, name="create_enseignant"),
    path("enseignants/<int:enseignant_id>/update/", update_enseignant, name="update_enseignant"),
    path("enseignants/<int:enseignant_id>/delete/", delete_enseignant, name="delete_enseignant"),
    path("etudiants/", list_etudiants, name="list_etudiants"),
    path("etudiants/create/", create_etudiant, name="create_etudiant"),
    path("etudiants/import/", import_etudiants, name="import_etudiants"),
    path("etudiants/<int:etudiant_id>/update/", update_etudiant, name="update_etudiant"),
    path("etudiants/<int:etudiant_id>/delete/", delete_etudiant, name="delete_etudiant"),
]
