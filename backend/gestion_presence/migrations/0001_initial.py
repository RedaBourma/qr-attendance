# Generated for the current model structure.

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
                ("nom", models.CharField(max_length=100)),
                ("prenom", models.CharField(max_length=100)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("role", models.CharField(choices=[("admin", "Admin"), ("enseignant", "Enseignant"), ("etudiant", "Etudiant")], max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now)),
                ("groups", models.ManyToManyField(blank=True, help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.", related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("user_permissions", models.ManyToManyField(blank=True, help_text="Specific permissions for this user.", related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={
                "db_table": "users",
                "ordering": ["nom", "prenom"],
            },
        ),
        migrations.CreateModel(
            name="Admin",
            fields=[],
            options={
                "verbose_name": "Admin",
                "verbose_name_plural": "Admins",
                "ordering": ["nom", "prenom"],
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("gestion_presence.user",),
        ),
        migrations.CreateModel(
            name="Filiere",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nom", models.CharField(max_length=100, unique=True)),
            ],
            options={
                "db_table": "filieres",
                "ordering": ["nom"],
            },
        ),
        migrations.CreateModel(
            name="Enseignant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="enseignant_profile", to="gestion_presence.user")),
            ],
            options={
                "db_table": "enseignants",
                "ordering": ["user__nom", "user__prenom"],
            },
        ),
        migrations.CreateModel(
            name="Cours",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nomModule", models.CharField(max_length=150)),
                ("semestre", models.CharField(max_length=30)),
                ("enseignant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="cours", to="gestion_presence.enseignant")),
                ("filiere", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="cours", to="gestion_presence.filiere")),
            ],
            options={
                "db_table": "cours",
                "ordering": ["nomModule", "semestre"],
            },
        ),
        migrations.CreateModel(
            name="Etudiant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code_massar", models.CharField(max_length=30, unique=True)),
                ("semester", models.CharField(max_length=20)),
                ("niveau", models.CharField(max_length=20)),
                ("filiere", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="etudiants", to="gestion_presence.filiere")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="etudiant_profile", to="gestion_presence.user")),
            ],
            options={
                "db_table": "etudiants",
                "ordering": ["user__nom", "user__prenom"],
            },
        ),
        migrations.CreateModel(
            name="Seance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date_seance", models.DateField()),
                ("heure_debut", models.DateTimeField()),
                ("est_ouverte", models.BooleanField(default=False)),
                ("token_qr", models.CharField(blank=True, max_length=255)),
                ("validite_min", models.PositiveIntegerField(default=15)),
                ("cours", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="seances", to="gestion_presence.cours")),
                ("enseignant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="seances", to="gestion_presence.enseignant")),
            ],
            options={
                "db_table": "seances",
                "ordering": ["-date_seance", "-heure_debut"],
            },
        ),
        migrations.CreateModel(
            name="QRCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("url_cible", models.URLField(max_length=500)),
                ("token", models.CharField(max_length=255, unique=True)),
                ("expiration", models.DateTimeField()),
                ("seance", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="qrcode", to="gestion_presence.seance")),
            ],
            options={
                "db_table": "qrcodes",
                "ordering": ["-expiration"],
            },
        ),
        migrations.CreateModel(
            name="Presence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("heure_validation", models.DateTimeField(auto_now_add=True)),
                ("statut", models.CharField(choices=[("present", "Present"), ("absent", "Absent"), ("retard", "Retard")], default="present", max_length=20)),
                ("etudiant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="presences", to="gestion_presence.etudiant")),
                ("seance", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="presences", to="gestion_presence.seance")),
            ],
            options={
                "db_table": "presences",
                "ordering": ["-heure_validation"],
                "unique_together": {("etudiant", "seance")},
            },
        ),
    ]
