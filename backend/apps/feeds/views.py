from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.connections.models import Connection
from apps.core.exceptions import ok
from apps.realtime.broadcast import push_to_user

from .models import Comment, Like, Post, StoryView
from .serializers import CommentSerializer, PostSerializer


def _connected_user_ids(user):
    qs = Connection.objects.filter(status=Connection.ACCEPTED).filter(
        Q(requester=user) | Q(receiver=user)
    )
    ids = set()
    for c in qs:
        ids.add(c.requester_id if c.receiver_id == user.id else c.receiver_id)
    ids.add(user.id)
    return ids


@api_view(["GET"])
def feed(request):
    kind = request.GET.get("kind", Post.POST)
    ids = _connected_user_ids(request.user)
    qs = Post.objects.filter(author_id__in=ids, kind=kind).order_by("-created_at")[:30]
    return ok(PostSerializer(qs, many=True).data)


@api_view(["GET"])
def stories(request):
    ids = _connected_user_ids(request.user)
    qs = Post.objects.filter(
        author_id__in=ids,
        kind=Post.STORY,
        expires_at__gt=timezone.now(),
    ).order_by("author_id", "-created_at")
    return ok(PostSerializer(qs, many=True).data)


@api_view(["POST"])
def create_post(request):
    data = request.data
    post = Post.objects.create(
        author=request.user,
        kind=data.get("kind", Post.POST),
        caption=data.get("caption", ""),
        media_url=data.get("media_url", ""),
        thumbnail_url=data.get("thumbnail_url", ""),
        duration_ms=int(data.get("duration_ms") or 0),
        visibility=data.get("visibility", "connections"),
        expires_at=data.get("expires_at"),
    )
    return ok(PostSerializer(post).data, status_code=201)


@api_view(["POST"])
def toggle_like(request, public_id: str):
    post = Post.objects.filter(public_id=public_id).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found"}}, status=404)
    existing = Like.objects.filter(post=post, user=request.user).first()
    if existing:
        existing.delete()
        return ok({"liked": False})
    Like.objects.create(post=post, user=request.user)
    if post.author_id != request.user.id:
        push_to_user(post.author_id, "feed.like", {"by": request.user.username, "post": str(post.public_id)})
    return ok({"liked": True})


@api_view(["GET", "POST"])
def comments(request, public_id: str):
    post = Post.objects.filter(public_id=public_id).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found"}}, status=404)
    if request.method == "POST":
        c = Comment.objects.create(post=post, author=request.user, body=request.data.get("body", "")[:2000])
        if post.author_id != request.user.id:
            push_to_user(post.author_id, "feed.comment", {"by": request.user.username, "post": str(post.public_id)})
        return ok(CommentSerializer(c).data, status_code=201)
    qs = post.comments.order_by("-created_at")[:50]
    return ok(CommentSerializer(qs, many=True).data)


@api_view(["POST"])
def view_story(request, public_id: str):
    post = Post.objects.filter(public_id=public_id, kind=Post.STORY).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found"}}, status=404)
    StoryView.objects.get_or_create(post=post, user=request.user)
    return ok({"viewed": True})
