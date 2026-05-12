import hashlib
import json

from django.db import transaction

from apps.security.models import AuditLog


def _row_hash(prev_hash: str, payload: dict) -> str:
    h = hashlib.sha256()
    h.update(prev_hash.encode())
    h.update(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode())
    return h.hexdigest()


def log_event(user, event: str, request, payload: dict | None = None):
    payload = payload or {}
    ip = request.META.get("REMOTE_ADDR") if request is not None else None
    ua = (request.META.get("HTTP_USER_AGENT", "") if request is not None else "")[:400]
    with transaction.atomic():
        last = AuditLog.objects.select_for_update().order_by("-id").first()
        prev = last.row_hash if last else ""
        body = {
            "user_id": getattr(user, "id", None),
            "event": event,
            "ip": ip,
            "ua": ua,
            "payload": payload,
        }
        digest = _row_hash(prev, body)
        AuditLog.objects.create(
            user=user if getattr(user, "id", None) else None,
            event=event,
            ip=ip,
            user_agent=ua,
            payload=payload,
            prev_hash=prev,
            row_hash=digest,
        )
