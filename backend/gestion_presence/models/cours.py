from django.db import models
from django.core.exceptions import ValidationError

from .enseignant import Enseignant
from .module import Module


class Cours(models.Model):
    class Jour(models.IntegerChoices):
        LUNDI = 1, "Lundi"
        MARDI = 2, "Mardi"
        MERCREDI = 3, "Mercredi"
        JEUDI = 4, "Jeudi"
        VENDREDI = 5, "Vendredi"
        SAMEDI = 6, "Samedi"

    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="cours",
    )
    enseignant = models.ForeignKey(
        Enseignant,
        on_delete=models.CASCADE,
        related_name="cours",
    )
    salle = models.CharField(max_length=50, blank=True)
    jour = models.PositiveSmallIntegerField(choices=Jour.choices)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    actif = models.BooleanField(default=True)

    class Meta:
        db_table = "cours"
        ordering = ["jour", "heure_debut", "module__nom"]
        constraints = [
            models.UniqueConstraint(
                fields=["module", "enseignant", "jour", "heure_debut"],
                name="unique_cours_assignment",
            ),
        ]

    def clean(self):
        if self.heure_debut and self.heure_fin:
            if self.heure_fin <= self.heure_debut:
                raise ValidationError({"heure_fin": "L'heure de fin doit etre apres l'heure de debut."})

            # Timetable overlap validation
            qs = Cours.objects.filter(jour=self.jour, actif=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)

            for existing in qs:
                # Overlap logic: (start1 < end2) and (start2 < end1)
                if (self.heure_debut < existing.heure_fin) and (existing.heure_debut < self.heure_fin):
                    # 1. Teacher busy
                    if self.enseignant_id == existing.enseignant_id:
                        raise ValidationError(
                            f"L'enseignant {self.enseignant} a déjà un cours de {existing.heure_debut.strftime('%H:%M')} à {existing.heure_fin.strftime('%H:%M')} ce jour-là."
                        )
                    # 2. Room occupied
                    if self.salle and existing.salle and self.salle.strip() and existing.salle.strip():
                        if self.salle.strip().lower() == existing.salle.strip().lower():
                            raise ValidationError(
                                f"La salle '{self.salle}' est déjà occupée de {existing.heure_debut.strftime('%H:%M')} à {existing.heure_fin.strftime('%H:%M')} ce jour-là."
                            )
                    # 3. Class (Filiere + Semestre) busy
                    if self.module.filiere_id == existing.module.filiere_id and self.module.semestre == existing.module.semestre:
                        raise ValidationError(
                            f"La filière {self.module.filiere.nom} ({self.module.semestre}) a déjà un cours de {existing.heure_debut.strftime('%H:%M')} à {existing.heure_fin.strftime('%H:%M')} ce jour-là."
                        )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.module.nom} - {self.module.filiere} - {self.enseignant}"
