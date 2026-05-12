from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.exceptions import ok
from apps.core.utils import normalize_username
from apps.realtime.broadcast import push_to_conversation, push_to_user
from apps.security.services.ratelimit import enforce

from . import services
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


def _err(code, msg, status=400):
    return Response({"ok": False, "error": {"code": code, "message": msg}}, status=status)


@api_view(["GET"])
def list_conversations(request):
    qs = services.list_user_conversations(request.user)
    return ok(ConversationSerializer(qs, many=True, context={"user": request.user}).data)


@api_view(["POST"])
def open_direct(request):
    username = normalize_username(request.data.get("username", ""))
    target = User.objects.filter(username=username).first()
    if not target:
        return _err("not_found", "User not found", 404)
    try:
        conv = services.get_or_create_direct(request.user, target)
    except PermissionError:
        return _err("not_connected", "You must be connected first", 403)
    return ok(ConversationSerializer(conv, context={"user": request.user}).data)


@api_view(["GET"])
def list_messages(request, public_id: str):
    conv = Conversation.objects.filter(public_id=public_id, memberships__user=request.user).first()
    if not conv:
        return _err("not_found", "Conversation not found", 404)
    before = request.GET.get("before")
    qs = conv.messages.order_by("-id")
    if before:
        qs = qs.filter(id__lt=int(before))
    qs = qs[:50]
    return ok(MessageSerializer(reversed(list(qs)), many=True).data)


@api_view(["POST"])
def send(request, public_id: str):
    enforce(request, "chats.send")
    conv = Conversation.objects.filter(public_id=public_id, memberships__user=request.user).first()
    if not conv:
        return _err("not_found", "Conversation not found", 404)
    body = (request.data.get("body") or "").strip()
    kind = request.data.get("kind", Message.TEXT)
    media_ref = request.data.get("media_ref", "")
    if kind == Message.TEXT and not body:
        return _err("invalid", "Empty message")
    msg = services.send_message(conv, request.user, kind, body, media_ref=media_ref)
    payload = MessageSerializer(msg).data
    push_to_conversation(conv.public_id, "message.new", payload)
    for mem in conv.memberships.exclude(user=request.user):
        push_to_user(mem.user_id, "conversation.bump", {"conversation_id": str(conv.public_id), "preview": body[:80]})
    return ok(payload, status_code=201)


@api_view(["POST"])
def mark_read(request, public_id: str):
    conv = Conversation.objects.filter(public_id=public_id, memberships__user=request.user).first()
    if not conv:
        return _err("not_found", "Conversation not found", 404)
    up_to = int(request.data.get("up_to") or 0)
    services.mark_read(conv, request.user, up_to)
    push_to_conversation(conv.public_id, "message.read", {"user": request.user.username, "up_to": up_to})
    return ok({"marked": True})
