from django.db import models

from .etudiant import Etudiant
from .seance import Seance


class Presence(models.Model):
    class Statut(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        RETARD = "retard", "Retard"

    heure_validation = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.PRESENT,
    )
    etudiant = models.ForeignKey(
        Etudiant,
        on_delete=models.CASCADE,
        related_name="presences",
    )
    seance = models.ForeignKey(
        Seance,
        on_delete=models.CASCADE,
        related_name="presences",
    )

    class Meta:
        db_table = "presences"
        ordering = ["-heure_validation"]
        unique_together = ("etudiant", "seance")

    def __str__(self) -> str:
        return f"{self.etudiant} - {self.seance} [{self.statut}]"
