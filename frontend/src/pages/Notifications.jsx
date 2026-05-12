import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FiUserPlus, FiUserCheck, FiUserX, FiHeart, FiMessageCircle, FiBell } from "react-icons/fi";
import { notificationsService } from "../services";
import { useNotificationStore } from "../stores/notificationStore";

function NotificationsSkeleton() {
  return (
    <div className="container-x py-6 md:py-8 max-w-3xl">
      <div className="skel" style={{ height: 28, width: 180, marginBottom: 16 }} />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skel" style={{ height: 72, borderRadius: "var(--border-radius)" }}>
            <div className="p-4 flex items-center gap-3">
              <div className="skel shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-surface-2)" }} />
              <div className="flex-1">
                <div className="skel" style={{ height: 14, width: "60%", marginBottom: 6, background: "var(--bg-surface-2)" }} />
                <div className="skel" style={{ height: 10, width: "30%", background: "var(--bg-surface-2)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const NOTIF_CONFIG = {
  "connection.request": { icon: FiUserPlus, color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  "connection.accept":  { icon: FiUserCheck, color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  "connection.reject":  { icon: FiUserX, color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  "feed.like":          { icon: FiHeart, color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  "feed.comment":       { icon: FiMessageCircle, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

function getNotifDetails(n) {
  const person = n.payload?.from || n.payload?.by || null;
  switch (n.kind) {
    case "connection.request":
      return { title: "Connection request", message: person ? `@${person} wants to connect with you` : "Someone sent you a connection request" };
    case "connection.accept":
      return { title: "Connection accepted", message: person ? `@${person} accepted your connection request` : "Your connection request was accepted" };
    case "connection.reject":
      return { title: "Connection declined", message: person ? `@${person} declined your connection request` : "Your connection request was declined" };
    case "feed.like":
      return { title: "Post liked", message: person ? `@${person} liked your post` : "Someone liked your post" };
    case "feed.comment":
      return { title: "New comment", message: person ? `@${person} commented on your post` : "Someone commented on your post" };
    default:
      return { title: n.kind.replace(/\./g, " "), message: person ? `@${person}` : "" };
  }
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Notifications() {
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsService.list() });
  const setMany = useNotificationStore((s) => s.setMany);
  const markAllSeen = useNotificationStore((s) => s.markAllSeen);

  useEffect(() => { if (data) setMany(data); }, [data, setMany]);
  useEffect(() => { notificationsService.seen().then(markAllSeen); }, [markAllSeen]);

  if (isLoading) return <NotificationsSkeleton />;

  return (
    <div className="container-x py-6 md:py-8 max-w-3xl">
      <h2 className="font-serif text-3xl mb-4">Notifications</h2>
      <div className="flex flex-col gap-2">
        {(data || []).map((n) => {
          const config = NOTIF_CONFIG[n.kind] || { icon: FiBell, color: "var(--text-muted)", bg: "var(--bg-surface-2)" };
          const Icon = config.icon;
          const { title, message } = getNotifDetails(n);
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="card flex items-center gap-4 p-4"
            >
              <div
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{ width: 40, height: 40, background: config.bg }}
              >
                <Icon size={18} style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{title}</div>
                {message && <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{message}</div>}
              </div>
              <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
                {timeAgo(n.created_at)}
              </span>
            </motion.div>
          );
        })}
        {!data?.length && (
          <div className="py-12 text-center">
            <div className="text-4xl mb-2 opacity-20">🔔</div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>You're all caught up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
