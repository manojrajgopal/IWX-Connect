from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

from .models import Session
from .services.session import SESSION_COOKIE
from .tokens import derive_session_key, verify_access_token


@database_sync_to_async
def _resolve(token: str, sid_cookie: str | None):
    if not token or not sid_cookie or "." not in sid_cookie:
        return None, None
    pid, secret = sid_cookie.split(".", 1)
    sess = Session.objects.select_related("user", "device").filter(public_id=pid, revoked_at__isnull=True).first()
    if not sess:
        return None, None
    key = derive_session_key(secret.encode(), sess.device.secret.encode())
    payload = verify_access_token(token, key)
    if not payload or payload.get("sid") != str(sess.public_id):
        return None, None
    return sess.user, sess


class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        token = None
        qs = parse_qs((scope.get("query_string") or b"").decode())
        if "access" in qs:
            token = qs["access"][0]
        cookies = {}
        for header_name, header_value in scope.get("headers", []):
            if header_name == b"cookie":
                for part in header_value.decode().split(";"):
                    if "=" in part:
                        k, v = part.strip().split("=", 1)
                        cookies[k] = v
        sid = cookies.get(SESSION_COOKIE)
        # Fallback: read session token from query param (mobile cross-origin)
        if not sid and "sid" in qs:
            sid = qs["sid"][0]
        user, sess = await _resolve(token, sid)
        scope["user"] = user
        scope["session"] = sess
        return await super().__call__(scope, receive, send)


def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner)
