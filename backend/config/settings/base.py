import base64
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


def env(key: str, default=None):
    return os.environ.get(key, default)


def env_bool(key: str, default: bool = False) -> bool:
    return str(os.environ.get(key, str(int(default)))).lower() in {"1", "true", "yes", "on"}


def env_list(key: str, default=""):
    raw = os.environ.get(key, default)
    return [v.strip() for v in raw.split(",") if v.strip()]


SECRET_KEY = env("DJANGO_SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "channels",
    "apps.core",
    "apps.accounts",
    "apps.security",
    "apps.connections",
    "apps.chats",
    "apps.feeds",
    "apps.media",
    "apps.notifications",
    "apps.realtime",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.security.middleware.SecurityHeadersMiddleware",
    "apps.security.middleware.RateLimitMiddleware",
    "apps.security.middleware.SessionTokenMiddleware",
    "apps.security.middleware.AuditTrailMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASE_URL = env("DATABASE_URL", "postgres://iwx:iwx@localhost:5432/iwx_connect")
_db_default = {
    "ENGINE": "django.db.backends.postgresql",
    "OPTIONS": {"sslmode": "prefer"},
    "CONN_MAX_AGE": 60,
}
import urllib.parse as _u
_p = _u.urlparse(DATABASE_URL)
DATABASES = {
    "default": {
        **_db_default,
        "NAME": _p.path.lstrip("/"),
        "USER": _p.username or "",
        "PASSWORD": _p.password or "",
        "HOST": _p.hostname or "",
        "PORT": str(_p.port or ""),
    }
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "iwx-connect-default",
    }
}

AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.security.auth.SessionTokenAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "EXCEPTION_HANDLER": "apps.core.exceptions.envelope_exception_handler",
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "uploads"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

FRONTEND_ORIGIN = env("FRONTEND_ORIGIN", "http://localhost:5173")
CORS_ALLOWED_ORIGINS = [FRONTEND_ORIGIN]
CORS_ALLOW_CREDENTIALS = True

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 0 if DEBUG else 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

ACCESS_TOKEN_TTL_SECONDS = int(env("ACCESS_TOKEN_TTL_SECONDS", "600"))
SESSION_TTL_DAYS = int(env("SESSION_TTL_DAYS", "30"))

_master = env("ENCRYPTION_MASTER_KEY", "base64:" + base64.b64encode(b"\x00" * 32).decode())
if _master.startswith("base64:"):
    ENCRYPTION_MASTER_KEY = base64.b64decode(_master.split(":", 1)[1])
else:
    ENCRYPTION_MASTER_KEY = _master.encode()
if len(ENCRYPTION_MASTER_KEY) != 32:
    raise RuntimeError("ENCRYPTION_MASTER_KEY must be 32 bytes (AES-256)")

VAPID_PUBLIC_KEY = env("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = env("VAPID_PRIVATE_KEY", "")
VAPID_SUBJECT = env("VAPID_SUBJECT", "mailto:admin@iwx.local")

RATE_LIMITS = {
    "auth.login": (10, 60),
    "auth.signup": (5, 3600),
    "chats.send": (60, 60),
    "default": (300, 60),
}
