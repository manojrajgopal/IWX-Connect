from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.serializers import UserPublicSerializer
from apps.core.exceptions import ok
from apps.core.utils import normalize_username
from apps.notifications.services import notify
from apps.realtime.broadcast import push_to_user

from . import repositories
from .models import Block, Connection


def _err(code, msg, status=400):
    return Response({"ok": False, "error": {"code": code, "message": msg}}, status=status)


@api_view(["POST"])
def send_request(request):
    username = normalize_username(request.data.get("username", ""))
    if not username:
        return _err("invalid", "Username required")
    target = User.objects.filter(username=username).first()
    if not target:
        return _err("not_found", "User not found", 404)
    if target.id == request.user.id:
        return _err("invalid", "Cannot connect to yourself")
    if repositories.is_blocked(request.user, target):
        return _err("blocked", "Action not allowed", 403)
    existing = repositories.existing_between(request.user, target)
    if existing:
        if existing.status == Connection.ACCEPTED:
            return _err("already_connected", "Already connected", 409)
        if existing.status == Connection.PENDING:
            return _err("pending", "Request already pending", 409)
        existing.status = Connection.PENDING
        existing.requester = request.user
        existing.receiver = target
        existing.accepted_at = None
        existing.save()
        conn = existing
    else:
        conn = Connection.objects.create(requester=request.user, receiver=target, status=Connection.PENDING)
    notify(target, "connection.request", {"from": request.user.username, "connection_id": str(conn.public_id)})
    push_to_user(target.id, "connection.request", {"id": str(conn.public_id), "from": request.user.username})
    return ok({"id": str(conn.public_id), "status": conn.status})


@api_view(["POST"])
def respond(request, public_id: str):
    action = request.data.get("action")
    if action not in {"accept", "reject"}:
        return _err("invalid", "Action must be accept or reject")
    conn = Connection.objects.filter(public_id=public_id, receiver=request.user, status=Connection.PENDING).first()
    if not conn:
        return _err("not_found", "Request not found", 404)
    if action == "accept":
        conn.status = Connection.ACCEPTED
        conn.accepted_at = timezone.now()
    else:
        conn.status = Connection.REJECTED
    conn.save()
    notify(conn.requester, f"connection.{action}", {"by": request.user.username})
    push_to_user(conn.requester.id, f"connection.{action}", {"by": request.user.username})
    return ok({"id": str(conn.public_id), "status": conn.status})


@api_view(["GET"])
def list_pending(request):
    qs = Connection.objects.filter(receiver=request.user, status=Connection.PENDING).select_related("requester__profile")
    return ok([
        {"id": str(c.public_id), "from": UserPublicSerializer(c.requester).data, "created_at": c.created_at}
        for c in qs
    ])


@api_view(["GET"])
def list_friends(request):
    qs = Connection.objects.filter(status=Connection.ACCEPTED).filter(
        Q(requester=request.user) | Q(receiver=request.user)
    ).select_related("requester__profile", "receiver__profile")
    out = []
    for c in qs:
        other = c.receiver if c.requester_id == request.user.id else c.requester
        out.append(UserPublicSerializer(other).data)
    return ok(out)


@api_view(["POST"])
def block(request, username: str):
    target = User.objects.filter(username=normalize_username(username)).first()
    if not target:
        return _err("not_found", "User not found", 404)
    Block.objects.get_or_create(user=request.user, blocked=target)
    Connection.objects.filter(
        __import__("django.db.models", fromlist=["Q"]).Q(requester=request.user, receiver=target) |
        Q(requester=request.user, receiver=target) | 
    return ok({"blocked": True})


@api_view(["GET"])
def search_users(request):
    q = normalize_username(request.GET.get("q", ""))
    if len(q) < 2:
        return ok([])
    qs = User.objects.filter(username__startswith=q).exclude(id=request.user.id)[:20]
    return ok(UserPublicSerializer(qs, many=True).data)
