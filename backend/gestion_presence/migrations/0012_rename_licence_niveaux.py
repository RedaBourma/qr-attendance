from django.db import migrations


NIVEAU_ALIASES = {
    "Licence 1": "Licence 1ere annee",
    "Licence 2": "Licence 2eme annee",
    "Licence 3": "Licence 3eme annee",
    "Licence Excellence 3": "Licence d'excellence",
    "Licence d'excellence 3": "Licence d'excellence",
}


def rename_niveaux(apps, schema_editor):
    Module = apps.get_model("gestion_presence", "Module")
    Etudiant = apps.get_model("gestion_presence", "Etudiant")

    for module in Module.objects.all():
        new_niveau = NIVEAU_ALIASES.get(module.niveau, module.niveau)
        if new_niveau != module.niveau:
            module.niveau = new_niveau
            module.save(update_fields=["niveau"])

    for etudiant in Etudiant.objects.all():
        new_niveau = NIVEAU_ALIASES.get(etudiant.niveau, etudiant.niveau)
        if new_niveau != etudiant.niveau:
            etudiant.niveau = new_niveau
            etudiant.save(update_fields=["niveau"])


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_presence", "0011_rename_lf_to_licence_code"),
    ]

    operations = [
        migrations.RunPython(rename_niveaux, migrations.RunPython.noop),
    ]
