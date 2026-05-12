from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class Notification(TimestampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    kind = models.CharField(max_length=48, db_index=True)
    payload = models.JSONField(default=dict)
    seen_at = models.DateTimeField(null=True, blank=True)
    delivered_in_app = models.BooleanField(default=False)
    delivered_push = models.BooleanField(default=False)

    class Meta:
        db_table = "notifications_notification"
        indexes = [models.Index(fields=["user", "-created_at"])]


class PushSubscription(TimestampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.URLField(max_length=600, unique=True)
    p256dh = models.CharField(max_length=200)
    auth = models.CharField(max_length=200)

    class Meta:
        db_table = "notifications_push_subscription"
