import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid, FiFilm, FiMessageSquare, FiUserPlus, FiUserCheck, FiClock,
  FiHeart, FiMessageCircle, FiPlay, FiX,
} from "react-icons/fi";
import { authService, feedsService, connectionsService, chatsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";
import PostCard from "../components/feed/PostCard.jsx";
import { useAuthStore } from "../stores/authStore";

/* ── helpers ── */
function isVideoUrl(u = "") { return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u); }

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(0) + "K";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/* ── Grid thumbnail ── */
function GridItem({ item, onClick }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const video = isVideoUrl(item.media_url);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="aspect-square overflow-hidden relative group"
      style={{ background: "var(--bg-surface-2)" }}
    >
      {!visible ? (
        <div className="w-full h-full skel" />
      ) : item.media_url ? (
        video ? (
          <>
            <video src={item.media_url} muted preload="metadata" className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2"><FiPlay size={16} className="text-white drop-shadow" /></div>
          </>
        ) : (
          <img src={item.media_url} alt="" loading="lazy" className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs p-2 text-center" style={{ color: "var(--text-muted)" }}>
          {item.caption?.slice(0, 60) || "No media"}
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-semibold">
        <span className="flex items-center gap-1"><FiHeart size={16} /> {formatCount(item.likes_count)}</span>
        <span className="flex items-center gap-1"><FiMessageCircle size={16} /> {formatCount(item.comments_count)}</span>
      </div>
    </button>
  );
}

function MediaGrid({ items, emptyText, onItemClick }) {
  if (!items?.length) {
    return <div className="py-20 text-center text-sm" style={{ color: "var(--text-muted)" }}>{emptyText}</div>;
  }
  return (
    <div className="grid grid-cols-3 gap-0.5 md:gap-1">
      {items.map((item, idx) => (
        <GridItem key={item.public_id} item={item} onClick={() => onItemClick(idx)} />
      ))}
    </div>
  );
}

/* ── Scrollable post viewer modal ── */
function PostViewerModal({ items, startIndex, onClose }) {
  const scrollRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (mounted || !scrollRef.current || !items?.length) return;
    const target = scrollRef.current.children[startIndex];
    if (target) target.scrollIntoView({ block: "start" });
    setMounted(true);
  }, [startIndex, items, mounted]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="viewer-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="viewer-panel"
          initial={{ y: 30, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="w-full md:max-w-lg flex flex-col"
          style={{ height: "calc(100dvh - 40px)", maxHeight: "calc(100dvh - 40px)", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        >
          <header className="flex items-center justify-between px-4 py-3 shrink-0 md:rounded-t-2xl"
            style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}>
            <span className="text-sm font-semibold">Posts</span>
            <button onClick={onClose} className="p-1.5 rounded-full transition hover:opacity-70" aria-label="Close"><FiX size={20} /></button>
          </header>
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto" style={{ background: "var(--bg-page)" }}>
            <div className="max-w-lg mx-auto flex flex-col gap-3 py-3 px-2">
              {items.map((post) => <PostCard key={post.public_id} post={post} />)}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

/* ── Stat item ── */
function StatItem({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold">{formatCount(value)}</span>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

/* ══════════════════════════
   USER PROFILE PAGE
   ══════════════════════════ */
export default function UserProfile() {
  const { username } = useParams();
  const me = useAuthStore((s) => s.user);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("posts");
  const [busy, setBusy] = useState(false);
  const [viewerData, setViewerData] = useState(null);

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
    enabled: !!profile.data,
  });
  const reels = useQuery({
    queryKey: ["user-posts", username, "reel"],
    queryFn: () => feedsService.userPosts(username, "reel"),
    enabled: !!profile.data,
  });

  const openViewer = useCallback((items, idx) => {
    setViewerData({ items, startIndex: idx });
  }, []);

  if (profile.isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skel" style={{ height: 200 }} />
        <div className="px-4 mt-6 flex flex-col gap-3">
          <div className="skel" style={{ width: 120, height: 20, borderRadius: 6 }} />
          <div className="skel" style={{ width: 200, height: 14, borderRadius: 6 }} />
        </div>
      </div>
    );
  }
  if (!profile.data) {
    return <div className="max-w-4xl mx-auto py-12 text-center" style={{ color: "var(--text-muted)" }}>User not found.</div>;
  }

  const u = profile.data;
  const status = u.connection_status;
  const counts = u.counts || {};

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
  const currentItems = tab === "posts" ? posts.data : reels.data;
  const loading = tab === "posts" ? posts.isLoading : reels.isLoading;
  const isPrivateBlocked = u.profile?.is_private && status !== "accepted";

  const TABS = [
    { k: "posts", icon: FiGrid, label: "Posts", count: counts.posts },
    { k: "reels", icon: FiFilm, label: "Reels", count: counts.reels },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Cover */}
      <div className="relative" style={{ height: 200, background: "var(--bg-surface-2)", overflow: "hidden" }}>
        {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Avatar + info */}
      <div className="px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
          <div className="shrink-0 rounded-full p-1" style={{ background: "var(--bg-page)" }}>
            <Avatar user={u} size={96} />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-xl font-semibold">{u.display_name || u.username}</h1>
            <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>@{u.username}</div>
          </div>
          <div className="flex gap-2">
            {status === "accepted" ? (
              <>
                <button className="btn flex items-center gap-2 text-sm"><FiUserCheck size={15} /> Connected</button>
                <button className="btn-primary flex items-center gap-2 text-sm" onClick={openChat}><FiMessageSquare size={15} /> Message</button>
              </>
            ) : status === "pending" ? (
              <button className="btn flex items-center gap-2 text-sm" disabled><FiClock size={15} /> Pending</button>
            ) : (
              <button className="btn-primary flex items-center gap-2 text-sm" onClick={sendRequest} disabled={busy}>
                <FiUserPlus size={15} /> Connect
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {u.profile?.about && (
          <div className="mt-3 text-center sm:text-left">
            <p className="text-sm">{u.profile.about}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-center sm:justify-start gap-8 mt-4">
          <StatItem value={counts.posts || 0} label="posts" />
          <StatItem value={counts.reels || 0} label="reels" />
          <StatItem value={counts.connections || 0} label="connections" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t mt-5" style={{ borderColor: "var(--border-color)" }}>
        {TABS.map(({ k, icon: I, label, count }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs uppercase tracking-wider font-medium transition-colors"
            style={{
              color: tab === k ? "var(--text-primary)" : "var(--text-muted)",
              borderTop: tab === k ? "2px solid var(--text-primary)" : "2px solid transparent",
              marginTop: -1,
            }}
          >
            <I size={14} />
            <span className="hidden sm:inline">{label}</span>
            {count != null && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>({formatCount(count)})</span>}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div>
        {isPrivateBlocked ? (
          <div className="py-20 text-center">
            <div className="text-3xl mb-3">🔒</div>
            <div className="text-sm font-medium">This account is private</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Connect with this user to see their posts.</div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square skel" />)}
          </div>
        ) : (
          <MediaGrid
            items={currentItems}
            emptyText={tab === "posts" ? "No posts yet." : "No reels yet."}
            onItemClick={(idx) => openViewer(currentItems, idx)}
          />
        )}
      </div>

      {/* Post viewer modal */}
      {viewerData && (
        <PostViewerModal
          items={viewerData.items}
          startIndex={viewerData.startIndex}
          onClose={() => setViewerData(null)}
        />
      )}
    </div>
  );
}
