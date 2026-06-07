from django.db import models
from django.utils import timezone

from .enseignant import Enseignant
from .etudiant import Etudiant
from .module import Module


class TemporarySeance(models.Model):
    date_seance = models.DateField()
    heure_debut = models.DateTimeField()
    heure_fin = models.DateTimeField()
    est_ouverte = models.BooleanField(default=True)
    token_qr = models.CharField(max_length=255, blank=True, null=True, unique=True)
    qr_expiration = models.DateTimeField(blank=True, null=True)
    validite_min = models.PositiveIntegerField(default=120)
    salle = models.CharField(max_length=50, blank=True)
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="temporary_seances",
    )
    enseignant = models.ForeignKey(
        Enseignant,
        on_delete=models.CASCADE,
        related_name="temporary_seances",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    class Meta:
        db_table = "temporary_seances"
        ordering = ["-date_seance", "-heure_debut"]

    @property
    def expiration(self):
        return self.qr_expiration or self.heure_fin

    @property
    def est_expiree(self) -> bool:
        return timezone.now() >= self.expiration

    def __str__(self) -> str:
        return f"Temporaire {self.module.nom} - {self.date_seance}"


class TemporaryPresence(models.Model):
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
    device_uuid = models.CharField(max_length=255, blank=True, null=True)
    etudiant = models.ForeignKey(
        Etudiant,
        on_delete=models.CASCADE,
        related_name="temporary_presences",
    )
    seance = models.ForeignKey(
        TemporarySeance,
        on_delete=models.CASCADE,
        related_name="presences",
    )

    class Meta:
        db_table = "temporary_presences"
        ordering = ["-heure_validation"]
        unique_together = ("etudiant", "seance")

    def __str__(self) -> str:
        return f"{self.etudiant} - {self.seance} [{self.statut}]"
