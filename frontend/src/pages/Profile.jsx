import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCamera, FiGrid, FiFilm, FiBookmark, FiX,
  FiHeart, FiMessageCircle, FiPlay,
} from "react-icons/fi";
import { useAuthStore } from "../stores/authStore";
import { authService, feedsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";
import PostCard from "../components/feed/PostCard.jsx";

/* ── helpers ── */
function isVideoUrl(u = "") {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
}

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(0) + "K";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/* ── Lazy grid thumbnail ── */
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
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-semibold">
        <span className="flex items-center gap-1"><FiHeart size={16} /> {formatCount(item.likes_count)}</span>
        <span className="flex items-center gap-1"><FiMessageCircle size={16} /> {formatCount(item.comments_count)}</span>
      </div>
    </button>
  );
}

/* ── Media grid ── */
function MediaGrid({ items, emptyText, onItemClick }) {
  if (!items?.length) {
    return (
      <div className="py-20 text-center">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>{emptyText}</div>
      </div>
    );
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
    const container = scrollRef.current;
    const target = container.children[startIndex];
    if (target) {
      target.scrollIntoView({ block: "start" });
    }
    setMounted(true);
  }, [startIndex, items, mounted]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="post-viewer-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="post-viewer-panel"
          initial={{ y: 30, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="w-full md:max-w-lg flex flex-col"
          style={{
            height: "calc(100dvh - 40px)",
            maxHeight: "calc(100dvh - 40px)",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          {/* Header */}
          <header
            className="flex items-center justify-between px-4 py-3 shrink-0 md:rounded-t-2xl"
            style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}
          >
            <span className="text-sm font-semibold">Posts</span>
            <button onClick={onClose} className="p-1.5 rounded-full transition hover:opacity-70" aria-label="Close">
              <FiX size={20} />
            </button>
          </header>
          {/* Scrollable posts */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto"
            style={{ background: "var(--bg-page)" }}
          >
            <div className="max-w-lg mx-auto flex flex-col gap-3 py-3 px-2">
              {items.map((post) => (
                <PostCard key={post.public_id} post={post} />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

/* ── Stats row ── */
function StatItem({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold">{formatCount(value)}</span>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

/* ══════════════════════════
   PROFILE PAGE
   ══════════════════════════ */
export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  const [tab, setTab] = useState("posts");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", about: "", location: "", website: "", is_private: true });
  const [saving, setSaving] = useState(false);
  const [viewerData, setViewerData] = useState(null); // { items, startIndex }
  const avatarInput = useRef(null);
  const coverInput = useRef(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      display_name: user.display_name || "",
      about: user.profile?.about || "",
      location: user.profile?.location || "",
      website: user.profile?.website || "",
      is_private: !!user.profile?.is_private,
    });
  }, [user]);

  const posts = useQuery({
    queryKey: ["user-posts", user?.username, "post"],
    queryFn: () => feedsService.userPosts(user.username, "post"),
    enabled: !!user?.username,
  });
  const reels = useQuery({
    queryKey: ["user-posts", user?.username, "reel"],
    queryFn: () => feedsService.userPosts(user.username, "reel"),
    enabled: !!user?.username,
  });
  const saved = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => feedsService.bookmarks(),
    enabled: !!user?.username,
  });

  const onPickPhoto = async (kind, file) => {
    if (!file) return;
    try {
      const me = await authService.uploadPhoto(file, kind);
      setUser(me);
    } catch {}
  };

  const save = async () => {
    setSaving(true);
    try {
      const me = await authService.updateProfile(form);
      setUser(me);
      setEditing(false);
    } finally { setSaving(false); }
  };

  const openViewer = useCallback((items, idx) => {
    setViewerData({ items, startIndex: idx });
  }, []);

  if (!user) return null;
  const cover = user.profile?.cover;
  const counts = user.counts || {};

  const currentItems = tab === "posts" ? posts.data : tab === "reels" ? reels.data : saved.data;
  const loading = tab === "posts" ? posts.isLoading : tab === "reels" ? reels.isLoading : saved.isLoading;

  const TABS = [
    { k: "posts", icon: FiGrid, label: "Posts", count: counts.posts },
    { k: "reels", icon: FiFilm, label: "Reels", count: counts.reels },
    { k: "saved", icon: FiBookmark, label: "Saved" },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Cover */}
      <div className="relative" style={{ height: 200, background: "var(--bg-surface-2)", overflow: "hidden" }}>
        {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
        <button
          onClick={() => coverInput.current?.click()}
          className="absolute right-3 bottom-3 btn flex items-center gap-2 text-xs"
          title="Change cover"
        >
          <FiCamera size={14} /> Cover
        </button>
        <input ref={coverInput} type="file" hidden accept="image/*" onChange={(e) => onPickPhoto("cover", e.target.files?.[0])} />
      </div>

      {/* Avatar + info */}
      <div className="px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
          <div className="relative shrink-0">
            <div className="rounded-full p-1" style={{ background: "var(--bg-page)" }}>
              <Avatar user={user} size={96} />
            </div>
            <button
              onClick={() => avatarInput.current?.click()}
              className="absolute bottom-1 right-1 rounded-full p-1.5"
              style={{ background: "var(--accent)", color: "#fff" }}
              aria-label="Change avatar"
            >
              <FiCamera size={12} />
            </button>
            <input ref={avatarInput} type="file" hidden accept="image/*" onChange={(e) => onPickPhoto("avatar", e.target.files?.[0])} />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl font-semibold">{user.display_name || user.username}</h1>
              <button
                className="btn text-xs px-3 py-1.5"
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? "Cancel" : "Edit profile"}
              </button>
            </div>
            <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>@{user.username}</div>
          </div>
        </div>

        {/* Bio */}
        {(user.profile?.about || user.profile?.location || user.profile?.website) && (
          <div className="mt-3 text-center sm:text-left">
            {user.profile?.about && <p className="text-sm">{user.profile.about}</p>}
            <div className="text-xs mt-1 flex flex-wrap gap-2 justify-center sm:justify-start" style={{ color: "var(--text-muted)" }}>
              {user.profile?.location && <span>{user.profile.location}</span>}
              {user.profile?.website && (
                <a href={user.profile.website} target="_blank" rel="noreferrer" className="underline" style={{ color: "var(--accent)" }}>
                  {user.profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-center sm:justify-start gap-8 mt-4">
          <StatItem value={counts.posts || posts.data?.length || 0} label="posts" />
          <StatItem value={counts.reels || reels.data?.length || 0} label="reels" />
          <StatItem value={counts.connections || 0} label="connections" />
        </div>
      </div>

      {/* Edit form */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-5 mt-4 mx-4 md:mx-6 grid gap-4">
              <div>
                <label className="label">Display name</label>
                <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              </div>
              <div>
                <label className="label">About</label>
                <textarea className="input" rows={3} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} style={{ resize: "none" }} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Location</label>
                  <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={form.is_private} onChange={(e) => setForm({ ...form, is_private: e.target.checked })} />
                Private profile
              </label>
              <div className="flex justify-end">
                <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {loading ? (
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square skel" />
            ))}
          </div>
        ) : (
          <MediaGrid
            items={currentItems}
            emptyText={
              tab === "posts" ? "No posts yet" :
              tab === "reels" ? "No reels yet" :
              "Nothing saved yet"
            }
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
