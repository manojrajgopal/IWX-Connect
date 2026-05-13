import hashlib
import hmac
import os
import re
import secrets
import time
import uuid

USERNAME_RE = re.compile(r"^[a-z0-9_.]{3,24}$")


class RandomFileName:
    """Django-serializable upload_to callable that generates random hex filenames."""
    def __init__(self, subdir):
        self.subdir = subdir

    def __call__(self, instance, filename):
        ext = os.path.splitext(filename)[1].lower()
        return f"{self.subdir}/{uuid.uuid4().hex}{ext}"

    def deconstruct(self):
        return (f"{self.__class__.__module__}.{self.__class__.__qualname__}", (self.subdir,), {})


def normalize_username(value: str) -> str:
    return (value or "").strip().lower()


def is_valid_username(value: str) -> bool:
    return bool(USERNAME_RE.match(normalize_username(value)))


def stable_hash(*parts: str) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update((p or "").encode("utf-8"))
        h.update(b"\x1f")
    return h.hexdigest()


def constant_time_eq(a: str, b: str) -> bool:
    return hmac.compare_digest(a or "", b or "")


def random_token(n: int = 32) -> str:
    return secrets.token_urlsafe(n)


def now_ts() -> int:
    return int(time.time())
