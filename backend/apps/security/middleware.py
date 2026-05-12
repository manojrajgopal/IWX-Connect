from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework.exceptions import Throttled

from .services.ratelimit import enforce


class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("X-Frame-Options", "DENY")
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        return response


class RateLimitMiddleware(MiddlewareMixin):
    def process_request(self, request):
        try:
            enforce(request, "default")
        except Throttled:
            return JsonResponse(
                {"ok": False, "error": {"code": "rate_limited", "message": "Too many requests"}},
                status=429,
            )


class SessionTokenMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._iwx_session = None


class AuditTrailMiddleware(MiddlewareMixin):
    SENSITIVE_PREFIXES = ("/api/auth/", "/api/security/")

    def process_response(self, request, response):
        if request.path.startswith(self.SENSITIVE_PREFIXES) and 200 <= response.status_code < 300:
            user = getattr(request, "user", None)
            if user and getattr(user, "is_authenticated", False):
                from .services.audit import log_event
                log_event(user, f"http.{request.method.lower()}", request, {"path": request.path})
        return response
