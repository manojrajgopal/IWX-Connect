import time

from django.conf import settings
from django.core.cache import cache
from rest_framework.exceptions import Throttled


def _client_key(request) -> str:
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        return f"u:{user.id}"
    return f"ip:{request.META.get('REMOTE_ADDR', 'unknown')}"


def enforce(request, scope: str = "default"):
    limit, window = settings.RATE_LIMITS.get(scope, settings.RATE_LIMITS["default"])
    key = f"rl:{scope}:{_client_key(request)}:{int(time.time() // window)}"
    try:
        count = (cache.get(key) or 0) + 1
        cache.set(key, count, timeout=window)
    except Exception:
        return
    if count > limit:
        raise Throttled(detail={"code": "rate_limited", "scope": scope})
