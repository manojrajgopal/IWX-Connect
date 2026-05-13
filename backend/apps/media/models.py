import uuid

from django.conf import settings
from django.db import models

from apps.core.utils import RandomFileName


class MediaAsset(models.Model):
    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="media_assets")
    file = models.FileField(upload_to=RandomFileName("assets"))
    mime = models.CharField(max_length=100)
    size = models.BigIntegerField()
    width = models.IntegerField(default=0)
    height = models.IntegerField(default=0)
    duration_ms = models.IntegerField(default=0)
    sha256 = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "media_asset"
