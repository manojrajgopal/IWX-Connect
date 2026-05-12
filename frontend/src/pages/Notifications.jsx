import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { notificationsService } from "../services";
import { useNotificationStore } from "../stores/notificationStore";

export default function Notifications() {
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsService.list() });
  const setMany = useNotificationStore((s) => s.setMany);
  const markAllSeen = useNotificationStore((s) => s.markAllSeen);

  useEffect(() => { if (data) setMany(data); }, [data, setMany]);
  useEffect(() => { notificationsService.seen().then(markAllSeen); }, [markAllSeen]);

  return (
    <div className="container-x py-6 md:py-8 max-w-3xl">
      <h2 className="font-serif text-3xl mb-4">Notifications</h2>
      <div className="flex flex-col gap-2">
        {(data || []).map((n) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
            <div className="text-sm font-medium">{labelFor(n.kind)}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(n.created_at).toLocaleString()}</div>
            {n.payload?.from && <div className="text-sm mt-1">@{n.payload.from}</div>}
          </motion.div>
        ))}
        {!data?.length && <div className="text-sm" style={{ color: "var(--text-muted)" }}>You’re all caught up.</div>}
      </div>
    </div>
  );
}

function labelFor(kind) {
  switch (kind) {
    case "connection.request": return "New connection request";
    case "connection.accept":  return "Connection accepted";
    case "connection.reject":  return "Connection declined";
    case "feed.like":          return "Someone liked your post";
    case "feed.comment":       return "New comment on your post";
    default: return kind;
  }
}
