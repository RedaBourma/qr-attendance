import django.db.models.deletion
from django.db import migrations, models


def forwards_create_modules(apps, schema_editor):
    Cours = apps.get_model("gestion_presence", "Cours")
    Module = apps.get_model("gestion_presence", "Module")

    for cours in Cours.objects.all():
        module, _ = Module.objects.get_or_create(
            nom=cours.nomModule,
            filiere_id=cours.filiere_id,
            semestre=cours.semestre,
        )
        cours.module_id = module.id
        cours.save(update_fields=["module"])


def backwards_restore_cours_fields(apps, schema_editor):
    Cours = apps.get_model("gestion_presence", "Cours")

    for cours in Cours.objects.select_related("module").all():
        if cours.module_id:
            cours.nomModule = cours.module.nom
            cours.filiere_id = cours.module.filiere_id
            cours.semestre = cours.module.semestre
            cours.save(update_fields=["nomModule", "filiere", "semestre"])


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_presence", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Module",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nom", models.CharField(max_length=150)),
                ("semestre", models.CharField(max_length=30)),
                (
                    "filiere",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="modules",
                        to="gestion_presence.filiere",
                    ),
                ),
            ],
            options={
                "db_table": "modules",
                "ordering": ["nom", "semestre"],
                "unique_together": {("nom", "filiere", "semestre")},
            },
        ),
        migrations.AddField(
            model_name="cours",
            name="module",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="cours",
                to="gestion_presence.module",
            ),
        ),
        migrations.RunPython(forwards_create_modules, backwards_restore_cours_fields),
        migrations.AlterField(
            model_name="cours",
            name="module",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="cours",
                to="gestion_presence.module",
            ),
        ),
        migrations.RemoveField(
            model_name="cours",
            name="filiere",
        ),
        migrations.RemoveField(
            model_name="cours",
            name="nomModule",
        ),
        migrations.RemoveField(
            model_name="cours",
            name="semestre",
        ),
        migrations.AlterModelOptions(
            name="cours",
            options={"ordering": ["module__nom", "module__semestre"]},
        ),
        migrations.AlterUniqueTogether(
            name="cours",
            unique_together={("module", "enseignant")},
        ),
    ]
