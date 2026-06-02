from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_presence", "0005_cours_assignment_constraint"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="cours",
            name="unique_cours_assignment",
        ),
        migrations.RemoveField(
            model_name="cours",
            name="filiere",
        ),
        migrations.AddConstraint(
            model_name="cours",
            constraint=models.UniqueConstraint(
                fields=("module", "enseignant", "jour", "heure_debut"),
                name="unique_cours_assignment",
            ),
        ),
    ]
