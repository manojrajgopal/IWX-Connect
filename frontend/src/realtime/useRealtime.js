import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { useNotificationStore } from "../stores/notificationStore";
import { chatsService, notificationsService } from "../services";

const HEARTBEAT_MS = 25_000;

// Ask the browser for notification permission once per session.
let permissionAsked = false;
async function ensurePermission() {
  if (permissionAsked) return;
  permissionAsked = true;
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch {}
  }
}

function showOSNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/logo192.png", badge: "/logo192.png", tag: "iwx-connect" });
    n.onclick = () => { window.focus(); n.close(); };
  } catch {}
}

export function useRealtime() {
  const access = useAuthStore((s) => s.access);
  const qc = useQueryClient();
  const sockRef = useRef(null);
  const hbRef = useRef(null);

  // Hydrate unread count + items once when authenticated, so badges are correct on reload.
  useEffect(() => {
    if (!access) return;
    let cancelled = false;
    notificationsService.list().then((list) => {
      if (cancelled || !Array.isArray(list)) return;
      useNotificationStore.getState().setMany(list);
    }).catch(() => {});
    // Hydrate chat unread counts
    chatsService.list().then((convs) => {
      if (cancelled || !Array.isArray(convs)) return;
      useChatStore.getState().setConversations(convs);
    }).catch(() => {});
    ensurePermission();
    return () => { cancelled = true; };
  }, [access]);

  useEffect(() => {
    if (!access) return;
    let sock = null;
    let cancelled = false;

    const timerId = setTimeout(() => {
      if (cancelled) return;
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const url = `${proto}://${window.location.host}/ws/hub?access=${encodeURIComponent(access)}`;
      sock = new WebSocket(url);
      sockRef.current = sock;
      window.__iwxSocket = sock;

      sock.onopen = () => {
        hbRef.current = setInterval(() => {
          try { sock.send(JSON.stringify({ op: "ping" })); } catch {}
        }, HEARTBEAT_MS);
      };
      sock.onmessage = (e) => {
        try {
          const { event, payload } = JSON.parse(e.data);
          route(event, payload, qc);
        } catch {}
      };
      sock.onclose = () => {
        clearInterval(hbRef.current);
        window.__iwxSocket = null;
      };
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
      clearInterval(hbRef.current);
      if (sock && (sock.readyState === WebSocket.OPEN || sock.readyState === WebSocket.CONNECTING)) {
        sock.onopen = null;
        sock.onmessage = null;
        sock.onclose = null;
        try { sock.close(); } catch {}
      }
      window.__iwxSocket = null;
    };
  }, [access, qc]);

  return sockRef;
}

function titleFor(event, payload) {
  switch (event) {
    case "connection.request": return { title: "New connection request", body: payload?.from ? `@${payload.from} wants to connect` : "Someone wants to connect" };
    case "connection.accept":  return { title: "Request accepted",       body: payload?.by ? `@${payload.by} accepted your request` : "Your request was accepted" };
    case "connection.reject":  return { title: "Request declined",       body: payload?.by ? `@${payload.by} declined your request` : "Your request was declined" };
    case "message.new":        return { title: payload?.author?.username ? `New message from @${payload.author.username}` : "New message", body: payload?.preview || payload?.body || "Open IWX Connect to read." };
    case "feed.like":          return { title: "Someone liked your post", body: payload?.by ? `@${payload.by} liked your post` : "" };
    case "feed.comment":       return { title: "New comment",             body: payload?.by ? `@${payload.by} commented on your post` : "" };
    default:                   return { title: "IWX Connect",             body: payload?.preview || event };
  }
}

function route(event, payload, qc) {
  if (event === "message.new") {
    const convId = payload?.conversation_id || payload?.conversation_public_id;
    const me = useAuthStore.getState().user;
    const isMine = payload?.sender?.username === me?.username;
    if (convId) {
      // Skip appending own messages — sender already has them via optimistic + API response
      if (!isMine) {
        useChatStore.getState().appendMessage(convId, payload);
      }
      const activeId = useChatStore.getState().activeId;
      if (activeId !== convId) {
        useChatStore.getState().bumpConversation(convId, payload?.body || "", payload?.sender?.username || "");
      }
    }
    if (!isMine) {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      const { title, body } = titleFor(event, payload);
      showOSNotification(title, body);
    }
    return;
  }
  if (event === "message.delivered") {
    const convId = payload?.conversation_id;
    const messageIds = payload?.message_ids || [];
    if (convId && messageIds.length) {
      useChatStore.getState().updateMessageStatus(convId, messageIds, "delivered");
    }
    return;
  }
  if (event === "message.read") {
    const convId = payload?.conversation_id;
    const upTo = payload?.up_to;
    if (convId && upTo) {
      // Update message statuses for messages up to this ID
      const msgs = useChatStore.getState().byId[convId] || [];
      const readIds = msgs.filter((m) => m.id <= upTo).map((m) => m.id || m.public_id);
      if (readIds.length) {
        useChatStore.getState().updateMessageStatus(convId, readIds, "read");
      }
    }
    return;
  }
  if (event === "typing") {
    const convId = payload?.conversation_id;
    const user = payload?.user;
    const state = payload?.state;
    if (convId && user) {
      if (state === "stop") {
        useChatStore.getState().clearTyping(convId);
      } else {
        useChatStore.getState().setTyping(convId, user);
      }
    }
    return;
  }
  if (event === "conversation.bump") {
    const convId = payload?.conversation_id;
    if (convId) {
      useChatStore.getState().bumpConversation(convId, payload?.preview || "", payload?.sender || "");
    }
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["unread-summary"] });
    return;
  }
  if (event === "notification.new" || event.startsWith("connection.") || event.startsWith("feed.")) {
    useNotificationStore.getState().push({
      id: payload?.id || crypto.randomUUID(),
      kind: event === "notification.new" ? (payload?.kind || event) : event,
      payload,
      seen: false,
      created_at: new Date().toISOString(),
    });
    if (event === "connection.request") qc.invalidateQueries({ queryKey: ["pending"] });
    if (event === "connection.accept")  { qc.invalidateQueries({ queryKey: ["friends"] }); qc.invalidateQueries({ queryKey: ["pending"] }); }
    qc.invalidateQueries({ queryKey: ["notifications"] });
    const { title, body } = titleFor(event === "notification.new" ? (payload?.kind || event) : event, payload?.payload || payload);
    showOSNotification(title, body);
  }
}

