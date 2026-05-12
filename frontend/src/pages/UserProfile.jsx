import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FiGrid, FiFilm, FiMessageSquare, FiUserPlus, FiUserCheck, FiClock } from "react-icons/fi";
import { authService, feedsService, connectionsService, chatsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";
import { useAuthStore } from "../stores/authStore";

function PostsGrid({ items, emptyText }) {
  if (!items?.length) return <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>{emptyText}</div>;
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {items.map((p) => {
        const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(p.media_url || "");
        return (
          <motion.div key={p.public_id} whileHover={{ scale: 1.01 }} className="aspect-square overflow-hidden" style={{ background: "var(--bg-surface-2)" }}>
            {isVideo
              ? <video src={p.media_url} muted className="w-full h-full object-cover" />
              : p.media_url
                ? <img src={p.media_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xs p-2 text-center" style={{ color: "var(--text-muted)" }}>{p.caption?.slice(0, 80) || ""}</div>}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function UserProfile() {
  const { username } = useParams();
  const me = useAuthStore((s) => s.user);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("posts");
  const [busy, setBusy] = useState(false);

  // Redirect to /profile if it's our own username.
  if (me && me.username === username) {
    nav("/profile", { replace: true });
    return null;
  }

  const profile = useQuery({
    queryKey: ["public-profile", username],
    queryFn: () => authService.publicProfile(username),
  });
  const posts = useQuery({
    queryKey: ["user-posts", username, "post"],
    queryFn: () => feedsService.userPosts(username, "post"),
    enabled: !!profile.data && tab === "posts",
  });
  const reels = useQuery({
    queryKey: ["user-posts", username, "reel"],
    queryFn: () => feedsService.userPosts(username, "reel"),
    enabled: !!profile.data && tab === "reels",
  });

  if (profile.isLoading) {
    return <div className="container-x py-8"><div className="skel" style={{ height: 240, borderRadius: "var(--border-radius)" }} /></div>;
  }
  if (!profile.data) {
    return <div className="container-x py-12 text-center" style={{ color: "var(--text-muted)" }}>User not found.</div>;
  }
  const u = profile.data;
  const status = u.connection_status;

  const sendRequest = async () => {
    setBusy(true);
    try {
      await connectionsService.send(username);
      await qc.invalidateQueries({ queryKey: ["public-profile", username] });
    } finally { setBusy(false); }
  };

  const openChat = async () => {
    try {
      const conv = await chatsService.open(username);
      nav("/chats", { state: { openConversation: conv.public_id } });
    } catch {}
  };

  const cover = u.profile?.cover;
  return (
    <div className="container-x py-0 md:py-6 max-w-4xl">
      <div className="relative" style={{ height: 200, background: "var(--bg-surface-2)", overflow: "hidden" }}>
        {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-end gap-4 px-4 md:px-0 -mt-12 md:-mt-14">
        <div className="rounded-full p-1" style={{ background: "var(--bg-page)" }}><Avatar user={u} size={104} /></div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-3xl">{u.display_name || u.username}</h2>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
          {u.profile?.about && <div className="text-sm mt-2">{u.profile.about}</div>}
          <div className="flex gap-5 mt-3 text-sm">
            <span><b>{u.counts?.posts ?? 0}</b> <span style={{ color: "var(--text-muted)" }}>posts</span></span>
            <span><b>{u.counts?.reels ?? 0}</b> <span style={{ color: "var(--text-muted)" }}>reels</span></span>
            <span><b>{u.counts?.connections ?? 0}</b> <span style={{ color: "var(--text-muted)" }}>connections</span></span>
          </div>
        </div>
        <div className="flex gap-2">
          {status === "accepted" ? (
            <>
              <button className="btn flex items-center gap-2"><FiUserCheck /> Connected</button>
              <button className="btn-primary flex items-center gap-2" onClick={openChat}><FiMessageSquare /> Message</button>
            </>
          ) : status === "pending" ? (
            <button className="btn flex items-center gap-2" disabled><FiClock /> Pending</button>
          ) : (
            <button className="btn-primary flex items-center gap-2" onClick={sendRequest} disabled={busy}>
              <FiUserPlus /> Connect
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-8 border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
        {[
          { k: "posts", icon: FiGrid, label: "Posts" },
          { k: "reels", icon: FiFilm, label: "Reels" },
        ].map(({ k, icon: I, label }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="flex items-center gap-2 px-2 py-2 text-xs uppercase tracking-wider"
            style={{
              color: tab === k ? "var(--text-primary)" : "var(--text-muted)",
              borderTop: tab === k ? "1.5px solid var(--text-primary)" : "1.5px solid transparent",
              marginTop: "-1px",
            }}
          >
            <I /> {label}
          </button>
        ))}
      </div>

      <div className="mt-3 px-1">
        {tab === "posts" && <PostsGrid items={posts.data} emptyText={u.profile?.is_private && status !== "accepted" ? "This account is private. Connect to see posts." : "No posts yet."} />}
        {tab === "reels" && <PostsGrid items={reels.data} emptyText="No reels yet." />}
      </div>
    </div>
  );
}
