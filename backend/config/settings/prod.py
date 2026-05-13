from .base import *  # noqa

DEBUG = False

# Render sets PORT env var
import os
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",") if h.strip()]

# Whitenoise for serving static files on Render
MIDDLEWARE.insert(
    MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Trust the Render proxy
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Cookie settings for cross-site (frontend on different domain)
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "")
if FRONTEND_ORIGIN:
    CORS_ALLOWED_ORIGINS = [FRONTEND_ORIGIN]
    SESSION_COOKIE_DOMAIN = None
    CSRF_TRUSTED_ORIGINS = [FRONTEND_ORIGIN]

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SAMESITE = "None"
