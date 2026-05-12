from django.core.cache import cache

PRESENCE_TTL = 60


def mark_online(user_id: int):
    cache.set(f"presence:{user_id}", 1, timeout=PRESENCE_TTL)


def mark_offline(user_id: int):
    cache.delete(f"presence:{user_id}")


def is_online(user_id: int) -> bool:
    return bool(cache.get(f"presence:{user_id}"))
