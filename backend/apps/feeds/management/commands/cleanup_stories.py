from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.feeds.models import Post


class Command(BaseCommand):
    help = "Delete expired stories (24h past their expires_at)."

    def handle(self, *args, **options):
        qs = Post.objects.filter(kind=Post.STORY, expires_at__lte=timezone.now())
        count, _ = qs.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {count} expired stories."))
