import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import { connectionsService, chatsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";

export default function Connections() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const friends = useQuery({ queryKey: ["friends"], queryFn: () => connectionsService.friends() });
  const [filter, setFilter] = useState("");
  const [chatLoading, setChatLoading] = useState(null);

  const openChat = async (username) => {
    setChatLoading(username);
    try {
      const conv = await chatsService.open(username);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate("/chats", { state: { openConversation: conv?.public_id } });
    } finally {
      setChatLoading(null);
    }
  };

  const friendsList = Array.isArray(friends.data) ? friends.data : [];
  const filtered = filter
    ? friendsList.filter((u) => {
        const q = filter.toLowerCase();
        return u.username?.toLowerCase().includes(q) || (u.display_name || "").toLowerCase().includes(q);
      })
    : friendsList;

  if (friends.isLoading) return <ConnectionsSkeleton />;

  return (
    <div className="container-x py-6 md:py-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl md:text-3xl mb-5">Connections</h1>

      {friendsList.length > 0 && (
        <div className="relative mb-5">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
          <input
            className="input pl-9"
            placeholder="Search connections…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((u, i) => (
          <motion.div
            key={u.public_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-lg surface cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate(`/u/${u.username}`)}
          >
            <Avatar user={u} size={40} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{u.display_name || u.username}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
            </div>
            <button
              className="btn text-xs"
              onClick={(e) => { e.stopPropagation(); openChat(u.username); }}
              disabled={chatLoading === u.username}
            >
              {chatLoading === u.username ? "…" : "Chat"}
            </button>
          </motion.div>
        ))}
      </div>

      {!friendsList.length && (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>You haven't connected with anyone yet.</p>
          <button className="btn-primary mt-4" onClick={() => navigate("/requests")}>Find people</button>
        </div>
      )}
      {friendsList.length > 0 && !filtered.length && (
        <div className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>No matches for "{filter}"</div>
      )}
    </div>
  );
}

function ConnectionsSkeleton() {
  return (
    <div className="container-x py-6 md:py-8 max-w-2xl mx-auto">
      <div className="skel" style={{ height: 28, width: "40%", marginBottom: 20, background: "var(--bg-surface-2)" }} />
      <div className="skel" style={{ height: 40, marginBottom: 20, borderRadius: 8, background: "var(--bg-surface-2)" }} />
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="skel shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-surface-2)" }} />
            <div className="flex-1">
              <div className="skel" style={{ height: 14, width: "60%", marginBottom: 4, background: "var(--bg-surface-2)" }} />
              <div className="skel" style={{ height: 10, width: "35%", background: "var(--bg-surface-2)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
