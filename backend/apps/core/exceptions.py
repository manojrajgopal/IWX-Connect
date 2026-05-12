from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def envelope_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {"ok": False, "error": {"code": "internal", "message": "Unexpected error"}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    detail = response.data
    code = "error"
    message = "Request failed"
    if isinstance(detail, dict):
        message = str(detail.get("detail", message))
        code = detail.get("code", code)
    elif isinstance(detail, list) and detail:
        message = str(detail[0])
    return Response({"ok": False, "error": {"code": code, "message": message, "details": detail}}, status=response.status_code)


def ok(data=None, status_code=200):
    return Response({"ok": True, "data": data or {}}, status=status_code)
