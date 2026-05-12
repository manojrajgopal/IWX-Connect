import json

from django.conf import settings

from apps.realtime.broadcast import push_to_user

from .models import Notification, PushSubscription


def notify(user, kind: str, payload: dict | None = None):
    payload = payload or {}
    notif = Notification.objects.create(user=user, kind=kind, payload=payload, delivered_in_app=True)
    push_to_user(user.id, "notification.new", {
        "id": str(notif.public_id),
        "kind": kind,
        "payload": payload,
        "created_at": notif.created_at.isoformat(),
    })
    _send_web_push(user, kind, payload)
    return notif


def _send_web_push(user, kind: str, payload: dict):
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        return
    try:
        from py_vapid import Vapid
        import http_ece
        import base64
        import os
        import requests
    except Exception:
        return
    subs = PushSubscription.objects.filter(user=user)
    if not subs.exists():
        return
    body = json.dumps({"kind": kind, "payload": payload}).encode()
    vapid = Vapid.from_string(settings.VAPID_PRIVATE_KEY)
    for s in subs:
        try:
            salt = os.urandom(16)
            encrypted = http_ece.encrypt(
                body,
                salt=salt,
                private_key=None,
                dh=base64.urlsafe_b64decode(s.p256dh + "=="),
                auth_secret=base64.urlsafe_b64decode(s.auth + "=="),
                version="aes128gcm",
            )
            headers = vapid.sign({"aud": s.endpoint.split("/")[0] + "//" + s.endpoint.split("/")[2], "sub": settings.VAPID_SUBJECT})
            headers.update({"Content-Encoding": "aes128gcm", "TTL": "60"})
            requests.post(s.endpoint, data=encrypted, headers=headers, timeout=4)
        except Exception:
            continue
