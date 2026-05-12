from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.exceptions import ok

from .models import Notification, PushSubscription


@api_view(["GET"])
def list_notifications(request):
    qs = request.user.notifications.order_by("-created_at")[:50]
    return ok([
        {"id": str(n.public_id), "kind": n.kind, "payload": n.payload, "seen": bool(n.seen_at), "created_at": n.created_at}
        for n in qs
    ])


@api_view(["POST"])
def mark_seen(request):
    Notification.objects.filter(user=request.user, seen_at__isnull=True).update(seen_at=timezone.now())
    return ok({"marked": True})


@api_view(["GET"])
def vapid_key(request):
    return ok({"public_key": settings.VAPID_PUBLIC_KEY})


@api_view(["POST"])
def subscribe_push(request):
    endpoint = request.data.get("endpoint")
    keys = request.data.get("keys", {})
    if not endpoint or not keys.get("p256dh") or not keys.get("auth"):
        return Response({"ok": False, "error": {"code": "invalid", "message": "Bad subscription"}}, status=400)
    PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={"user": request.user, "p256dh": keys["p256dh"], "auth": keys["auth"]},
    )
    return ok({"subscribed": True})


@api_view(["POST"])
def unsubscribe_push(request):
    endpoint = request.data.get("endpoint")
    PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
    return ok({"unsubscribed": True})
