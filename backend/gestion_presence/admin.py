from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

# from .models import Cours, Enseignant, Etudiant, Filiere, Module, User
from .models import  *


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = ("email", "nom", "prenom", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    ordering = ("nom", "prenom")
    search_fields = ("email", "nom", "prenom")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("nom", "prenom", "role", "profile_picture")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "nom", "prenom", "role", "password1", "password2"),
            },
        ),
    )


@admin.register(Filiere)
class FiliereAdmin(admin.ModelAdmin):
    list_display = ("nom", "semesters")
    search_fields = ("nom",)


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("nom", "filiere", "semestre")
    list_filter = ("filiere", "semestre")
    search_fields = ("nom", "filiere__nom", "semestre")


@admin.register(Cours)
class CoursAdmin(admin.ModelAdmin):
    list_display = ("module", "module_filiere", "module_semestre", "enseignant", "jour", "heure_debut", "heure_fin", "salle", "actif")
    list_filter = ("enseignant", "module__filiere", "module__semestre", "jour", "actif")
    fields = ("module", "enseignant", "jour", "heure_debut", "heure_fin", "salle", "actif")
    search_fields = (
        "module__nom",
        "module__filiere__nom",
        "module__semestre",
        "enseignant__user__nom",
        "enseignant__user__prenom",
        "enseignant__user__email",
        "salle",
    )
    ordering = ("jour", "heure_debut", "enseignant__user__nom", "module__nom")
    list_select_related = ("module", "module__filiere", "enseignant", "enseignant__user")

    @admin.display(description="Filiere", ordering="module__filiere__nom")
    def module_filiere(self, cours):
        return cours.module.filiere

    @admin.display(description="Semestre", ordering="module__semestre")
    def module_semestre(self, cours):
        return cours.module.semestre


@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display = ("student_name", "code_massar", "filiere")
    list_filter = ("filiere",)
    search_fields = ("user__nom", "user__prenom", "user__email", "code_massar", "filiere__nom")
    fields = ("user", "code_massar", "filiere")
    list_select_related = ("user", "filiere")

    @admin.display(description="Etudiant", ordering="user__nom")
    def student_name(self, etudiant):
        return f"{etudiant.user.prenom} {etudiant.user.nom}".strip()


admin.site.register(Enseignant)
admin.site.register(Presence)
# admin.site.register(Groupe)
admin.site.register(Seance)
admin.site.register(QRCode)


@admin.register(TemporarySeance)
class TemporarySeanceAdmin(admin.ModelAdmin):
    list_display = ("module", "enseignant", "date_seance", "heure_debut", "heure_fin", "qr_expiration", "salle", "est_ouverte")
    list_filter = ("enseignant", "module__filiere", "module__semestre", "est_ouverte")
    search_fields = (
        "module__nom",
        "module__filiere__nom",
        "enseignant__user__nom",
        "enseignant__user__prenom",
        "salle",
        "token_qr",
    )
    ordering = ("-date_seance", "-heure_debut")
    list_select_related = ("module", "module__filiere", "enseignant", "enseignant__user")


@admin.register(TemporaryPresence)
class TemporaryPresenceAdmin(admin.ModelAdmin):
    list_display = ("etudiant", "seance", "statut", "heure_validation")
    list_filter = ("statut", "seance__module__filiere", "seance__module__semestre")
    search_fields = (
        "etudiant__user__nom",
        "etudiant__user__prenom",
        "etudiant__code_massar",
        "seance__module__nom",
    )
    ordering = ("-heure_validation",)
    list_select_related = ("etudiant", "etudiant__user", "seance", "seance__module")
