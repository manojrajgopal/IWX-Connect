import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from apps.chats.models import Conversation, Membership
from apps.realtime import presence
from apps.realtime.broadcast import push_to_conversation


class HubConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            await self.close(code=4401)
            return
        self.user = user
        self.user_group = f"user.{user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        self.conv_groups = set()
        for conv_id in await self._user_conversation_ids(user):
            group = f"chat.{conv_id}"
            self.conv_groups.add(group)
            await self.channel_layer.group_add(group, self.channel_name)
        presence.mark_online(user.id)
        await self.accept()
        await self.send_json({"event": "ready", "payload": {"username": user.username}})

    async def disconnect(self, code):
        user = getattr(self, "user", None)
        if not user:
            return
        await self.channel_layer.group_discard(self.user_group, self.channel_name)
        for g in getattr(self, "conv_groups", []):
            await self.channel_layer.group_discard(g, self.channel_name)
        presence.mark_offline(user.id)
        await self._touch_last_seen(user)

    async def receive_json(self, content, **kwargs):
        op = content.get("op")
        if op == "ping":
            presence.mark_online(self.user.id)
            await self.send_json({"event": "pong", "payload": {"t": int(timezone.now().timestamp())}})
            return
        if op == "typing":
            conv_id = content.get("conversation_id")
            if conv_id and f"chat.{conv_id}" in self.conv_groups:
                push_to_conversation(conv_id, "typing", {"user": self.user.username, "state": content.get("state", "start")})
            return
        if op == "subscribe_conversation":
            conv_id = content.get("conversation_id")
            allowed = await self._is_member(self.user, conv_id)
            if allowed:
                group = f"chat.{conv_id}"
                self.conv_groups.add(group)
                await self.channel_layer.group_add(group, self.channel_name)
            return

    async def fanout(self, event):
        await self.send_json({"event": event["event"], "payload": event["payload"]})

    @database_sync_to_async
    def _user_conversation_ids(self, user):
        return list(
            Membership.objects.filter(user=user).values_list("conversation__public_id", flat=True)
        )

    @database_sync_to_async
    def _is_member(self, user, conv_public_id):
        if not conv_public_id:
            return False
        return Membership.objects.filter(user=user, conversation__public_id=conv_public_id).exists()

    @database_sync_to_async
    def _touch_last_seen(self, user):
        type(user).objects.filter(pk=user.pk).update(last_seen_at=timezone.now())
