from django.db.models import Q

from .models import Block, Connection


def are_connected(user_a, user_b) -> bool:
    if user_a.id == user_b.id:
        return True
    return Connection.objects.filter(
        status=Connection.ACCEPTED,
    ).filter(
        Q(requester=user_a, receiver=user_b) | Q(requester=user_b, receiver=user_a)
    ).exists()


def is_blocked(viewer, target) -> bool:
    return Block.objects.filter(
        Q(user=viewer, blocked=target) | Q(user=target, blocked=viewer)
    ).exists()


def existing_between(a, b):
    return Connection.objects.filter(
        Q(requester=a, receiver=b) | Q(requester=b, receiver=a)
    ).first()
