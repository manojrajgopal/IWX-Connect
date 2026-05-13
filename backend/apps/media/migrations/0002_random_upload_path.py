import apps.core.utils
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("media_app", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mediaasset",
            name="file",
            field=models.FileField(upload_to=apps.core.utils.RandomFileName("assets")),
        ),
    ]
