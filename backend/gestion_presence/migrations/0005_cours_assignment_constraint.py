from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_presence", "0004_user_profile_picture"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="cours",
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name="cours",
            constraint=models.UniqueConstraint(
                fields=("module", "filiere", "enseignant", "jour", "heure_debut"),
                name="unique_cours_assignment",
            ),
        ),
    ]
