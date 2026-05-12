from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.connections import repositories as conn_repo
from apps.security import crypto

from .models import Conversation, Membership, Message, Receipt


def get_or_create_direct(user_a, user_b) -> Conversation:
    if not conn_repo.are_connected(user_a, user_b):
        raise PermissionError("Not connected")
    existing = (
        Conversation.objects.filter(kind=Conversation.DIRECT, memberships__user=user_a)
        .filter(memberships__user=user_b)
        .first()
    )
    if existing:
        return existing
    with transaction.atomic():
        data_key = crypto.generate_data_key()
        conv = Conversation.objects.create(kind=Conversation.DIRECT, data_key_wrapped=crypto.wrap_key(data_key))
        Membership.objects.bulk_create([
            Membership(conversation=conv, user=user_a),
            Membership(conversation=conv, user=user_b),
        ])
        return conv


def is_member(conv: Conversation, user) -> bool:
    return conv.memberships.filter(user=user).exists()


def send_message(conv: Conversation, sender, kind: str, body: str, media_ref: str = "", reply_to=None) -> Message:
    if not is_member(conv, sender):
        raise PermissionError("Not a member")
    data_key = crypto.unwrap_key(bytes(conv.data_key_wrapped))
    aad = f"conv:{conv.public_id}".encode()
    body_ct = crypto.encrypt(data_key, body.encode("utf-8"), aad=aad)
    msg = Message.objects.create(
        conversation=conv,
        sender=sender,
        kind=kind,
        body_encrypted=body_ct,
        media_ref=media_ref,
        reply_to=reply_to,
    )
    conv.last_message_at = timezone.now()
    conv.save(update_fields=["last_message_at"])
    return msg


def decrypt_body(conv: Conversation, msg: Message) -> str:
    data_key = crypto.unwrap_key(bytes(conv.data_key_wrapped))
    aad = f"conv:{conv.public_id}".encode()
    return crypto.decrypt(data_key, bytes(msg.body_encrypted), aad=aad).decode("utf-8")


def mark_read(conv: Conversation, user, up_to_message_id: int):
    Membership.objects.filter(conversation=conv, user=user).update(last_read_message_id=up_to_message_id)
    last_msgs = Message.objects.filter(conversation=conv, id__lte=up_to_message_id).exclude(sender=user)
    Receipt.objects.bulk_create(
        [Receipt(message=m, user=user, kind=Receipt.READ) for m in last_msgs],
        ignore_conflicts=True,
    )


def list_user_conversations(user):
    return (
        Conversation.objects.filter(memberships__user=user)
        .order_by("-last_message_at")
        .prefetch_related("memberships__user__profile")
    )
