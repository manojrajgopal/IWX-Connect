from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.core.exceptions import ok

from .models import Device, Session


@api_view(["GET"])
def list_sessions(request):
    sessions = Session.objects.filter(user=request.user, revoked_at__isnull=True).select_related("device")
    return ok([
        {
            "id": str(s.public_id),
            "device": {"id": str(s.device.public_id), "user_agent": s.device.user_agent, "trusted": s.device.trusted},
            "ip_class": s.ip_class,
            "created_at": s.created_at,
            "last_used_at": s.last_used_at,
        }
        for s in sessions
    ])


@api_view(["POST"])
def revoke_session(request, public_id: str):
    n = Session.objects.filter(user=request.user, public_id=public_id, revoked_at__isnull=True).update(
        revoked_at=__import__("django.utils.timezone", fromlist=["timezone"]).now(),
        revoke_reason="manual",
    )
    return Response({"ok": bool(n)})


@api_view(["GET"])
def list_devices(request):
    devices = Device.objects.filter(user=request.user)
    return ok([
        {"id": str(d.public_id), "user_agent": d.user_agent, "trusted": d.trusted, "last_seen_at": d.last_seen_at}
        for d in devices
    ])
