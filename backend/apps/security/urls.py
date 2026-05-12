from django.urls import path

from . import views

urlpatterns = [
    path("sessions", views.list_sessions),
    path("sessions/<uuid:public_id>/revoke", views.revoke_session),
    path("devices", views.list_devices),
]
