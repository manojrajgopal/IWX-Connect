import secrets
import time
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.core.utils import stable_hash
from apps.security.models import Session
from apps.security.services.device import get_or_create_device
from apps.security.tokens import derive_session_key, sign_access_token, verify_access_token

SESSION_COOKIE = "iwx_sid"


def _classify_ip(request) -> str:
    ip = request.META.get("REMOTE_ADDR", "") or ""
    return ".".join(ip.split(".")[:2]) if "." in ip else ip[:8]


def _hash_secret(secret: str) -> str:
    return stable_hash("session", secret)


def create_session(user, request) -> tuple[Session, str]:
    device = get_or_create_device(user, request)
    secret = secrets.token_urlsafe(48)
    sess = Session.objects.create(
        user=user,
        device=device,
        secret_hash=_hash_secret(secret),
        ip_class=_classify_ip(request),
        expires_at=timezone.now() + timedelta(days=settings.SESSION_TTL_DAYS),
    )
    request._iwx_session_secret = secret  # used by attach_session_cookie
    request._iwx_session = sess
    access = issue_access_token(sess, request, session_secret=secret)
    return sess, access


def attach_session_cookie(response, sess: Session):
    secret = getattr(sess, "_iwx_emit_secret", None) or getattr(sess, "_iwx_session_secret", None)
    cookie_value = f"{sess.public_id}.{secret}" if secret else None
    if not cookie_value:
        return
    response.set_cookie(
        SESSION_COOKIE,
        cookie_value,
        max_age=settings.SESSION_TTL_DAYS * 86400,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="Lax",
    )


def clear_session_cookie(response):
    response.delete_cookie(SESSION_COOKIE)


def parse_session_cookie(request) -> Session | None:
    raw = request.COOKIES.get(SESSION_COOKIE)
    if not raw or "." not in raw:
        return None
    pid, secret = raw.split(".", 1)
    sess = Session.objects.select_related("user", "device").filter(public_id=pid, revoked_at__isnull=True).first()
    if not sess:
        return None
    if sess.expires_at < timezone.now():
        return None
    if sess.secret_hash != _hash_secret(secret):
        return None
    request._iwx_session_secret = secret
    return sess


def get_current(request) -> Session | None:
    sess = getattr(request, "_iwx_session", None)
    if sess:
        return sess
    sess = parse_session_cookie(request)
    if sess:
        request._iwx_session = sess
    return sess


def issue_access_token(sess: Session, request, session_secret: str | None = None) -> str:
    secret = session_secret or getattr(request, "_iwx_session_secret", None)
    if not secret:
        raise ValueError("Session secret missing")
    key = derive_session_key(secret.encode(), sess.device.secret.encode())
    payload = {
        "sub": str(sess.user.public_id),
        "sid": str(sess.public_id),
        "did": str(sess.device.public_id),
        "ip": sess.ip_class,
        "iat": int(time.time()),
        "exp": int(time.time()) + settings.ACCESS_TOKEN_TTL_SECONDS,
    }
    return sign_access_token(payload, key)


def verify_access(token: str, request) -> tuple["User", Session] | tuple[None, None]:  # type: ignore
    sess = parse_session_cookie(request)
    if not sess:
        return None, None
    key = derive_session_key(request._iwx_session_secret.encode(), sess.device.secret.encode())
    payload = verify_access_token(token, key)
    if not payload:
        return None, None
    if payload.get("sid") != str(sess.public_id):
        return None, None
    if payload.get("did") != str(sess.device.public_id):
        return None, None
    if payload.get("ip") != sess.ip_class:
        return None, None
    sess.save(update_fields=["last_used_at"])
    return sess.user, sess


def revoke_current(request, reason: str = "user_logout"):
    sess = get_current(request)
    if not sess:
        return
    sess.revoked_at = timezone.now()
    sess.revoke_reason = reason
    sess.save(update_fields=["revoked_at", "revoke_reason"])
