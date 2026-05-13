import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiMessageCircle, FiBookmark, FiSend, FiMoreHorizontal, FiTrash2, FiEye } from "react-icons/fi";
import { feedsService } from "../../services";
import Avatar from "../ui/Avatar.jsx";
import ViewersPanel from "../ui/ViewersPanel.jsx";
import { useAuthStore } from "../../stores/authStore";
import { useAlertStore } from "../../stores/alertStore";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function isVideoUrl(u = "") {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
}

/** Patch a single post in every cached query that contains it. */
function patchPostInCache(qc, publicId, patch) {
  for (const q of qc.getQueryCache().findAll()) {
    const data = q.state.data;
    if (!Array.isArray(data) || !data.length || !data[0]?.public_id) continue;
    let changed = false;
    const next = data.map((p) => {
      if (p?.public_id === publicId) { changed = true; return { ...p, ...patch }; }
      return p;
    });
    if (changed) qc.setQueryData(q.queryKey, next);
  }
}

export default function PostCard({ post, onDeleted }) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const isMine = me?.username === post.author?.username;
  const showConfirm = useAlertStore((s) => s.showConfirm);

  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(!!post.saved);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);

  // Separate effects so a WS patch to likes_count doesn't reset liked/saved.
  useEffect(() => { setLiked(!!post.liked); }, [post.public_id, post.liked]);
  useEffect(() => { setLikes(post.likes_count || 0); }, [post.public_id, post.likes_count]);
  useEffect(() => { setSaved(!!post.saved); }, [post.public_id, post.saved]);
  useEffect(() => { setCommentsCount(post.comments_count || 0); }, [post.public_id, post.comments_count]);

  // Listen for real-time new comments pushed via WebSocket.
  useEffect(() => {
    const handler = (e) => {
      const { post_id, comment } = e.detail || {};
      if (post_id !== post.public_id || !comment) return;
      // Avoid duplicating if the current user just posted this comment.
      setComments((cs) => {
        if (!cs) return cs; // panel not loaded yet
        if (cs.some((c) => c.public_id === comment.public_id)) return cs;
        return [comment, ...cs];
      });
      setCommentsCount((n) => n + 1);
    };
    window.addEventListener("iwx:new-comment", handler);
    return () => window.removeEventListener("iwx:new-comment", handler);
  }, [post.public_id]);

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const r = await feedsService.like(post.public_id);
      const newLiked = typeof r?.liked === "boolean" ? r.liked : next;
      const newCount = typeof r?.likes_count === "number" ? r.likes_count : undefined;
      setLiked(newLiked);
      if (newCount !== undefined) setLikes(newCount);
      // Sync cache so the useEffect doesn't clobber our local state later.
      patchPostInCache(qc, post.public_id, { liked: newLiked, ...(newCount !== undefined && { likes_count: newCount }) });
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  };

  const onSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await feedsService.save(post.public_id);
      patchPostInCache(qc, post.public_id, { saved: next });
    } catch { setSaved(!next); }
  };

  const loadComments = async () => {
    setShowComments((v) => !v);
    if (comments == null) {
      try { setComments(await feedsService.comments(post.public_id) || []); }
      catch { setComments([]); }
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const c = await feedsService.comments(post.public_id, body);
      // Append only if not already added by the WS handler.
      setComments((cs) => {
        if (!cs) return [c];
        if (cs.some((x) => x.public_id === c.public_id)) return cs;
        return [c, ...cs];
      });
      setCommentsCount((n) => n + 1);
      setDraft("");
      patchPostInCache(qc, post.public_id, { comments_count: (post.comments_count || 0) + 1 });
    } finally { setPosting(false); }
  };

  const onDelete = async () => {
    const ok = await showConfirm("This post will be permanently deleted. This action cannot be undone.", { title: "Delete post?", confirmText: "Delete", variant: "danger" });
    if (!ok) return;
    setDeleting(true);
    try {
      await feedsService.remove(post.public_id);
      // Remove from all caches.
      for (const q of qc.getQueryCache().findAll()) {
        const data = q.state.data;
        if (!Array.isArray(data) || !data.length || !data[0]?.public_id) continue;
        const filtered = data.filter((p) => p?.public_id !== post.public_id);
        if (filtered.length !== data.length) qc.setQueryData(q.queryKey, filtered);
      }
      onDeleted?.();
    } catch {
      setDeleting(false);
    }
  };

  const openPostViewers = async () => {
    setShowMenu(false);
    setShowViewers(true);
    setViewersLoading(true);
    try {
      const res = await feedsService.postViewers(post.public_id);
      setViewers(res.viewers || []);
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  };

  const media = post.media_url;
  const video = isVideoUrl(media);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      <header className="flex items-center gap-3 p-4">
        <Link to={`/u/${post.author?.username}`}><Avatar user={post.author} /></Link>
        <div className="flex-1 min-w-0">
          <Link to={`/u/${post.author?.username}`} className="font-medium text-sm">
            {post.author?.display_name || post.author?.username}
          </Link>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            @{post.author?.username} · {timeAgo(post.created_at)}
          </div>
        </div>
        <div className="relative">
          <button className="btn-ghost p-2 rounded-full" aria-label="More" onClick={() => setShowMenu((v) => !v)}><FiMoreHorizontal /></button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-lg py-1 min-w-[140px]" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                {isMine && (
                  <>
                    <button
                      onClick={() => openPostViewers()}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:opacity-80"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <FiEye size={15} /> Liked by
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onDelete(); }}
                      disabled={deleting}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:opacity-80"
                      style={{ color: "#ef4444" }}
                    >
                      <FiTrash2 size={15} /> {deleting ? "Deleting…" : "Delete post"}
                    </button>
                  </>
                )}
                {!isMine && (
                  <div className="px-4 py-2 text-xs" style={{ color: "var(--text-muted)" }}>No actions</div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {media && (
        video ? (
          <video src={media} controls playsInline className="w-full max-h-[640px] bg-black" />
        ) : (
          <img src={media} alt="" className="w-full max-h-[640px] object-cover" />
        )
      )}

      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <button onClick={onLike} className="flex items-center gap-1.5 text-sm" aria-label="Like">
          <motion.span animate={{ scale: liked ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 400 }}>
            <FiHeart size={20} style={{ fill: liked ? "#ef4444" : "transparent", color: liked ? "#ef4444" : "var(--text-primary)" }} />
          </motion.span>
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 text-sm" aria-label="Comment">
          <FiMessageCircle size={20} />
        </button>
        <button className="flex items-center gap-1.5 text-sm" aria-label="Share"><FiSend size={18} /></button>
        <div className="flex-1" />
        <button onClick={onSave} aria-label="Save">
          <FiBookmark size={20} style={{ fill: saved ? "var(--text-primary)" : "transparent" }} />
        </button>
      </div>

      <div className="px-4 pb-3 text-sm">
        <div className="font-medium">{likes} like{likes === 1 ? "" : "s"}</div>
        {post.caption && (
          <div className="mt-1">
            <span className="font-medium mr-2">@{post.author?.username}</span>
            <span style={{ color: "var(--text-secondary)" }}>{post.caption}</span>
          </div>
        )}
        {commentsCount > 0 && !showComments && (
          <button onClick={loadComments} className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            View all {commentsCount} comments
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t overflow-hidden"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="px-4 py-3 flex flex-col gap-2 max-h-[280px] overflow-y-auto">
              {comments == null && <div className="text-xs" style={{ color: "var(--text-muted)" }}>Loading…</div>}
              {comments?.length === 0 && <div className="text-xs" style={{ color: "var(--text-muted)" }}>Be the first to comment.</div>}
              {comments?.map((c) => (
                <div key={c.public_id} className="flex items-start gap-2 text-sm">
                  <Avatar user={c.author} size={26} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium mr-2">@{c.author?.username}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{c.body}</span>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{timeAgo(c.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={submitComment} className="flex items-center gap-2 px-4 py-2 border-t" style={{ borderColor: "var(--border-color)" }}>
              <input
                className="input flex-1"
                placeholder="Add a comment..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="btn-primary px-3 py-2" disabled={!draft.trim() || posting}>Post</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <ViewersPanel
        open={showViewers}
        onClose={() => setShowViewers(false)}
        viewers={viewers}
        loading={viewersLoading}
        title="Liked by"
        timeKey="liked_at"
      />
    </motion.article>
  );
}
