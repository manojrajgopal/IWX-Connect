import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { FiX, FiUploadCloud, FiImage, FiFilm, FiCircle } from "react-icons/fi";
import { feedsService, mediaService } from "../../services";
import { useUIStore } from "../../stores/uiStore";

const KIND_META = {
  post:  { label: "Post",  Icon: FiImage,  accept: "image/*,video/*", help: "Share a photo or video with your connections." },
  reel:  { label: "Reel",  Icon: FiFilm,   accept: "video/*",          help: "A short video that loops. Visible in the Reels tab." },
  story: { label: "Story", Icon: FiCircle, accept: "image/*,video/*", help: "Disappears in 24 hours." },
};

function isVideo(mime = "") { return mime.startsWith("video/"); }

export default function Composer() {
  const composer = useUIStore((s) => s.composer);
  const close = useUIStore((s) => s.closeComposer);
  const openComposer = useUIStore((s) => s.openComposer);
  const qc = useQueryClient();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const meta = KIND_META[composer.kind] || KIND_META.post;

  // Reset on close
  useEffect(() => {
    if (!composer.open) {
      setFile(null);
      setPreviewUrl((url) => { if (url) URL.revokeObjectURL(url); return null; });
      setCaption("");
      setProgress(0);
      setSubmitting(false);
      setError("");
    }
  }, [composer.open]);

  // Manage object URL lifecycle
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Lock body scroll
  useEffect(() => {
    if (!composer.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [composer.open]);

  const onPickFile = useCallback((f) => {
    setError("");
    if (!f) return;
    if (composer.kind === "reel" && !f.type.startsWith("video/")) {
      setError("Reels must be a video.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File too large (max 50MB).");
      return;
    }
    setFile(f);
  }, [composer.kind]);

  const submit = useCallback(async () => {
    if (!file) { setError("Please choose a file."); return; }
    setSubmitting(true);
    setError("");
    try {
      const asset = await mediaService.upload(file, setProgress);
      await feedsService.create({
        kind: composer.kind,
        caption,
        media_url: asset.url,
        thumbnail_url: isVideo(asset.mime) ? "" : asset.url,
      });
      // Refetch all lists that may show this content
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["reels"] });
      qc.invalidateQueries({ queryKey: ["stories"] });
      qc.invalidateQueries({ queryKey: ["explore"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      close();
    } catch (e) {
      setError(e?.response?.data?.error?.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  }, [file, caption, composer.kind, close, qc]);

  if (!composer.open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="composer-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <motion.div
          key="composer-panel"
          initial={{ y: 30, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="card w-full max-w-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "90vh" }}
        >
          <header className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-color)" }}>
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-xl">Create</h3>
              <div className="flex gap-1 ml-2">
                {Object.entries(KIND_META).map(([k, m]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => openComposer(k)}
                    className="px-3 py-1 text-xs rounded-full transition"
                    style={{
                      background: composer.kind === k ? "var(--accent)" : "transparent",
                      color: composer.kind === k ? "var(--accent-inverse)" : "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-ghost p-2 rounded-full" onClick={close} aria-label="Close"><FiX /></button>
          </header>

          <div className="grid md:grid-cols-2 gap-0 flex-1 overflow-hidden">
            {/* Left: media picker / preview */}
            <div className="p-5 flex flex-col" style={{ background: "var(--bg-surface)" }}>
              <div
                className="flex-1 flex items-center justify-center rounded-md overflow-hidden relative"
                style={{ background: "var(--bg-surface-2)", minHeight: 280, border: "1px dashed var(--border-color)" }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); onPickFile(e.dataTransfer.files?.[0]); }}
              >
                {previewUrl && file ? (
                  isVideo(file.type)
                    ? <video src={previewUrl} controls className="max-h-full max-w-full" />
                    : <img src={previewUrl} alt="preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center gap-3 text-center px-6 py-8 transition hover:opacity-80"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <FiUploadCloud size={42} />
                    <div className="text-sm">Drag &amp; drop, or click to choose</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{meta.help}</div>
                  </button>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={meta.accept}
                hidden
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              {file && (
                <div className="flex items-center justify-between mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="truncate max-w-[60%]">{file.name}</span>
                  <button type="button" className="btn-ghost px-2 py-1" onClick={() => inputRef.current?.click()}>Change</button>
                </div>
              )}
            </div>

            {/* Right: caption + submit */}
            <div className="p-5 flex flex-col gap-3 overflow-y-auto">
              <label className="label">Caption</label>
              <textarea
                className="input flex-1"
                rows={6}
                placeholder={composer.kind === "story" ? "Add a caption for your story (optional)" : "Write a caption..."}
                value={caption}
                maxLength={2200}
                onChange={(e) => setCaption(e.target.value)}
                style={{ minHeight: 140, resize: "vertical" }}
              />
              <div className="text-[11px] text-right" style={{ color: "var(--text-muted)" }}>{caption.length}/2200</div>

              {error && <div className="text-xs" style={{ color: "#ef4444" }}>{error}</div>}

              {submitting && (
                <div className="w-full h-1.5 rounded overflow-hidden" style={{ background: "var(--bg-surface-2)" }}>
                  <div className="h-full transition-all" style={{ width: `${progress}%`, background: "var(--accent)" }} />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-auto pt-3">
                <button type="button" className="btn" onClick={close} disabled={submitting}>Cancel</button>
                <button type="button" className="btn-primary" onClick={submit} disabled={submitting || !file}>
                  {submitting ? "Sharing…" : `Share ${meta.label}`}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
