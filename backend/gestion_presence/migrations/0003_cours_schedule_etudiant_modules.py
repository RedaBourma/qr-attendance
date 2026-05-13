import datetime

import django.db.models.deletion
from django.db import migrations, models


def forwards_fill_cours_filiere(apps, schema_editor):
    Cours = apps.get_model("gestion_presence", "Cours")

    for cours in Cours.objects.select_related("module").all():
        if cours.module_id:
            cours.filiere_id = cours.module.filiere_id
            cours.save(update_fields=["filiere"])


def forwards_assign_student_modules(apps, schema_editor):
    Etudiant = apps.get_model("gestion_presence", "Etudiant")
    Module = apps.get_model("gestion_presence", "Module")

    for etudiant in Etudiant.objects.all():
        module_ids = Module.objects.filter(filiere_id=etudiant.filiere_id).values_list("id", flat=True)
        etudiant.modules.add(*module_ids)


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_presence", "0002_module_restructure_cours"),
    ]

    operations = [
        migrations.AddField(
            model_name="cours",
            name="actif",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="cours",
            name="filiere",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="cours",
                to="gestion_presence.filiere",
            ),
        ),
        migrations.AddField(
            model_name="cours",
            name="heure_debut",
            field=models.TimeField(default=datetime.time(8, 30)),
        ),
        migrations.AddField(
            model_name="cours",
            name="heure_fin",
            field=models.TimeField(default=datetime.time(10, 30)),
        ),
        migrations.AddField(
            model_name="cours",
            name="jour",
            field=models.PositiveSmallIntegerField(
                choices=[
                    (1, "Lundi"),
                    (2, "Mardi"),
                    (3, "Mercredi"),
                    (4, "Jeudi"),
                    (5, "Vendredi"),
                    (6, "Samedi"),
                ],
                default=1,
            ),
        ),
        migrations.AddField(
            model_name="cours",
            name="salle",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="etudiant",
            name="modules",
            field=models.ManyToManyField(blank=True, related_name="etudiants", to="gestion_presence.module"),
        ),
        migrations.AlterField(
            model_name="cours",
            name="heure_debut",
            field=models.TimeField(),
        ),
        migrations.AlterField(
            model_name="cours",
            name="heure_fin",
            field=models.TimeField(),
        ),
        migrations.AlterField(
            model_name="cours",
            name="jour",
            field=models.PositiveSmallIntegerField(
                choices=[
                    (1, "Lundi"),
                    (2, "Mardi"),
                    (3, "Mercredi"),
                    (4, "Jeudi"),
                    (5, "Vendredi"),
                    (6, "Samedi"),
                ],
            ),
        ),
        migrations.RunPython(forwards_fill_cours_filiere, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="cours",
            name="filiere",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="cours",
                to="gestion_presence.filiere",
            ),
        ),
        migrations.AlterModelOptions(
            name="cours",
            options={"ordering": ["jour", "heure_debut", "module__nom"]},
        ),
        migrations.AlterUniqueTogether(
            name="cours",
            unique_together={("module", "filiere", "enseignant", "jour", "heure_debut")},
        ),
        migrations.RunPython(forwards_assign_student_modules, migrations.RunPython.noop),
    ]
