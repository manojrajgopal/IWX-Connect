from rest_framework import serializers

from .models import Profile, User, UserPreference
from .password_policy import PASSWORD_MIN_LENGTH, validate_strong_password


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
    password = serializers.CharField(min_length=PASSWORD_MIN_LENGTH, write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    display_name = serializers.CharField(max_length=64, required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError({"confirm_password": ["Passwords do not match."]})
        try:
            validate_strong_password(
                attrs.get("password", ""),
                username=attrs.get("username", ""),
                email=attrs.get("email", ""),
            )
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.detail})
        return attrs


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
