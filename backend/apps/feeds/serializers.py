from rest_framework import serializers

from apps.accounts.serializers import UserPublicSerializer

from .models import Comment, Post


class PostSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True, source="likes.count")
    comments_count = serializers.IntegerField(read_only=True, source="comments.count")

    class Meta:
        model = Post
        fields = (
            "public_id", "kind", "caption", "media_url", "thumbnail_url", "duration_ms",
            "visibility", "expires_at", "author", "likes_count", "comments_count", "created_at",
        )


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ("public_id", "body", "author", "parent", "created_at")
