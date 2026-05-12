from django.contrib.auth import authenticate
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.core.exceptions import ok
from apps.core.utils import normalize_username
from apps.security.services import device as device_service
from apps.security.services import session as session_service
from apps.security.services.audit import log_event
from apps.security.services.ratelimit import enforce

from .models import Profile, User, UserPreference
from .serializers import LoginSerializer, MeSerializer, SignupSerializer, UserPreferenceSerializer


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
    resp = Response({"ok": True, "data": {"access": access, "user": MeSerializer(user).data}}, status=201)
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
    resp = Response({"ok": True, "data": {"access": access, "user": MeSerializer(user).data}})
    session_service.attach_session_cookie(resp, sess)
    return resp


@api_view(["POST"])
def logout(request):
    session_service.revoke_current(request)
    resp = ok({"logged_out": True})
    session_service.clear_session_cookie(resp)
    log_event(request.user, "auth.logout", request, {})
    return resp


@api_view(["POST"])
def refresh(request):
    sess = session_service.get_current(request)
    if not sess:
        return Response({"ok": False, "error": {"code": "no_session", "message": "No session"}}, status=401)
    access = session_service.issue_access_token(sess, request)
    return ok({"access": access})


@api_view(["GET"])
def me(request):
    return ok(MeSerializer(request.user).data)


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
