from django.urls import path

from .consumers import HubConsumer

websocket_urlpatterns = [
    path("ws/hub", HubConsumer.as_asgi()),
]
