from django.conf import settings
from django.db import models

from .filiere import Filiere
from .module import Module


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
    modules = models.ManyToManyField(
        Module,
        blank=True,
        related_name="etudiants",
    )
    semester = models.CharField(max_length=20)
    niveau = models.CharField(max_length=20)

    class Meta:
        db_table = "etudiants"
        ordering = ["user__nom", "user__prenom"]

    def __str__(self) -> str:
        return f"{self.user.prenom} {self.user.nom} ({self.code_massar})"
