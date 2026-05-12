from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def _layer():
    return get_channel_layer()


def push_to_user(user_id: int, event: str, payload: dict):
    layer = _layer()
    if not layer:
        return
    async_to_sync(layer.group_send)(f"user.{user_id}", {"type": "fanout", "event": event, "payload": payload})


def push_to_conversation(conversation_public_id, event: str, payload: dict):
    layer = _layer()
    if not layer:
        return
    async_to_sync(layer.group_send)(
        f"chat.{conversation_public_id}",
        {"type": "fanout", "event": event, "payload": payload},
    )


def push_to_post(post_public_id, event: str, payload: dict):
    layer = _layer()
    if not layer:
        return
    async_to_sync(layer.group_send)(
        f"post.{post_public_id}",
        {"type": "fanout", "event": event, "payload": payload},
    )


def push_to_connections(user, event: str, payload: dict, include_self: bool = True):
    """Broadcast an event to all accepted-connection peers of `user`."""
    from django.db.models import Q
    from apps.connections.models import Connection

    sent = set()
    qs = Connection.objects.filter(status=Connection.ACCEPTED).filter(
        Q(requester=user) | Q(receiver=user)
    )
    for c in qs:
        other_id = c.requester_id if c.receiver_id == user.id else c.receiver_id
        if other_id in sent:
            continue
        sent.add(other_id)
        push_to_user(other_id, event, payload)
    if include_self and user.id not in sent:
        push_to_user(user.id, event, payload)
