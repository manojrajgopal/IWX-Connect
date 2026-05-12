from django.urls import path

from . import views

urlpatterns = [
    path("requests", views.send_request),
    path("requests/pending", views.list_pending),
    path("requests/<uuid:public_id>/respond", views.respond),
    path("friends", views.list_friends),
    path("block/<str:username>", views.block),
    path("search", views.search_users),
]
