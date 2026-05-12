import secrets

from apps.core.utils import stable_hash
from apps.security.models import Device


def fingerprint(request) -> str:
    ua = request.META.get("HTTP_USER_AGENT", "")
    al = request.META.get("HTTP_ACCEPT_LANGUAGE", "")
    return stable_hash(ua, al)


def get_or_create_device(user, request) -> Device:
    fp = fingerprint(request)
    dev = Device.objects.filter(user=user, fingerprint=fp).first()
    if dev:
        dev.save(update_fields=["last_seen_at"])
        return dev
    return Device.objects.create(
        user=user,
        fingerprint=fp,
        user_agent=(request.META.get("HTTP_USER_AGENT", "") or "")[:400],
        accept_language=(request.META.get("HTTP_ACCEPT_LANGUAGE", "") or "")[:200],
        secret=secrets.token_urlsafe(48),
    )
