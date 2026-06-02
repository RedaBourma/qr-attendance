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
        if self.heure_debut and self.heure_fin and self.heure_fin <= self.heure_debut:
            raise ValidationError({"heure_fin": "L'heure de fin doit etre apres l'heure de debut."})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.module.nom} - {self.module.filiere} - {self.enseignant}"
