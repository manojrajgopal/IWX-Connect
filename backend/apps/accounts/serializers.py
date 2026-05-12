from rest_framework import serializers

from .models import Profile, User, UserPreference


class ProfilePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("avatar", "about", "location", "website", "is_private")


class UserPublicSerializer(serializers.ModelSerializer):
    profile = ProfilePublicSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("public_id", "username", "display_name", "profile", "last_seen_at")


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        exclude = ("id", "user")


class MeSerializer(serializers.ModelSerializer):
    profile = ProfilePublicSerializer(read_only=True)
    preferences = UserPreferenceSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("public_id", "username", "email", "display_name", "profile", "preferences", "last_seen_at")


class SignupSerializer(serializers.Serializer):
    username = serializers.RegexField(r"^[a-zA-Z0-9_.]{3,24}$")
    email = serializers.EmailField()
    password = serializers.CharField(min_length=10, write_only=True)
    display_name = serializers.CharField(max_length=64, required=False, allow_blank=True)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
