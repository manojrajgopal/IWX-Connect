import hashlib

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from apps.core.exceptions import ok

from .models import MediaAsset

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "audio/mpeg", "audio/webm"}
MAX_BYTES = 50 * 1024 * 1024


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload(request):
    f = request.FILES.get("file")
    if not f:
        return Response({"ok": False, "error": {"code": "no_file", "message": "No file"}}, status=400)
    if f.content_type not in ALLOWED_MIME:
        return Response({"ok": False, "error": {"code": "unsupported", "message": "Unsupported type"}}, status=400)
    if f.size > MAX_BYTES:
        return Response({"ok": False, "error": {"code": "too_large", "message": "File too large"}}, status=400)
    h = hashlib.sha256()
    for chunk in f.chunks():
        h.update(chunk)
    f.seek(0)
    asset = MediaAsset.objects.create(
        owner=request.user,
        file=f,
        mime=f.content_type,
        size=f.size,
        sha256=h.hexdigest(),
    )
    return ok({"id": str(asset.public_id), "url": asset.file.url, "mime": asset.mime, "size": asset.size}, status_code=201)
