from django.db import models


class Filiere(models.Model):
    nom = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "filieres"
        ordering = ["nom"]

    def __str__(self) -> str:
        return self.nom
