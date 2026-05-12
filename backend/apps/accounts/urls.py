from django.urls import path

from . import views

urlpatterns = [
    path("signup", views.signup),
    path("login", views.login),
    path("logout", views.logout),
    path("refresh", views.refresh),
    path("me", views.me),
    path("me/profile", views.update_profile),
    path("me/preferences", views.preferences),
]
