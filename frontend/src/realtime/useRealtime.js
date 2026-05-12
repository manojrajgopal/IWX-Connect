import { useEffect, useRef } from "react";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { useNotificationStore } from "../stores/notificationStore";

const HEARTBEAT_MS = 25_000;

export function useRealtime() {
  const access = useAuthStore((s) => s.access);
  const sockRef = useRef(null);
  const hbRef = useRef(null);

  useEffect(() => {
    if (!access) return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}/ws/hub?access=${encodeURIComponent(access)}`;
    const sock = new WebSocket(url);
    sockRef.current = sock;

    sock.onopen = () => {
      hbRef.current = setInterval(() => {
        try { sock.send(JSON.stringify({ op: "ping" })); } catch {}
      }, HEARTBEAT_MS);
    };
    sock.onmessage = (e) => {
      try {
        const { event, payload } = JSON.parse(e.data);
        route(event, payload);
      } catch {}
    };
    sock.onclose = () => clearInterval(hbRef.current);

    return () => {
      clearInterval(hbRef.current);
      try { sock.close(); } catch {}
    };
  }, [access]);

  return sockRef;
}

function route(event, payload) {
  if (event === "message.new") {
    const convId = payload?.conversation_public_id || payload?.conversation_id;
    useChatStore.getState().appendMessage(convId, payload);
    return;
  }
  if (event === "notification.new" || event.startsWith("connection.") || event.startsWith("feed.")) {
    useNotificationStore.getState().push({
      id: payload?.id || crypto.randomUUID(),
      kind: event,
      payload,
      seen: false,
      created_at: new Date().toISOString(),
    });
    if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("IWX Connect", { body: payload?.preview || event, icon: "/logo192.png" });
      } catch {}
    }
  }
}
