"""Strict password policy. Mirrors frontend/src/utils/password.js — keep in sync."""
from __future__ import annotations

import re

from rest_framework import serializers

PASSWORD_MIN_LENGTH = 12

COMMON_PASSWORDS = {
    "password", "password1", "password123", "12345678", "123456789", "1234567890",
    "qwertyuiop", "iloveyou", "letmein123", "welcome123", "admin1234",
    "passw0rd", "p@ssw0rd", "abcd1234", "trustno1", "monkey123",
}

_SEQUENCES = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiopasdfghjklzxcvbnm"]


def _has_sequence(s: str) -> bool:
    if not s or len(s) < 4:
        return False
    for seq in _SEQUENCES:
        for i in range(len(seq) - 3):
            part = seq[i:i + 4]
            if part in s or part[::-1] in s:
                return True
    return False


def validate_strong_password(password: str, *, username: str = "", email: str = "") -> None:
    """Raise DRF ValidationError if the password fails any policy rule."""
    if not isinstance(password, str):
        raise serializers.ValidationError("Password must be a string.")

    errors: list[str] = []
    lower = password.lower()
    local = (email or "").split("@")[0].lower()

    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"Must be at least {PASSWORD_MIN_LENGTH} characters.")
    if not re.search(r"[A-Z]", password):
        errors.append("Must contain an uppercase letter.")
    if not re.search(r"[a-z]", password):
        errors.append("Must contain a lowercase letter.")
    if not re.search(r"\d", password):
        errors.append("Must contain a number.")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("Must contain a symbol.")
    if re.search(r"(.)\1\1", password):
        errors.append("Cannot contain 3+ repeated characters in a row.")
    if _has_sequence(lower):
        errors.append("Cannot contain obvious sequences (e.g. 1234, abcd, qwerty).")
    if username and username.lower() in lower:
        errors.append("Cannot contain your username.")
    if local and local in lower:
        errors.append("Cannot contain your email address.")
    if lower in COMMON_PASSWORDS:
        errors.append("This password is too common.")

    if errors:
        raise serializers.ValidationError(errors)
