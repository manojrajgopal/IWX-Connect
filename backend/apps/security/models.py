import uuid

from django.conf import settings
from django.db import models


class Device(models.Model):
    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="devices")
    fingerprint = models.CharField(max_length=128, db_index=True)
    user_agent = models.CharField(max_length=400, blank=True, default="")
    accept_language = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    trusted = models.BooleanField(default=False)
    secret = models.CharField(max_length=128)

    class Meta:
        db_table = "security_device"
        unique_together = (("user", "fingerprint"),)


class Session(models.Model):
    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions")
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="sessions")
    secret_hash = models.CharField(max_length=128)
    ip_class = models.CharField(max_length=16, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoke_reason = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        db_table = "security_session"
        indexes = [models.Index(fields=["user", "revoked_at"])]


class AuditLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs")
    event = models.CharField(max_length=64, db_index=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=400, blank=True, default="")
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    prev_hash = models.CharField(max_length=64, blank=True, default="")
    row_hash = models.CharField(max_length=64, db_index=True)

    class Meta:
        db_table = "security_audit_log"
        ordering = ("id",)


class RateLimitBucket(models.Model):
    key = models.CharField(max_length=128, primary_key=True)
    tokens = models.FloatField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "security_rate_bucket"
