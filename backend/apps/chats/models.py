from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class Conversation(TimestampedModel):
    DIRECT = "direct"
    GROUP = "group"
    KIND = [(DIRECT, "direct"), (GROUP, "group")]

    kind = models.CharField(max_length=8, choices=KIND, default=DIRECT)
    title = models.CharField(max_length=120, blank=True, default="")
    data_key_wrapped = models.BinaryField()
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "chats_conversation"


class Membership(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=12, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)
    muted_until = models.DateTimeField(null=True, blank=True)
    last_read_message_id = models.BigIntegerField(null=True, blank=True)
    pinned = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)

    class Meta:
        db_table = "chats_membership"
        unique_together = (("conversation", "user"),)
        indexes = [models.Index(fields=["user", "archived"])]


class Message(TimestampedModel):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE = "file"
    KINDS = [(TEXT, "text"), (IMAGE, "image"), (VIDEO, "video"), (AUDIO, "audio"), (FILE, "file")]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="messages")
    kind = models.CharField(max_length=8, choices=KINDS, default=TEXT)
    body_encrypted = models.BinaryField()
    media_ref = models.CharField(max_length=200, blank=True, default="")
    reply_to = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="replies")
    edited_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "chats_message"
        indexes = [models.Index(fields=["conversation", "-created_at"])]


class Receipt(models.Model):
    DELIVERED = "delivered"
    READ = "read"
    KIND = [(DELIVERED, "delivered"), (READ, "read")]

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="receipts")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=KIND)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chats_receipt"
        unique_together = (("message", "user", "kind"),)


class Reaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=16)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chats_reaction"
        unique_together = (("message", "user", "emoji"),)
