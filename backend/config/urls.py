from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/security/", include("apps.security.urls")),
    path("api/connections/", include("apps.connections.urls")),
    path("api/chats/", include("apps.chats.urls")),
    path("api/feeds/", include("apps.feeds.urls")),
    path("api/media/", include("apps.media.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
