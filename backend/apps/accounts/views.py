from django.contrib.auth import authenticate
from rest_framework import permissions, status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from apps.core.exceptions import ok
from apps.core.utils import normalize_username
from apps.security.services import device as device_service
from apps.security.services import session as session_service
from apps.security.services.audit import log_event
from apps.security.services.ratelimit import enforce

from .models import Profile, User, UserPreference
from .serializers import LoginSerializer, MeSerializer, SignupSerializer, UserPreferenceSerializer, UserPublicSerializer


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def signup(request):
    enforce(request, "auth.signup")
    s = SignupSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    data = s.validated_data
    username = normalize_username(data["username"])
    if User.objects.filter(username=username).exists():
        return Response({"ok": False, "error": {"code": "username_taken", "message": "Username taken"}}, status=409)
    if User.objects.filter(email__iexact=data["email"]).exists():
        return Response({"ok": False, "error": {"code": "email_taken", "message": "Email already used"}}, status=409)
    user = User.objects.create_user(
        username=username,
        email=data["email"],
        password=data["password"],
        display_name=data.get("display_name") or username,
    )
    sess, access = session_service.create_session(user, request)
    log_event(user, "auth.signup", request, {"username": user.username})
    session_token = f"{sess.public_id}.{sess._iwx_emit_secret}"
    resp = Response({"ok": True, "data": {"access": access, "session": session_token, "user": MeSerializer(user).data}}, status=201)
    session_service.attach_session_cookie(resp, sess)
    return resp


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login(request):
    enforce(request, "auth.login")
    s = LoginSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = authenticate(request, username=normalize_username(s.validated_data["username"]), password=s.validated_data["password"])
    if not user or not user.is_active:
        log_event(None, "auth.login_failed", request, {"username": s.validated_data["username"]})
        return Response({"ok": False, "error": {"code": "invalid_credentials", "message": "Invalid credentials"}}, status=401)
    sess, access = session_service.create_session(user, request)
    log_event(user, "auth.login", request, {"device": device_service.fingerprint(request)})
    session_token = f"{sess.public_id}.{sess._iwx_emit_secret}"
    resp = Response({"ok": True, "data": {"access": access, "session": session_token, "user": MeSerializer(user).data}})
    session_service.attach_session_cookie(resp, sess)
    return resp


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def logout(request):
    user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None
    session_service.revoke_current(request)
    resp = ok({"logged_out": True})
    session_service.clear_session_cookie(resp)
    if user:
        log_event(user, "auth.logout", request, {})
    return resp


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def refresh(request):
    sess = session_service.get_current(request)
    if not sess:
        return Response({"ok": False, "error": {"code": "no_session", "message": "No session"}}, status=401)
    access = session_service.issue_access_token(sess, request)
    return ok({"access": access})


@api_view(["GET"])
def me(request):
    data = MeSerializer(request.user).data
    from apps.connections.models import Connection
    from django.db.models import Q
    data["counts"] = {
        "posts": request.user.posts.filter(kind="post").count(),
        "reels": request.user.posts.filter(kind="reel").count(),
        "connections": Connection.objects.filter(status=Connection.ACCEPTED).filter(
            Q(requester=request.user) | Q(receiver=request.user)
        ).count(),
    }
    return ok(data)


@api_view(["PATCH"])
def update_profile(request):
    profile = request.user.profile
    for field in ("about", "location", "website", "is_private"):
        if field in request.data:
            setattr(profile, field, request.data[field])
    if "display_name" in request.data:
        request.user.display_name = request.data["display_name"][:64]
        request.user.save(update_fields=["display_name"])
    profile.save()
    return ok(MeSerializer(request.user).data)


@api_view(["GET", "PATCH"])
def preferences(request):
    pref = request.user.preferences
    if request.method == "PATCH":
        for field in [f.name for f in UserPreference._meta.fields if f.name not in {"id", "user"}]:
            if field in request.data:
                setattr(pref, field, request.data[field])
        pref.save()
    return ok(UserPreferenceSerializer(pref).data)


@api_view(["POST"])
def change_password(request):
    current = request.data.get("current_password", "")
    new_pw = request.data.get("new_password", "")
    confirm = request.data.get("confirm_password", "")
    if not request.user.check_password(current):
        return Response({"ok": False, "error": {"code": "wrong_password", "message": "Current password is incorrect"}}, status=400)
    if new_pw != confirm:
        return Response({"ok": False, "error": {"code": "mismatch", "message": "Passwords do not match"}}, status=400)
    if len(new_pw) < 8:
        return Response({"ok": False, "error": {"code": "too_short", "message": "Password must be at least 8 characters"}}, status=400)
    request.user.set_password(new_pw)
    request.user.save(update_fields=["password"])
    return ok({"changed": True})


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_photo(request):
    """Upload avatar or cover photo. ?kind=avatar|cover"""
    kind = request.GET.get("kind", "avatar")
    if kind not in ("avatar", "cover"):
        return Response({"ok": False, "error": {"code": "invalid", "message": "Bad kind"}}, status=400)
    f = request.FILES.get("file")
    if not f:
        return Response({"ok": False, "error": {"code": "no_file", "message": "No file"}}, status=400)
    if not f.content_type.startswith("image/"):
        return Response({"ok": False, "error": {"code": "unsupported", "message": "Image required"}}, status=400)
    if f.size > 8 * 1024 * 1024:
        return Response({"ok": False, "error": {"code": "too_large", "message": "Max 8MB"}}, status=400)
    profile = request.user.profile
    setattr(profile, kind, f)
    profile.save(update_fields=[kind, "updated_at"])
    return ok(MeSerializer(request.user).data)


@api_view(["GET"])
def public_profile(request, username: str):
    target = User.objects.select_related("profile").filter(username=normalize_username(username)).first()
    if not target:
        return Response({"ok": False, "error": {"code": "not_found", "message": "User not found"}}, status=404)
    from apps.connections.models import Connection
    from django.db.models import Q
    is_self = target.id == request.user.id
    connection = None
    if not is_self:
        connection = Connection.objects.filter(
            Q(requester=request.user, receiver=target) | Q(requester=target, receiver=request.user)
        ).first()
    data = UserPublicSerializer(target).data
    data["is_self"] = is_self
    data["connection_status"] = connection.status if connection else None
    data["counts"] = {
        "posts": target.posts.filter(kind="post").count(),
        "reels": target.posts.filter(kind="reel").count(),
        "connections": Connection.objects.filter(status=Connection.ACCEPTED).filter(
            Q(requester=target) | Q(receiver=target)
        ).count(),
    }
    return ok(data)
