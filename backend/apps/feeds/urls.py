from django.urls import path

from . import views

urlpatterns = [
    path("", views.feed),
    path("stories", views.stories),
    path("posts", views.create_post),
    path("posts/<uuid:public_id>/like", views.toggle_like),
    path("posts/<uuid:public_id>/comments", views.comments),
    path("stories/<uuid:public_id>/view", views.view_story),
]
