from django.urls import path

from . import views

urlpatterns = [
    path("", views.list_conversations),
    path("direct", views.open_direct),
    path("unread-summary", views.unread_summary),
    path("<uuid:public_id>/messages", views.list_messages),
    path("<uuid:public_id>/messages/send", views.send),
    path("<uuid:public_id>/read", views.mark_read),
    path("<uuid:public_id>/delivered", views.mark_delivered),
]
