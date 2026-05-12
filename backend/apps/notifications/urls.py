from django.urls import path

from . import views

urlpatterns = [
    path("", views.list_notifications),
    path("seen", views.mark_seen),
    path("push/key", views.vapid_key),
    path("push/subscribe", views.subscribe_push),
    path("push/unsubscribe", views.unsubscribe_push),
]
