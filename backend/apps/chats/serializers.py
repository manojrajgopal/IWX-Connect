from rest_framework import serializers

from apps.accounts.serializers import UserPublicSerializer

from .models import Conversation, Message
from .services import decrypt_body


class MessageSerializer(serializers.ModelSerializer):
    body = serializers.SerializerMethodField()
    sender = UserPublicSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("public_id", "kind", "body", "sender", "media_ref", "reply_to", "edited_at", "deleted_at", "created_at")

    def get_body(self, obj: Message) -> str:
        if obj.deleted_at:
            return ""
        return decrypt_body(obj.conversation, obj)


class ConversationSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    unread = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("public_id", "kind", "title", "members", "last_message_at", "unread")

    def get_members(self, obj):
        return UserPublicSerializer([m.user for m in obj.memberships.all()], many=True).data

    def get_unread(self, obj):
        user = self.context.get("user")
        if not user:
            return 0
        m = obj.memberships.filter(user=user).first()
        last = m.last_read_message_id if m else 0
        return obj.messages.filter(id__gt=(last or 0)).exclude(sender=user).count()
