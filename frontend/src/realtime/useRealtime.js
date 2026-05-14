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
  const session = useAuthStore((s) => s.session);
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
      const backendUrl = import.meta.env.VITE_API_URL || "";
      let wsBase;
      if (backendUrl) {
        wsBase = backendUrl.replace(/^http/, "ws");
      } else {
        const proto = window.location.protocol === "https:" ? "wss" : "ws";
        wsBase = `${proto}://${window.location.host}`;
      }
      const url = `${wsBase}/ws/hub?access=${encodeURIComponent(access)}${session ? `&sid=${encodeURIComponent(session)}` : ""}`;
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
  }, [access, session, qc]);

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
    case "feed.new":           return { title: "New post",                body: payload?.author?.username ? `@${payload.author.username} shared a new post` : "A connection posted something" };
    case "reel.new":           return { title: "New reel",                body: payload?.author?.username ? `@${payload.author.username} added a reel` : "A new reel is up" };
    case "story.new":          return { title: "New story",               body: payload?.author?.username ? `@${payload.author.username} added a story` : "Someone added a story" };
    case "story.view":         return { title: "Story view",              body: payload?.by ? `@${payload.by} viewed your story` : "" };
    default:                   return { title: "IWX Connect",             body: payload?.preview || event };
  }
}

function invalidateFeedQueries(qc, kind) {
  // Prefix-matching invalidation in React Query — these match all variants.
  qc.invalidateQueries({ queryKey: ["feed"] });
  qc.invalidateQueries({ queryKey: ["reels"] });
  qc.invalidateQueries({ queryKey: ["stories"] });
  qc.invalidateQueries({ queryKey: ["explore"] });
  qc.invalidateQueries({ queryKey: ["user-posts"] });
  qc.invalidateQueries({ queryKey: ["public-profile"] });
  if (kind === "saved") qc.invalidateQueries({ queryKey: ["bookmarks"] });
}

function patchPostInCaches(qc, publicId, patch) {
  // Update every cached list of posts that contains this post, in place.
  const queries = qc.getQueryCache().findAll();
  for (const q of queries) {
    const data = q.state.data;
    if (!Array.isArray(data)) continue;
    if (!data.length || !data[0] || typeof data[0] !== "object" || !("public_id" in data[0])) continue;
    let changed = false;
    const next = data.map((p) => {
      if (p?.public_id === publicId) { changed = true; return { ...p, ...patch }; }
      return p;
    });
    if (changed) qc.setQueryData(q.queryKey, next);
  }
}

function route(event, payload, qc) {
  // ── New content from connections ─────────────────────────────────────────
  if (event === "feed.new" || event === "reel.new" || event === "story.new") {
    invalidateFeedQueries(qc);
    const me = useAuthStore.getState().user;
    if (payload?.author?.username !== me?.username) {
      const { title, body } = titleFor(event, payload);
      showOSNotification(title, body);
    }
    return;
  }
  if (event === "feed.delete") {
    const pid = payload?.public_id;
    if (pid) {
      // Remove the deleted post from all cached arrays immediately.
      for (const q of qc.getQueryCache().findAll()) {
        const data = q.state.data;
        if (!Array.isArray(data) || !data.length || !data[0]?.public_id) continue;
        const filtered = data.filter((p) => p?.public_id !== pid);
        if (filtered.length !== data.length) qc.setQueryData(q.queryKey, filtered);
      }
    }
    invalidateFeedQueries(qc);
    return;
  }
  if (event === "feed.update") {
    // Live patch likes_count / comments_count across all cached lists.
    const { public_id, new_comment, ...patch } = payload || {};
    if (public_id) patchPostInCaches(qc, public_id, patch);
    // Push new comment to any open PostCard comment panel via window event.
    if (new_comment && public_id) {
      window.dispatchEvent(new CustomEvent("iwx:new-comment", { detail: { post_id: public_id, comment: new_comment } }));
    }
    return;
  }
  if (event === "story.view") {
    // Author-only event; nothing to refetch but could update a viewer count.
    return;
  }

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

