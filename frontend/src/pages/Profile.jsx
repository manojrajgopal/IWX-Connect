import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FiCamera, FiGrid, FiFilm, FiBookmark } from "react-icons/fi";
import { useAuthStore } from "../stores/authStore";
import { authService, feedsService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";
import ComposeFab from "../components/composer/ComposeFab.jsx";

function LazyMediaItem({ p }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

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

  const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(p.media_url || "");

  return (
    <motion.div
      ref={ref}
      key={p.public_id}
      whileHover={{ scale: 1.01 }}
      className="aspect-square overflow-hidden relative"
      style={{ background: "var(--bg-surface-2)", borderRadius: 4 }}
    >
      {!visible ? (
        <div className="w-full h-full skel" />
      ) : isVideo ? (
        <video src={p.media_url} muted className="w-full h-full object-cover" />
      ) : p.media_url ? (
        <img src={p.media_url} alt="" loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs p-2 text-center" style={{ color: "var(--text-muted)" }}>
          {p.caption?.slice(0, 80) || ""}
        </div>
      )}
    </motion.div>
  );
}

function PostsGrid({ items, emptyText }) {
  if (!items?.length) return <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>{emptyText}</div>;
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {items.map((p) => <LazyMediaItem key={p.public_id} p={p} />)}
    </div>
  );
}

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [tab, setTab] = useState("posts"); // posts | reels | saved
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", about: "", location: "", website: "", is_private: true });
  const [saving, setSaving] = useState(false);
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
    enabled: !!user?.username && tab === "posts",
  });
  const reels = useQuery({
    queryKey: ["user-posts", user?.username, "reel"],
    queryFn: () => feedsService.userPosts(user.username, "reel"),
    enabled: !!user?.username && tab === "reels",
  });
  const saved = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => feedsService.bookmarks(),
    enabled: tab === "saved",
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

  if (!user) return null;
  const cover = user.profile?.cover;

  return (
    <div className="container-x py-0 md:py-6 max-w-4xl">
      {/* Cover */}
      <div className="relative" style={{ height: 200, background: "var(--bg-surface-2)", borderRadius: 0, overflow: "hidden" }}>
        {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
        <button
          onClick={() => coverInput.current?.click()}
          className="absolute right-3 bottom-3 btn flex items-center gap-2"
          title="Change cover"
        >
          <FiCamera /> Cover
        </button>
        <input ref={coverInput} type="file" hidden accept="image/*" onChange={(e) => onPickPhoto("cover", e.target.files?.[0])} />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-4 px-4 md:px-0 -mt-12 md:-mt-14">
        <div className="relative">
          <div className="rounded-full p-1" style={{ background: "var(--bg-page)" }}>
            <Avatar user={user} size={104} />
          </div>
          <button
            onClick={() => avatarInput.current?.click()}
            className="absolute bottom-2 right-2 rounded-full p-2"
            style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}
            aria-label="Change avatar"
          >
            <FiCamera size={14} />
          </button>
          <input ref={avatarInput} type="file" hidden accept="image/*" onChange={(e) => onPickPhoto("avatar", e.target.files?.[0])} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-3xl">{user.display_name || user.username}</h2>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>@{user.username}</div>
          {user.profile?.about && <div className="text-sm mt-2">{user.profile.about}</div>}
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {user.profile?.location && <span>{user.profile.location} · </span>}
            {user.profile?.website && <a href={user.profile.website} target="_blank" rel="noreferrer" className="underline">{user.profile.website}</a>}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setEditing((v) => !v)}>{editing ? "Cancel" : "Edit profile"}</button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card p-5 mt-5 grid gap-4 mx-4 md:mx-0">
          <div><label className="label">Display name</label>
            <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
          <div><label className="label">About</label>
            <textarea className="input" rows={3} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="label">Website</label>
              <input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={form.is_private} onChange={(e) => setForm({ ...form, is_private: e.target.checked })} />
            Private profile (visible only to accepted connections)
          </label>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center gap-8 mt-8 border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
        {[
          { k: "posts", icon: FiGrid, label: "Posts" },
          { k: "reels", icon: FiFilm, label: "Reels" },
          { k: "saved", icon: FiBookmark, label: "Saved" },
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
        {tab === "posts" && <PostsGrid items={posts.data} emptyText="No posts yet — tap + to create one." />}
        {tab === "reels" && <PostsGrid items={reels.data} emptyText="No reels yet." />}
        {tab === "saved" && <PostsGrid items={saved.data} emptyText="Nothing saved yet." />}
      </div>

      <ComposeFab kind="post" />
    </div>
  );
}
