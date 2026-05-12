from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class Connection(TimestampedModel):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    BLOCKED = "blocked"
    STATUSES = [(PENDING, "pending"), (ACCEPTED, "accepted"), (REJECTED, "rejected"), (BLOCKED, "blocked")]

    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="connections_sent")
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="connections_received")
    status = models.CharField(max_length=12, choices=STATUSES, default=PENDING, db_index=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "connections_connection"
        unique_together = (("requester", "receiver"),)
        indexes = [models.Index(fields=["receiver", "status"]), models.Index(fields=["requester", "status"])]


class Block(TimestampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_made")
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_against")

    class Meta:
        db_table = "connections_block"
        unique_together = (("user", "blocked"),)
