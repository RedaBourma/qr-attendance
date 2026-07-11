from django.db import models


class Salle(models.Model):
    nom = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "salles"
        ordering = ["id"]

    def __str__(self) -> str:
        return self.nom
