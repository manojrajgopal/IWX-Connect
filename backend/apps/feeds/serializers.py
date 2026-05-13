from rest_framework import serializers

from apps.accounts.serializers import UserPublicSerializer

from .models import Comment, Post


class PostSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    likes_count = serializers.IntegerField(read_only=True, source="likes.count")
    comments_count = serializers.IntegerField(read_only=True, source="comments.count")
    views_count = serializers.IntegerField(read_only=True, default=0)
    viewed = serializers.BooleanField(read_only=True, default=False)
    liked = serializers.SerializerMethodField()
    saved = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "public_id", "kind", "caption", "media_url", "thumbnail_url", "duration_ms",
            "visibility", "hide_likes", "hide_comments", "allow_comments", "allow_sharing",
            "expires_at", "author", "likes_count", "comments_count",
            "views_count", "viewed", "liked", "saved", "created_at",
        )

    def _user(self):
        request = self.context.get("request")
        return getattr(request, "user", None) if request else None

    def get_liked(self, obj):
        u = self._user()
        if not u or not getattr(u, "is_authenticated", False):
            return False
        return obj.likes.filter(user_id=u.id).exists()

    def get_saved(self, obj):
        u = self._user()
        if not u or not getattr(u, "is_authenticated", False):
            return False
        return obj.bookmarks.filter(user_id=u.id).exists()


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ("public_id", "body", "author", "parent", "created_at")
