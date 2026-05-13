from datetime import timedelta

from django.db.models import Count, Exists, F, OuterRef, Q
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.connections.models import Connection
from apps.core.exceptions import ok
from apps.realtime.broadcast import push_to_connections, push_to_user

from .models import Bookmark, Comment, Like, Post, StoryView
from .serializers import CommentSerializer, PostSerializer


_KIND_EVENT = {Post.POST: "feed.new", Post.REEL: "reel.new", Post.STORY: "story.new"}


def _broadcast_new_post(post):
    event = _KIND_EVENT.get(post.kind, "feed.new")
    payload = {
        "public_id": str(post.public_id),
        "kind": post.kind,
        "author": {
            "username": post.author.username,
            "display_name": post.author.display_name,
        },
    }
    push_to_connections(post.author, event, payload, include_self=True)


def _broadcast_post_update(post, extra: dict):
    payload = {"public_id": str(post.public_id), "kind": post.kind, **extra}
    push_to_connections(post.author, "feed.update", payload, include_self=True)


def _connected_user_ids(user):
    qs = Connection.objects.filter(status=Connection.ACCEPTED).filter(
        Q(requester=user) | Q(receiver=user)
    )
    ids = set()
    for c in qs:
        ids.add(c.requester_id if c.receiver_id == user.id else c.receiver_id)
    ids.add(user.id)
    return ids


def _ctx(request):
    return {"request": request}


@api_view(["GET"])
def feed(request):
    kind = request.GET.get("kind", Post.POST)
    ids = _connected_user_ids(request.user)
    qs = (
        Post.objects.filter(
            Q(author_id__in=ids) | Q(visibility="all"),
            kind=kind,
        )
        .select_related("author__profile")
        .distinct()
        .order_by("-created_at")[:30]
    )
    return ok(PostSerializer(qs, many=True, context=_ctx(request)).data)


@api_view(["GET"])
def explore(request):
    kind = request.GET.get("kind", Post.POST)
    qs = (
        Post.objects.filter(kind=kind)
        .exclude(author__profile__is_private=True)
        .exclude(author=request.user)
        .select_related("author__profile")
        .order_by("-created_at")[:60]
    )
    return ok(PostSerializer(qs, many=True, context=_ctx(request)).data)


@api_view(["GET"])
def stories(request):
    # Clean up expired stories on read
    Post.objects.filter(kind=Post.STORY, expires_at__lte=timezone.now()).delete()
    ids = _connected_user_ids(request.user)
    qs = (
        Post.objects.filter(
            author_id__in=ids,
            kind=Post.STORY,
            expires_at__gt=timezone.now(),
        )
        .select_related("author__profile")
        .annotate(
            views_count=Count("views", filter=~Q(views__user=F("author"))),
            viewed=Exists(
                StoryView.objects.filter(post=OuterRef("pk"), user=request.user)
            ),
        )
        .order_by("author_id", "-created_at")
    )
    return ok(PostSerializer(qs, many=True, context=_ctx(request)).data)


@api_view(["POST"])
def create_post(request):
    data = request.data
    kind = data.get("kind", Post.POST)
    expires_at = data.get("expires_at")
    if kind == Post.STORY and not expires_at:
        expires_at = timezone.now() + timedelta(hours=24)
    post = Post.objects.create(
        author=request.user,
        kind=kind,
        caption=(data.get("caption") or "")[:2200],
        media_url=data.get("media_url", ""),
        thumbnail_url=data.get("thumbnail_url", ""),
        duration_ms=int(data.get("duration_ms") or 0),
        visibility=data.get("visibility", "connections"),
        hide_likes=bool(data.get("hide_likes", False)),
        hide_comments=bool(data.get("hide_comments", False)),
        allow_comments=bool(data.get("allow_comments", True)),
        allow_sharing=bool(data.get("allow_sharing", True)),
        expires_at=expires_at,
    )
    _broadcast_new_post(post)
    return ok(PostSerializer(post, context=_ctx(request)).data, status_code=201)


@api_view(["GET", "DELETE", "PATCH"])
def post_detail(request, public_id: str):
    post = Post.objects.select_related("author__profile").filter(public_id=public_id).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found"}}, status=404)
    if request.method == "PATCH":
        if post.author_id != request.user.id:
            return Response({"ok": False, "error": {"code": "forbidden", "message": "Not your post"}}, status=403)
        editable = ("caption", "visibility", "hide_likes", "hide_comments", "allow_comments", "allow_sharing")
        data = request.data
        for field in editable:
            if field in data:
                val = data[field]
                if field == "caption":
                    val = (val or "")[:2200]
                setattr(post, field, val)
        post.save()
        _broadcast_post_update(post, {f: getattr(post, f) for f in editable})
        return ok(PostSerializer(post, context=_ctx(request)).data)
    if request.method == "DELETE":
        if post.author_id != request.user.id:
            return Response({"ok": False, "error": {"code": "forbidden", "message": "Not your post"}}, status=403)
        public_id_str = str(post.public_id)
        kind = post.kind
        post.delete()
        push_to_connections(request.user, "feed.delete", {"public_id": public_id_str, "kind": kind}, include_self=True)
        return ok({"deleted": True})
    return ok(PostSerializer(post, context=_ctx(request)).data)


