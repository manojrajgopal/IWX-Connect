import apps.core.utils
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_add_preference_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="avatar",
            field=models.ImageField(blank=True, null=True, upload_to=apps.core.utils.RandomFileName("avatars")),
        ),
        migrations.AlterField(
            model_name="profile",
            name="cover",
            field=models.ImageField(blank=True, null=True, upload_to=apps.core.utils.RandomFileName("covers")),
        ),
    ]
