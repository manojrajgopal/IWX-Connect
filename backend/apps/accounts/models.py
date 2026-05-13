import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from apps.core.utils import normalize_username, RandomFileName


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra):
        if not username:
            raise ValueError("Username required")
        if not email:
            raise ValueError("Email required")
        user = self.model(username=normalize_username(username), email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        Profile.objects.create(user=user)
        UserPreference.objects.create(user=user)
        return user

    def create_superuser(self, username, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(username, email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.BigAutoField(primary_key=True)
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    username = models.CharField(max_length=24, unique=True, db_index=True)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=64, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    objects = UserManager()

    class Meta:
        db_table = "accounts_user"

    def __str__(self) -> str:
        return self.username


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to=RandomFileName("avatars"), null=True, blank=True)
    cover = models.ImageField(upload_to=RandomFileName("covers"), null=True, blank=True)
    about = models.TextField(blank=True, default="")
    location = models.CharField(max_length=120, blank=True, default="")
    website = models.URLField(blank=True, default="")
    is_private = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts_profile"


class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preferences")
    theme = models.CharField(max_length=8, default="system")
    notifications_in_app = models.BooleanField(default=True)
    notifications_push = models.BooleanField(default=True)
    notifications_email = models.BooleanField(default=False)
    notification_sounds = models.BooleanField(default=True)
    show_presence = models.BooleanField(default=True)
    read_receipts = models.BooleanField(default=True)
    public_profile = models.BooleanField(default=False)
    show_activity = models.BooleanField(default=True)
    message_sounds = models.BooleanField(default=True)
    auto_download_media = models.BooleanField(default=True)
    link_previews = models.BooleanField(default=True)
    autoplay_videos = models.BooleanField(default=True)
    data_saver = models.BooleanField(default=False)
    language = models.CharField(max_length=8, default="en")

    class Meta:
        db_table = "accounts_preference"
