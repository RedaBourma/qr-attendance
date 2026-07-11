from django.conf import settings
from django.db import models

from .filiere import Filiere


class Etudiant(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="etudiant_profile",
    )
    code_massar = models.CharField(max_length=30, unique=True)
    filiere = models.ForeignKey(
        Filiere,
        on_delete=models.PROTECT,
        related_name="etudiants",
    )
    semestre = models.CharField(max_length=30, blank=True, null=True)
    modules = models.ManyToManyField(
        "Module",
        related_name="etudiants",
        blank=True,
    )

    class Meta:
        db_table = "etudiants"
        ordering = ["user__nom", "user__prenom"]

    def __str__(self) -> str:
        return f"{self.user.prenom} {self.user.nom} ({self.code_massar})"
