from django.db import migrations


FORMATION_ALIASES = {
    "LF": "L",
}

NIVEAU_ALIASES = {
    "Licence Excellence 3": "Licence d'excellence 3",
}


def normalize_formations(formations):
    if not isinstance(formations, list):
        return ["L"]

    normalized = []
    for code in formations:
        mapped = FORMATION_ALIASES.get(code, code)
        if mapped not in normalized:
            normalized.append(mapped)

    return normalized or ["L"]


def migrate_academic_codes(apps, schema_editor):
    Filiere = apps.get_model("gestion_presence", "Filiere")
    Module = apps.get_model("gestion_presence", "Module")
    Etudiant = apps.get_model("gestion_presence", "Etudiant")

    for filiere in Filiere.objects.all():
        updated = normalize_formations(filiere.formations)
        if updated != filiere.formations:
            filiere.formations = updated
            filiere.save(update_fields=["formations"])

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
        ("gestion_presence", "0010_academic_tracks_and_module_level"),
    ]

    operations = [
        migrations.RunPython(migrate_academic_codes, migrations.RunPython.noop),
    ]
