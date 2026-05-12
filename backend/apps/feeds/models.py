from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class Post(TimestampedModel):
    POST = "post"
    REEL = "reel"
    STORY = "story"
    KINDS = [(POST, "post"), (REEL, "reel"), (STORY, "story")]

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts")
    kind = models.CharField(max_length=8, choices=KINDS, default=POST, db_index=True)
    caption = models.TextField(blank=True, default="")
    media_url = models.CharField(max_length=300, blank=True, default="")
    thumbnail_url = models.CharField(max_length=300, blank=True, default="")
    duration_ms = models.IntegerField(default=0)
    visibility = models.CharField(max_length=12, default="connections")
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "feeds_post"
        indexes = [models.Index(fields=["kind", "-created_at"])]


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "feeds_like"
        unique_together = (("post", "user"),)


class Comment(TimestampedModel):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="replies")

    class Meta:
        db_table = "feeds_comment"


class StoryView(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="views")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "feeds_story_view"
        unique_together = (("post", "user"),)


class Bookmark(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="bookmarks")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "feeds_bookmark"
        unique_together = (("post", "user"),)
        indexes = [models.Index(fields=["user", "-at"])]
