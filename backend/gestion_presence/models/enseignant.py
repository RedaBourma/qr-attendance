from django.conf import settings
from django.db import models


class Enseignant(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enseignant_profile",
    )
    filieres = models.ManyToManyField(
        "gestion_presence.Filiere",
        related_name="enseignants",
        blank=True,
    )
    modules = models.ManyToManyField(
        "gestion_presence.Module",
        related_name="enseignants",
        blank=True,
    )

    class Meta:
        db_table = "enseignants"
        ordering = ["user__nom", "user__prenom"]

    def __str__(self) -> str:
        return f"{self.user.prenom} {self.user.nom}"
