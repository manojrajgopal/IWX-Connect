import hashlib
import hmac
import re
import secrets
import time

USERNAME_RE = re.compile(r"^[a-z0-9_.]{3,24}$")


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
