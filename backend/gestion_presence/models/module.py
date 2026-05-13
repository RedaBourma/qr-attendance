from django.db import models

from .filiere import Filiere


class Module(models.Model):
    nom = models.CharField(max_length=150)
    filiere = models.ForeignKey(
        Filiere,
        on_delete=models.PROTECT,
        related_name="modules",
    )
    semestre = models.CharField(max_length=30)

    class Meta:
        db_table = "modules"
        ordering = ["nom", "semestre"]
        unique_together = ("nom", "filiere", "semestre")

    def __str__(self) -> str:
        return f"{self.nom} - {self.filiere} ({self.semestre})"
