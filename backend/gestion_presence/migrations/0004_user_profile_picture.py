from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gestion_presence", "0003_cours_schedule_etudiant_modules"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="profile_picture",
            field=models.ImageField(blank=True, null=True, upload_to="profile_pictures/"),
        ),
    ]
