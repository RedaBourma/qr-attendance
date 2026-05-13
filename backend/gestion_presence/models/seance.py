from django.db import models

from .cours import Cours
from .enseignant import Enseignant


class Seance(models.Model):
    date_seance = models.DateField()
    heure_debut = models.DateTimeField()
    est_ouverte = models.BooleanField(default=False)
    token_qr = models.CharField(max_length=255, blank=True)
    validite_min = models.PositiveIntegerField(default=15)
    cours = models.ForeignKey(
        Cours,
        on_delete=models.CASCADE,
        related_name="seances",
    )
    enseignant = models.ForeignKey(
        Enseignant,
        on_delete=models.CASCADE,
        related_name="seances",
    )

    class Meta:
        db_table = "seances"
        ordering = ["-date_seance", "-heure_debut"]

    def __str__(self) -> str:
        return f"Seance {self.cours.module.nom} - {self.date_seance}"
