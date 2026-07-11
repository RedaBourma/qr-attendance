from django.db import migrations


def populate_salles(apps, schema_editor):
    Salle = apps.get_model("gestion_presence", "Salle")

    # Predefined classrooms (Salle 1 to Salle 10)
    salles = [f"Salle {i}" for i in range(1, 11)]
    # Predefined auditoriums (Amphi A to Amphi H)
    amphis = [f"Amphi {char}" for char in "ABCDEFGH"]

    for nom in salles + amphis:
        Salle.objects.get_or_create(nom=nom)


def reverse_salles(apps, schema_editor):
    Salle = apps.get_model("gestion_presence", "Salle")
    Salle.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_presence", "0018_salle"),
    ]

    operations = [
        migrations.RunPython(populate_salles, reverse_code=reverse_salles),
    ]
