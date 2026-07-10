from datetime import date, datetime, time, timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from gestion_presence.models import (
    User, Enseignant, Etudiant, Filiere, Module, Cours, Seance, TemporarySeance, Presence, TemporaryPresence, QRCode
)

class DashboardViewTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin
        self.admin_user = User.objects.create_user(
            email="admin@example.com",
            password="password123",
            nom="Admin",
            prenom="User",
            role=User.Role.ADMIN,
            is_staff=True,
            is_active=True
        )

        # Create Teacher
        self.teacher_user = User.objects.create_user(
            email="teacher@example.com",
            password="password123",
            nom="Teacher",
            prenom="User",
            role=User.Role.ENSEIGNANT,
            is_active=True
        )
        self.teacher_profile = Enseignant.objects.create(user=self.teacher_user)

        # Create Filiere and Module
        self.filiere = Filiere.objects.create(nom="SDIA", semesters=["S1", "S2"])
        self.module = Module.objects.create(nom="Python Development", filiere=self.filiere, semestre="S1")

        # Create Student
        self.student_user = User.objects.create_user(
            email="student@example.com",
            password="password123",
            nom="Student",
            prenom="User",
            role=User.Role.ETUDIANT,
            is_active=True
        )
        self.student_profile = Etudiant.objects.create(
            user=self.student_user,
            code_massar="R123456789",
            filiere=self.filiere
        )

        # Create Cours
        self.cours = Cours.objects.create(
            module=self.module,
            enseignant=self.teacher_profile,
            salle="Salle 3",
            jour=1, # Lundi
            heure_debut=time(8, 30),
            heure_fin=time(10, 30),
            actif=True
        )

        # Create Seance
        today = date.today()
        heure_debut_dt = timezone.make_aware(datetime.combine(today, time(8, 30)))
        self.seance = Seance.objects.create(
            cours=self.cours,
            enseignant=self.teacher_profile,
            date_seance=today,
            heure_debut=heure_debut_dt,
            validite_min=120,
            est_ouverte=True
        )

        # Create QRCode for Seance
        self.qrcode = QRCode.objects.create(
            url_cible="http://example.com/scan/abc",
            token="abc",
            expiration=timezone.now() + timedelta(hours=2),
            seance=self.seance
        )

        # Create Presence
        self.presence = Presence.objects.create(
            etudiant=self.student_profile,
            seance=self.seance,
            statut=Presence.Statut.PRESENT,
            heure_validation=timezone.now()
        )

        # Create Temporary Seance
        self.temp_seance = TemporarySeance.objects.create(
            date_seance=today,
            heure_debut=timezone.now() - timedelta(minutes=30),
            heure_fin=timezone.now() + timedelta(minutes=90),
            est_ouverte=True,
            token_qr="temp-token-xyz",
            qr_expiration=timezone.now() + timedelta(minutes=90),
            validite_min=120,
            max_distance=20,
            salle="Salle 4",
            module=self.module,
            enseignant=self.teacher_profile
        )

        # Create Temporary Presence
        self.temp_presence = TemporaryPresence.objects.create(
            etudiant=self.student_profile,
            seance=self.temp_seance,
            statut=TemporaryPresence.Statut.PRESENT,
            heure_validation=timezone.now()
        )

    def test_dashboard_view_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify stats and analytics keys
        data = response.json()
        self.assertIn("stats", data)
        self.assertIn("analytics", data)
        self.assertIn("seances", data)
        self.assertEqual(data["stats"]["totalStudents"], 1)
        self.assertEqual(data["stats"]["totalTeachers"], 1)
        self.assertEqual(data["stats"]["totalCourses"], 1)

    def test_dashboard_view_teacher(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn("stats", data)
        self.assertIn("seances", data)
        # Teacher view should not contain global student/teacher/course counts or analytics
        self.assertNotIn("analytics", data)
        self.assertEqual(data["stats"]["totalSeances"], 2)

    def test_dashboard_view_forbidden_for_student(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_custom_export_student(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            "/api/dashboard/export/",
            {"scope": "student", "student_id": self.student_profile.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        self.assertTrue(response["Content-Disposition"].startswith("attachment; filename="))

    def test_custom_export_class(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            "/api/dashboard/export/",
            {"scope": "class", "filiere_id": self.filiere.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    def test_custom_export_teacher(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            "/api/dashboard/export/",
            {"scope": "teacher", "enseignant_id": self.teacher_profile.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    def test_custom_export_invalid_scope(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            "/api/dashboard/export/",
            {"scope": "invalid-scope"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
