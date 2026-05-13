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
        ("Personal info", {"fields": ("nom", "prenom", "role")}),
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


admin.site.register(Filiere)
admin.site.register(Module)
admin.site.register(Cours)
admin.site.register(Etudiant)
admin.site.register(Enseignant)
admin.site.register(Presence)
# admin.site.register(Groupe)
admin.site.register(Seance)
admin.site.register(QRCode)