from django.db import models

from .enseignant import Enseignant
from .filiere import Filiere
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
    filiere = models.ForeignKey(
        Filiere,
        on_delete=models.PROTECT,
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
        unique_together = ("module", "filiere", "enseignant", "jour", "heure_debut")

    def save(self, *args, **kwargs):
        if self.module_id and not self.filiere_id:
            self.filiere = self.module.filiere

        if self.module_id and self.filiere_id and self.module.filiere_id != self.filiere_id:
            raise ValueError("La filiere du cours doit correspondre a la filiere du module.")

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.module.nom} - {self.filiere} - {self.enseignant}"
