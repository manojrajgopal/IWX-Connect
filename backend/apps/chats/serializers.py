from rest_framework import serializers

from apps.accounts.serializers import UserPublicSerializer

from .models import Conversation, Message, Receipt
from .services import decrypt_body


class MessageSerializer(serializers.ModelSerializer):
    body = serializers.SerializerMethodField()
    sender = UserPublicSerializer(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ("id", "public_id", "kind", "body", "sender", "media_ref", "reply_to", "edited_at", "deleted_at", "created_at", "status")

    def get_body(self, obj: Message) -> str:
        if obj.deleted_at:
            return ""
        return decrypt_body(obj.conversation, obj)

    def get_status(self, obj: Message) -> str:
        """Return message status using prefetched receipts when available."""
        # Use prefetched receipts if available to avoid N+1
        if hasattr(obj, '_prefetched_objects_cache') and 'receipts' in obj._prefetched_objects_cache:
            receipts = obj._prefetched_objects_cache['receipts']
            kinds = {r.kind for r in receipts}
            if Receipt.READ in kinds:
                return "read"
            if Receipt.DELIVERED in kinds:
                return "delivered"
            return "sent"
        # Fallback: single query with exists
        if Receipt.objects.filter(message=obj, kind=Receipt.READ).exists():
            return "read"
        if Receipt.objects.filter(message=obj, kind=Receipt.DELIVERED).exists():
            return "delivered"
        return "sent"


class ConversationSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("public_id", "kind", "title", "members", "last_message_at", "unread", "last_message")

    def get_members(self, obj):
        return UserPublicSerializer([m.user for m in obj.memberships.all()], many=True).data

    def get_unread(self, obj):
        user = self.context.get("user")
        if not user:
            return 0
        # Use prefetched memberships
        membership = None
        for m in obj.memberships.all():
            if m.user_id == user.id:
                membership = m
                break
        last = membership.last_read_message_id if membership else 0
        return obj.messages.filter(id__gt=(last or 0)).exclude(sender=user).count()

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-id").first()
        if not msg:
            return None
        try:
            body = decrypt_body(obj, msg)
        except Exception:
            body = ""
        return {
            "body": body[:80] if body else "",
            "sender": msg.sender.username if msg.sender else None,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
