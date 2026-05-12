import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FiHeart, FiMessageCircle, FiSend, FiVolume2, FiVolumeX, FiTrash2 } from "react-icons/fi";
import { feedsService } from "../services";
import { useAuthStore } from "../stores/authStore";
import ComposeFab from "../components/composer/ComposeFab.jsx";

function ReelItem({ post, onDeleted }) {
  const ref = useRef(null);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const me = useAuthStore((s) => s.user);
  const isMine = me?.username === post.author?.username;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const r = await feedsService.like(post.public_id);
      if (typeof r?.likes_count === "number") setLikes(r.likes_count);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Delete this reel permanently?")) return;
    try {
      await feedsService.remove(post.public_id);
      onDeleted?.(post.public_id);
    } catch {}
  };

  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="snap-start h-full flex items-center justify-center relative"
      style={{ background: "#000" }}
    >
      {post.media_url ? (
        <video
          ref={ref}
          src={post.media_url}
          loop
          muted={muted}
          playsInline
          className="h-full w-full object-cover"
          onClick={() => { const v = ref.current; if (v) v.paused ? v.play() : v.pause(); }}
        />
      ) : (
        <div className="text-sm text-white/60">No media</div>
      )}

      {/* Right action rail */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center text-white">
        <button onClick={onLike} className="flex flex-col items-center gap-1">
          <FiHeart size={28} style={{ fill: liked ? "#ef4444" : "transparent", color: liked ? "#ef4444" : "#fff" }} />
          <span className="text-[11px]">{likes}</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <FiMessageCircle size={26} />
          <span className="text-[11px]">{post.comments_count || 0}</span>
        </button>
        <button className="flex flex-col items-center gap-1"><FiSend size={24} /></button>
        <button onClick={() => setMuted((m) => !m)} className="flex flex-col items-center gap-1">
          {muted ? <FiVolumeX size={22} /> : <FiVolume2 size={22} />}
        </button>
        {isMine && (
          <button onClick={onDelete} className="flex flex-col items-center gap-1" style={{ color: "#ef4444" }}>
            <FiTrash2 size={22} />
            <span className="text-[11px]">Delete</span>
          </button>
        )}
      </div>

      {/* Caption */}
      <div className="absolute bottom-6 left-4 right-20 text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
        <div className="font-medium">@{post.author?.username}</div>
        {post.caption && <div className="text-sm mt-1 line-clamp-3">{post.caption}</div>}
      </div>
    </motion.section>
  );
}

export default function Reels() {
  const { data, isLoading } = useQuery({ queryKey: ["reels"], queryFn: () => feedsService.feed("reel") });
  const qc = useQueryClient();

  const handleDeleted = (publicId) => {
    // Remove from local cache immediately
    for (const q of qc.getQueryCache().findAll()) {
      const d = q.state.data;
      if (!Array.isArray(d) || !d.length || !d[0]?.public_id) continue;
      const filtered = d.filter((p) => p?.public_id !== publicId);
      if (filtered.length !== d.length) qc.setQueryData(q.queryKey, filtered);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-var(--header-height)-var(--mobilebar-height))] md:h-[calc(100vh-var(--header-height))] flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="skel" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div className="skel" style={{ height: 14, width: 120 }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-var(--header-height)-var(--mobilebar-height))] md:h-[calc(100vh-var(--header-height))] overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {(data || []).map((p) => <ReelItem key={p.public_id} post={p} onDeleted={handleDeleted} />)}
      {!data?.length && (
        <div className="h-full flex items-center justify-center text-center px-6" style={{ color: "var(--text-muted)" }}>
          <div>
            <p className="mb-3">No reels yet.</p>
            <p className="text-sm">Tap the + button to share the first reel.</p>
          </div>
        </div>
      )}
      <ComposeFab kind="reel" />
    </div>
  );
}
