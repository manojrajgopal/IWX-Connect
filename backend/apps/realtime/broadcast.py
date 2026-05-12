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
