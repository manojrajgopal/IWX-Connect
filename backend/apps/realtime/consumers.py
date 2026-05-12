import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from apps.chats.models import Conversation, Membership, Message, Receipt
from apps.realtime import presence
from apps.realtime.broadcast import push_to_conversation, push_to_user


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
                await self.channel_layer.group_send(
                    f"chat.{conv_id}",
                    {"type": "fanout", "event": "typing", "payload": {"user": self.user.username, "conversation_id": conv_id, "state": content.get("state", "start")}},
                )
            return
        if op == "delivered":
            conv_id = content.get("conversation_id")
            message_ids = content.get("message_ids", [])
            if conv_id and message_ids and f"chat.{conv_id}" in self.conv_groups:
                await self._mark_delivered(conv_id, message_ids)
            return
        if op == "read":
            conv_id = content.get("conversation_id")
            up_to = content.get("up_to")
            if conv_id and up_to and f"chat.{conv_id}" in self.conv_groups:
                await self._mark_read_ws(conv_id, up_to)
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

    @database_sync_to_async
    def _mark_delivered(self, conv_id, message_ids):
        msgs = Message.objects.filter(
            conversation__public_id=conv_id,
            id__in=message_ids,
        ).exclude(sender=self.user)
        receipts = [Receipt(message=m, user=self.user, kind=Receipt.DELIVERED) for m in msgs]
        Receipt.objects.bulk_create(receipts, ignore_conflicts=True)
        push_to_conversation(conv_id, "message.delivered", {
            "conversation_id": conv_id,
            "message_ids": message_ids,
            "user": self.user.username,
        })

    @database_sync_to_async
    def _mark_read_ws(self, conv_id, up_to):
        from apps.chats.services import mark_read as svc_mark_read
        conv = Conversation.objects.filter(public_id=conv_id).first()
        if not conv:
            return
        svc_mark_read(conv, self.user, up_to)
        push_to_conversation(conv_id, "message.read", {
            "conversation_id": conv_id,
            "user": self.user.username,
            "up_to": up_to,
        })
