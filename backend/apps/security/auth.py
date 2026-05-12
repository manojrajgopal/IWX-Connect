from rest_framework import authentication, exceptions

from .services import session as session_service


class SessionTokenAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth.startswith(self.keyword + " "):
            return None
        token = auth[len(self.keyword) + 1:].strip()
        if not token:
            return None
        user, sess = session_service.verify_access(token, request)
        if not user:
            raise exceptions.AuthenticationFailed({"code": "invalid_token", "detail": "Invalid or expired token"})
        request._iwx_session = sess
        return (user, sess)

    def authenticate_header(self, request):
        return self.keyword