@api_view(["POST"])
def toggle_like(request, public_id: str):
    post = Post.objects.filter(public_id=public_id).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found"}}, status=404)
    existing = Like.objects.filter(post=post, user=request.user).first()
    if existing:
        existing.delete()
        count = post.likes.count()
        _broadcast_post_update(post, {"likes_count": count})
        return ok({"liked": False, "likes_count": count})
    Like.objects.create(post=post, user=request.user)
    count = post.likes.count()
    _broadcast_post_update(post, {"likes_count": count})
    if post.author_id != request.user.id:
        push_to_user(post.author_id, "feed.like", {"by": request.user.username, "post": str(post.public_id)})
    return ok({"liked": True, "likes_count": count})


@api_view(["POST"])
def toggle_bookmark(request, public_id: str):
    post = Post.objects.filter(public_id=public_id).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found"}}, status=404)
    existing = Bookmark.objects.filter(post=post, user=request.user).first()
    if existing:
        existing.delete()
        return ok({"saved": False})
    Bookmark.objects.create(post=post, user=request.user)
    return ok({"saved": True})


@api_view(["GET"])
def list_bookmarks(request):
    qs = (
        Post.objects.filter(bookmarks__user=request.user)
        .select_related("author__profile")
        .order_by("-bookmarks__at")[:60]
    )
    return ok(PostSerializer(qs, many=True, context=_ctx(request)).data)


@api_view(["GET", "POST"])
def comments(request, public_id: str):
    post = Post.objects.filter(public_id=public_id).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found"}}, status=404)
    if request.method == "POST":
        body = (request.data.get("body") or "").strip()[:2000]
        if not body:
            return Response({"ok": False, "error": {"code": "invalid", "message": "Empty"}}, status=400)
        c = Comment.objects.create(post=post, author=request.user, body=body)
        comment_data = CommentSerializer(c).data
        count = post.comments.count()
        _broadcast_post_update(post, {"comments_count": count, "new_comment": comment_data})
        if post.author_id != request.user.id:
            push_to_user(post.author_id, "feed.comment", {"by": request.user.username, "post": str(post.public_id)})
        return ok(comment_data, status_code=201)
    qs = post.comments.select_related("author__profile").order_by("-created_at")[:50]
    return ok(CommentSerializer(qs, many=True).data)


@api_view(["POST"])
def view_story(request, public_id: str):
    post = Post.objects.filter(public_id=public_id, kind=Post.STORY).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found"}}, status=404)
    StoryView.objects.get_or_create(post=post, user=request.user)
    if post.author_id != request.user.id:
        push_to_user(post.author_id, "story.view", {
            "post": str(post.public_id),
            "by": request.user.username,
            "views_count": post.views.exclude(user=post.author).count(),
        })
    return ok({"viewed": True})


@api_view(["GET"])
def story_viewers(request, public_id: str):
    """Return list of users who viewed a story, with timestamps."""
    post = Post.objects.filter(public_id=public_id, kind=Post.STORY, author=request.user).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found or not yours"}}, status=404)
    views = (
        StoryView.objects.filter(post=post)
        .exclude(user=request.user)
        .select_related("user__profile")
        .order_by("-at")
    )
    data = [
        {
            "username": v.user.username,
            "display_name": v.user.display_name,
            "avatar": v.user.profile.avatar.url if hasattr(v.user, "profile") and v.user.profile.avatar else None,
            "viewed_at": v.at.isoformat(),
        }
        for v in views
    ]
    return ok({"viewers": data, "count": len(data)})


@api_view(["GET"])
def post_viewers(request, public_id: str):
    """Return who liked a post/reel (serves as 'seen' indicator for posts/reels)."""
    post = Post.objects.filter(public_id=public_id, author=request.user).first()
    if not post:
        return Response({"ok": False, "error": {"code": "not_found", "message": "Not found or not yours"}}, status=404)
    likes = (
        Like.objects.filter(post=post)
        .select_related("user__profile")
        .order_by("-at")
    )
    data = [
        {
            "username": l.user.username,
            "display_name": l.user.display_name,
            "avatar": l.user.profile.avatar.url if hasattr(l.user, "profile") and l.user.profile.avatar else None,
            "liked_at": l.at.isoformat(),
        }
        for l in likes
    ]
    return ok({"viewers": data, "count": len(data)})


@api_view(["GET"])
def user_posts(request, username: str):
    from apps.accounts.models import User
    target = User.objects.select_related("profile").filter(username=username.lower()).first()
    if not target:
        return Response({"ok": False, "error": {"code": "not_found", "message": "User not found"}}, status=404)
    kind = request.GET.get("kind", Post.POST)
    is_self = target.id == request.user.id
    if not is_self and getattr(target.profile, "is_private", True):
        connected = Connection.objects.filter(status=Connection.ACCEPTED).filter(
            (Q(requester=request.user) & Q(receiver=target))
            | (Q(requester=target) & Q(receiver=request.user))
        ).exists()
        if not connected:
            return ok([])
    qs = (
        Post.objects.filter(author=target, kind=kind)
        .select_related("author__profile")
        .order_by("-created_at")[:60]
    )
    return ok(PostSerializer(qs, many=True, context=_ctx(request)).data)
