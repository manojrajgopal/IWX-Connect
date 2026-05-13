import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiChevronLeft, FiChevronRight, FiTrash2, FiMoreVertical, FiEye } from "react-icons/fi";
import { feedsService } from "../../services";
import { useUIStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";
import { useAlertStore } from "../../stores/alertStore";
import Avatar from "../ui/Avatar.jsx";
import ViewersPanel from "../ui/ViewersPanel.jsx";

const STORY_DURATION_MS = 5000;

function isVideo(u = "") { return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u); }

function storyTimeLabel(story) {
  if (!story?.created_at) return "";
  const created = new Date(story.created_at);
  const now = new Date();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return created.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function StoriesViewer() {
  const { open, stories, index } = useUIStore((s) => s.storyViewer);
  const close = useUIStore((s) => s.closeStoryViewer);
  const openViewer = useUIStore((s) => s.openStoryViewer);
  const me = useAuthStore((s) => s.user);
  const showConfirm = useAlertStore((s) => s.showConfirm);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const pausedRef = useRef(false);

  const current = stories?.[index];
  const isMine = current && me?.username === current.author?.username;

  const advance = useCallback(() => {
    if (index + 1 >= stories.length) close();
    else openViewer(stories, index + 1);
  }, [stories, index, close, openViewer]);

  const back = useCallback(() => {
    if (index > 0) openViewer(stories, index - 1);
  }, [stories, index, openViewer]);

  const onDeleteStory = async () => {
    setShowMenu(false);
    const ok = await showConfirm("This story will be permanently deleted. This action cannot be undone.", { title: "Delete story?", confirmText: "Delete", variant: "danger" });
    if (!ok || !current) return;
    pausedRef.current = true;
    try {
      await feedsService.remove(current.public_id);
      const remaining = stories.filter((s) => s.public_id !== current.public_id);
      if (!remaining.length) { close(); return; }
      const nextIdx = Math.min(index, remaining.length - 1);
      openViewer(remaining, nextIdx);
    } catch {
      pausedRef.current = false;
    }
  };

  const openViewers = async () => {
    setShowMenu(false);
    pausedRef.current = true;
    setShowViewers(true);
    setViewersLoading(true);
    try {
      const res = await feedsService.storyViewers(current.public_id);
      setViewers(res.viewers || []);
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  };

  const closeViewers = () => {
    setShowViewers(false);
    pausedRef.current = false;
  };

  // Mark viewed
  useEffect(() => {
    if (!open || !current) return;
    feedsService.viewStory(current.public_id).catch(() => {});
  }, [open, current]);

  // Auto-advance progress
  useEffect(() => {
    if (!open || !current) return;
    setProgress(0);
    startRef.current = performance.now();
    pausedRef.current = false;
    let pauseAccum = 0;
    let pauseStart = 0;

    const tick = (now) => {
      if (pausedRef.current) {
        if (!pauseStart) pauseStart = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      } else if (pauseStart) {
        pauseAccum += now - pauseStart;
        pauseStart = 0;
      }
      const elapsed = now - startRef.current - pauseAccum;
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) advance();
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current, advance]);

  // Keyboard controls
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") advance();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, advance, back, close]);

  if (!open || !current) return null;

  const media = current.media_url;
  const video = isVideo(media);

  return createPortal(
    <>
    <AnimatePresence>
      <motion.div
        key="story-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.95)" }}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        onMouseDown={() => { pausedRef.current = true; }}
        onMouseUp={() => { if (!showMenu && !showViewers) pausedRef.current = false; }}
        onMouseLeave={() => { if (!showMenu && !showViewers) pausedRef.current = false; }}
      >
        <button
          className="absolute top-4 right-4 text-white p-2 rounded-full z-20"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={close}
          aria-label="Close"
        >
          <FiX size={22} />
        </button>

        <button
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full z-20"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={back}
          disabled={index === 0}
        >
          <FiChevronLeft size={22} />
        </button>
        <button
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full z-20"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={advance}
        >
          <FiChevronRight size={22} />
        </button>

        <div className="relative flex flex-col" style={{ width: "min(420px, 96vw)", height: "min(80vh, 720px)" }}>
          {/* Progress bars */}
          <div className="absolute top-2 inset-x-3 flex gap-1 z-20">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
                <div className="h-full" style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                  background: "white",
                  transition: i === index ? "none" : "width .15s linear",
                }} />
              </div>
            ))}
          </div>
          {/* Header */}
          <div className="absolute top-6 inset-x-3 flex items-center gap-3 z-20 pt-2">
            <Avatar user={current.author} size={32} />
            <div className="flex-1 min-w-0" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
              <div className="text-white text-sm font-medium truncate">@{current.author?.username}</div>
              <div className="text-[11px] text-white/60">{storyTimeLabel(current)}</div>
            </div>
            {isMine && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu((v) => { const next = !v; pausedRef.current = next; return next; }); }}
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}
                  aria-label="Story options"
                >
                  <FiMoreVertical size={18} />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => { setShowMenu(false); pausedRef.current = false; }} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-xl py-1 min-w-[160px] overflow-hidden"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); openViewers(); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <FiEye size={15} /> Seen by
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteStory(); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                          style={{ color: "#ef4444" }}
                        >
                          <FiTrash2 size={15} /> Delete story
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Tap zones */}
          <button className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={back} aria-label="Previous" />
          <button className="absolute right-0 top-0 bottom-0 w-1/3 z-10" onClick={advance} aria-label="Next" />

          <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: "#000" }}>
            {video
              ? <video key={current.public_id} src={media} autoPlay playsInline className="max-h-full max-w-full" onEnded={advance} />
              : <img key={current.public_id} src={media} alt="" className="max-h-full max-w-full object-contain" />}
          </div>
          {current.caption && (
            <div className={`absolute inset-x-4 text-white text-sm text-center ${isMine ? "bottom-14" : "bottom-4"}`} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>
              {current.caption}
            </div>
          )}
          {/* Seen-by bar for own stories */}
          {isMine && (
            <button
              className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-center gap-2 py-3 text-white/80 hover:text-white transition-colors"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))", borderRadius: "0 0 8px 8px" }}
              onClick={(e) => { e.stopPropagation(); openViewers(); }}
            >
              <FiEye size={16} />
              <span className="text-sm font-medium">{current.views_count ?? 0}</span>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
    <ViewersPanel
      open={showViewers}
      onClose={closeViewers}
      onNavigate={close}
      viewers={viewers}
      loading={viewersLoading}
      title="Seen by"
      timeKey="viewed_at"
    />
    </>,
    document.body
  );
}
