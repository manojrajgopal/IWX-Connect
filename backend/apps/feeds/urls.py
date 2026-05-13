from django.urls import path

from . import views

urlpatterns = [
    path("", views.feed),
    path("explore", views.explore),
    path("stories", views.stories),
    path("posts", views.create_post),
    path("posts/<uuid:public_id>", views.post_detail),
    path("posts/<uuid:public_id>/like", views.toggle_like),
    path("posts/<uuid:public_id>/save", views.toggle_bookmark),
    path("posts/<uuid:public_id>/comments", views.comments),
    path("stories/<uuid:public_id>/view", views.view_story),
    path("stories/<uuid:public_id>/viewers", views.story_viewers),
    path("posts/<uuid:public_id>/viewers", views.post_viewers),
    path("bookmarks", views.list_bookmarks),
    path("users/<str:username>/posts", views.user_posts),
]
