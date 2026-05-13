import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiEye, FiClock } from "react-icons/fi";
import Avatar from "./Avatar.jsx";

function formatViewTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) + ` at ${time}`;
}

/**
 * @param {{ open: boolean, onClose: () => void, viewers: Array, loading: boolean, title?: string, timeKey?: string }} props
 */
export default function ViewersPanel({ open, onClose, viewers = [], loading, title = "Viewed by", timeKey = "viewed_at" }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="viewers-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", maxHeight: "70vh" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}
            >
              <div className="flex items-center gap-2.5">
                <FiEye size={18} style={{ color: "var(--text-muted)" }} />
                <h3 className="text-sm font-semibold">{title}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--bg-surface)", color: "var(--text-secondary)" }}
                >
                  {viewers.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: "var(--text-muted)" }}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 60px)" }}>
              {loading && (
                <div className="flex flex-col gap-3 p-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skel" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                      <div className="flex-1">
                        <div className="skel" style={{ height: 12, width: "60%", marginBottom: 6 }} />
                        <div className="skel" style={{ height: 10, width: "40%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && viewers.length === 0 && (
                <div className="py-12 text-center">
                  <FiEye size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No views yet</p>
                </div>
              )}

              {!loading && viewers.length > 0 && (
                <div className="flex flex-col">
                  {viewers.map((v, i) => (
                    <motion.div
                      key={v.username}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 px-5 py-3 transition-colors"
                      style={{ borderBottom: i < viewers.length - 1 ? "1px solid var(--border-color)" : "none" }}
                    >
                      <Avatar user={v} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {v.display_name || v.username}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          @{v.username}
                        </div>
                      </div>
                      {v[timeKey] && (
                        <div className="flex items-center gap-1.5 text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
                          <FiClock size={11} />
                          <span>{formatViewTime(v[timeKey])}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
