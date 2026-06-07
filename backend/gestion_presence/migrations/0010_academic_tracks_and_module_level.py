from django.db import migrations, models


def level_from_semester(semester):
    normalized = (semester or "").upper().replace(" ", "")
    if normalized in {"S1", "S2"}:
        return "Licence 1"
    if normalized in {"S3", "S4"}:
        return "Licence 2"
    if normalized in {"S5", "S6"}:
        return "Licence 3"
    if normalized in {"M1-S1", "M1S1", "M1-S2", "M1S2"}:
        return "Master 1"
    if normalized in {"M2-S3", "M2S3", "M2-S4", "M2S4"}:
        return "Master 2"
    return "Licence 1"


def populate_academic_defaults(apps, schema_editor):
    Filiere = apps.get_model("gestion_presence", "Filiere")
    Module = apps.get_model("gestion_presence", "Module")

    for filiere in Filiere.objects.all():
        if not filiere.formations:
            filiere.formations = ["LF"]
            filiere.save(update_fields=["formations"])

    for module in Module.objects.all():
        module.niveau = level_from_semester(module.semestre)
        module.save(update_fields=["niveau"])


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_presence", "0009_temporaryseance_qr_expiration"),
    ]

    operations = [
        migrations.AddField(
            model_name="filiere",
            name="formations",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="module",
            name="niveau",
            field=models.CharField(default="Licence 1", max_length=50),
        ),
        migrations.RunPython(populate_academic_defaults, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name="module",
            unique_together={("nom", "filiere", "niveau", "semestre")},
        ),
        migrations.AlterModelOptions(
            name="module",
            options={"ordering": ["filiere__nom", "niveau", "semestre", "nom"]},
        ),
    ]
