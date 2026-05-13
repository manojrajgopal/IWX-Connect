import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiX, FiUploadCloud, FiImage, FiFilm, FiCircle, FiChevronDown,
  FiChevronLeft, FiChevronRight,
  FiUsers, FiGlobe, FiCheck, FiLoader,
  FiMusic, FiMapPin, FiHash, FiStar,
  FiEdit3, FiSliders, FiMessageCircle, FiShare2, FiEyeOff,
} from "react-icons/fi";
import { feedsService, mediaService } from "../../services";
import { useUIStore } from "../../stores/uiStore";

/* ── helpers ── */
function isVideo(mime = "") { return mime.startsWith("video/"); }
const MAX_FILE = 50 * 1024 * 1024;

const VISIBILITY = [
  { value: "all", label: "Everyone", desc: "Visible to all users", icon: FiGlobe },
  { value: "connections", label: "Connections only", desc: "Only your connections", icon: FiUsers },
  { value: "close_friends", label: "Close friends", desc: "A smaller circle", icon: FiStar },
];

/* ── Shared: Toggle ── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-10 h-[22px] rounded-full transition-colors shrink-0"
      style={{ background: checked ? "var(--accent)" : "var(--bg-surface-2)", border: "1px solid var(--border-color)" }}
    >
      <motion.span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
        animate={{ left: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ── Shared: Setting row ── */
function SettingRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ── Shared: Visibility selector ── */
function VisibilitySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = VISIBILITY.find((v) => v.value === value) || VISIBILITY[1];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-color)" }}
      >
        <Icon size={15} style={{ color: "var(--accent)" }} />
        <span className="flex-1 text-left">{current.label}</span>
        <FiChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 mt-1 rounded-lg overflow-hidden z-10 shadow-lg"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            {VISIBILITY.map((v) => {
              const VIcon = v.icon;
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => { onChange(v.value); setOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 w-full text-left text-sm transition hover:opacity-80"
                  style={{ background: value === v.value ? "var(--bg-surface-2)" : "transparent" }}
                >
                  <VIcon size={15} style={{ color: "var(--accent)" }} />
                  <div className="flex-1">
                    <div className="font-medium">{v.label}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{v.desc}</div>
                  </div>
                  {value === v.value && <FiCheck size={14} style={{ color: "var(--accent)" }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Progress bar ── */
function UploadProgress({ progress }) {
  if (!progress) return null;
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--bg-surface-2)" }}>
      <motion.div className="h-full rounded-full" style={{ background: "var(--accent)" }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
    </div>
  );
}

/* ── Step indicator ── */
function StepIndicator({ steps, current, onStep }) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 shrink-0 border-b" style={{ borderColor: "var(--border-color)" }}>
      {steps.map((s, i) => {
        const Icon = s.icon;
        const active = i === current;
        const done = i < current;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onStep(i)}
            className="flex items-center gap-1.5 flex-1 py-1.5 rounded-lg text-xs font-medium transition-all justify-center"
            style={{
              color: active ? "var(--accent)" : done ? "var(--text-primary)" : "var(--text-muted)",
              background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
            }}
          >
            {done ? <FiCheck size={13} /> : <Icon size={13} />}
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Step animation variants ── */
const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

/* ══════════════════════════════════════
   STORY PANEL (single-step, no wizard)
   ══════════════════════════════════════ */
function StoryPanel({ onSubmit, submitting, progress, error }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("connections");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f) => { if (f && f.size <= MAX_FILE) setFile(f); };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 flex flex-col gap-4 max-w-lg mx-auto">
        <div className="w-full rounded-2xl overflow-hidden relative" style={{ aspectRatio: "9/16", maxHeight: 400, background: "var(--bg-surface-2)" }}>
          {preview && file ? (
            <>
              {isVideo(file.type)
                ? <video src={preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                : <img src={preview} alt="" className="w-full h-full object-cover" />}
              {caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(transparent, rgba(0,0,0,.6))" }}>
                  <p className="text-white text-sm">{caption}</p>
                </div>
              )}
            </>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ color: "var(--text-secondary)" }}>
              <FiUploadCloud size={40} />
              <span className="text-sm font-medium">Add to your story</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Photo or video, disappears in 24h</span>
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </div>
        {file && (
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium self-center px-3 py-1.5 rounded-lg" style={{ color: "var(--accent)", background: "var(--bg-surface-2)" }}>
            Change media
          </button>
        )}
        <input className="input text-sm" placeholder="Add a caption (optional)" value={caption} maxLength={500} onChange={(e) => setCaption(e.target.value)} />
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Who can see this</label>
          <VisibilitySelect value={visibility} onChange={setVisibility} />
        </div>
        <UploadProgress progress={progress} />
        {error && <div className="text-xs" style={{ color: "#ef4444" }}>{error}</div>}
        <button type="button" disabled={!file || submitting} onClick={() => onSubmit({ file, caption, visibility, kind: "story" })}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: file ? "var(--accent)" : "var(--bg-surface-2)", color: file ? "#fff" : "var(--text-muted)", opacity: submitting ? 0.6 : 1 }}>
          {submitting ? <FiLoader className="animate-spin mx-auto" size={18} /> : "Share to story"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   POST WIZARD (multi-step)
   ══════════════════════════════════════ */
const POST_STEPS = [
  { key: "media", label: "Media", icon: FiImage },
  { key: "details", label: "Details", icon: FiEdit3 },
  { key: "settings", label: "Settings", icon: FiSliders },
];

function PostPanel({ onSubmit, submitting, progress, error }) {
  const inputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState({
    file: null, preview: null,
    caption: "", visibility: "connections",
    hide_likes: false, hide_comments: false,
    allow_comments: true, allow_sharing: true,
  });

  useEffect(() => {
    if (!form.file) return;
    const url = URL.createObjectURL(form.file);
    setForm((f) => ({ ...f, preview: url }));
    return () => URL.revokeObjectURL(url);
  }, [form.file]);

  const pick = (f) => { if (f && f.size <= MAX_FILE) setForm((prev) => ({ ...prev, file: f })); };
  const go = (i) => { setDir(i > step ? 1 : -1); setStep(i); };
  const next = () => go(Math.min(step + 1, POST_STEPS.length - 1));
  const prev = () => go(Math.max(step - 1, 0));
  const upd = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => onSubmit({
    file: form.file, caption: form.caption, visibility: form.visibility,
    kind: "post", hide_likes: form.hide_likes, hide_comments: form.hide_comments,
    allow_comments: form.allow_comments, allow_sharing: form.allow_sharing,
  });

  const isLast = step === POST_STEPS.length - 1;

  const renderStep = () => {
    switch (POST_STEPS[step].key) {
      case "media":
        return (
          <div className="flex flex-col gap-4">
            <div
              className="flex-1 flex items-center justify-center rounded-xl overflow-hidden relative"
              style={{ background: "var(--bg-surface-2)", border: form.preview ? "none" : "2px dashed var(--border-color)", minHeight: 260 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
            >
              {form.preview && form.file ? (
                isVideo(form.file.type)
                  ? <video src={form.preview} controls className="w-full h-full object-contain" style={{ maxHeight: 360 }} />
                  : <img src={form.preview} alt="" className="w-full h-full object-contain" style={{ maxHeight: 360 }} />
              ) : (
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center gap-2.5 text-center px-6 py-8 transition hover:opacity-80"
                  style={{ color: "var(--text-secondary)" }}>
                  <FiUploadCloud size={36} />
                  <span className="text-sm font-medium">Tap to choose or drag & drop</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Photo or video, max 50MB</span>
                </button>
              )}
              <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
            </div>
            {form.file && (
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="truncate max-w-[60%]">{form.file.name}</span>
                <button type="button" onClick={() => inputRef.current?.click()} className="font-medium" style={{ color: "var(--accent)" }}>Change</button>
              </div>
            )}
            <div className="p-3 rounded-lg text-xs" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
              <FiImage size={14} className="inline mr-1.5" style={{ color: "var(--accent)" }} />
              Crop & edit tools coming soon
            </div>
          </div>
        );
      case "details":
        return (
          <div className="flex flex-col gap-4">
            {form.preview && form.file && (
              <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "var(--bg-surface-2)" }}>
                {isVideo(form.file.type)
                  ? <div className="w-12 h-12 rounded bg-black flex items-center justify-center"><FiFilm size={18} className="text-white/60" /></div>
                  : <img src={form.preview} alt="" className="w-12 h-12 rounded object-cover" />}
                <span className="text-xs truncate flex-1" style={{ color: "var(--text-muted)" }}>{form.file.name}</span>
              </div>
            )}
            <textarea
              className="input text-sm"
              rows={4}
              placeholder="Write a caption..."
              value={form.caption}
              maxLength={2200}
              onChange={(e) => upd({ caption: e.target.value })}
              style={{ resize: "none" }}
            />
            <div className="text-[11px] text-right -mt-2" style={{ color: "var(--text-muted)" }}>{form.caption.length}/2200</div>
            <div className="flex flex-col gap-2">
              <button type="button" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-surface-2)" }}>
                <FiMapPin size={15} style={{ color: "var(--accent)" }} /><span>Add location</span>
                <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>Coming soon</span>
              </button>
              <button type="button" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-surface-2)" }}>
                <FiHash size={15} style={{ color: "var(--accent)" }} /><span>Add tags</span>
                <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>Coming soon</span>
              </button>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Who can see this</label>
              <VisibilitySelect value={form.visibility} onChange={(v) => upd({ visibility: v })} />
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <SettingRow label="Hide like count" desc="Others won't see how many likes" checked={form.hide_likes} onChange={(v) => upd({ hide_likes: v })} />
              <SettingRow label="Hide comments" desc="Comments will be hidden from view" checked={form.hide_comments} onChange={(v) => upd({ hide_comments: v })} />
              <SettingRow label="Allow comments" desc="Let others comment on this post" checked={form.allow_comments} onChange={(v) => upd({ allow_comments: v })} />
              <SettingRow label="Allow sharing" desc="Let others share this post" checked={form.allow_sharing} onChange={(v) => upd({ allow_sharing: v })} />
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <StepIndicator steps={POST_STEPS} current={step} onStep={go} />
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
          <UploadProgress progress={progress} />
          {error && <div className="text-xs mt-3" style={{ color: "#ef4444" }}>{error}</div>}
        </div>
      </div>
      <footer className="flex items-center gap-3 px-4 py-3 border-t shrink-0" style={{ borderColor: "var(--border-color)" }}>
        {step > 0 && (
          <button type="button" onClick={prev} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
            <FiChevronLeft size={16} /> Back
          </button>
        )}
        <div className="flex-1" />
        {isLast ? (
          <button type="button" disabled={!form.file || submitting} onClick={submit}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: form.file ? "var(--accent)" : "var(--bg-surface-2)", color: form.file ? "#fff" : "var(--text-muted)", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? <FiLoader className="animate-spin" size={16} /> : "Share post"}
          </button>
        ) : (
          <button type="button" onClick={next}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}>
            Next <FiChevronRight size={16} />
          </button>
        )}
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════
   REEL WIZARD (multi-step)
   ══════════════════════════════════════ */
const REEL_STEPS = [
  { key: "media", label: "Media", icon: FiFilm },
  { key: "details", label: "Details", icon: FiEdit3 },
  { key: "settings", label: "Settings", icon: FiSliders },
];

function ReelPanel({ onSubmit, submitting, progress, error }) {
  const inputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState({
    file: null, preview: null,
    caption: "", visibility: "connections",
    hide_likes: false, hide_comments: false,
    allow_comments: true, allow_sharing: true,
  });

  useEffect(() => {
    if (!form.file) return;
    const url = URL.createObjectURL(form.file);
    setForm((f) => ({ ...f, preview: url }));
    return () => URL.revokeObjectURL(url);
  }, [form.file]);

  const pick = (f) => { if (f && f.type.startsWith("video/") && f.size <= MAX_FILE) setForm((prev) => ({ ...prev, file: f })); };
  const go = (i) => { setDir(i > step ? 1 : -1); setStep(i); };
  const next = () => go(Math.min(step + 1, REEL_STEPS.length - 1));
  const prev = () => go(Math.max(step - 1, 0));
  const upd = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => onSubmit({
    file: form.file, caption: form.caption, visibility: form.visibility,
    kind: "reel", hide_likes: form.hide_likes, hide_comments: form.hide_comments,
    allow_comments: form.allow_comments, allow_sharing: form.allow_sharing,
  });

  const isLast = step === REEL_STEPS.length - 1;

  const renderStep = () => {
    switch (REEL_STEPS[step].key) {
      case "media":
        return (
          <div className="flex flex-col gap-4">
            <div
              className="w-full rounded-2xl overflow-hidden relative"
              style={{ aspectRatio: "9/16", maxHeight: 400, background: "#000" }}
            >
              {form.preview && form.file ? (
                <video src={form.preview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/60">
                  <FiFilm size={40} />
                  <span className="text-sm font-medium">Select a video</span>
                  <span className="text-xs">MP4, WebM, Max 50MB</span>
                </button>
              )}
              <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
            </div>
            {form.file && (
              <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium self-center px-3 py-1.5 rounded-lg" style={{ color: "var(--accent)", background: "var(--bg-surface-2)" }}>
                Change video
              </button>
            )}
            <div className="p-3 rounded-lg text-xs" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
              <FiFilm size={14} className="inline mr-1.5" style={{ color: "var(--accent)" }} />
              Trim & edit tools coming soon
            </div>
          </div>
        );
      case "details":
        return (
          <div className="flex flex-col gap-4">
            {form.preview && form.file && (
              <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "var(--bg-surface-2)" }}>
                <div className="w-12 h-12 rounded bg-black flex items-center justify-center"><FiFilm size={18} className="text-white/60" /></div>
                <span className="text-xs truncate flex-1" style={{ color: "var(--text-muted)" }}>{form.file.name}</span>
              </div>
            )}
            <textarea
              className="input text-sm"
              rows={3}
              placeholder="Write a caption..."
              value={form.caption}
              maxLength={2200}
              onChange={(e) => upd({ caption: e.target.value })}
              style={{ resize: "none" }}
            />
            <div className="text-[11px] text-right -mt-2" style={{ color: "var(--text-muted)" }}>{form.caption.length}/2200</div>
            <div className="flex flex-col gap-2">
              <button type="button" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-surface-2)" }}>
                <FiMusic size={15} style={{ color: "var(--accent)" }} /><span>Add music</span>
                <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>Coming soon</span>
              </button>
              <button type="button" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-surface-2)" }}>
                <FiHash size={15} style={{ color: "var(--accent)" }} /><span>Add tags</span>
                <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>Coming soon</span>
              </button>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Who can see this</label>
              <VisibilitySelect value={form.visibility} onChange={(v) => upd({ visibility: v })} />
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <SettingRow label="Hide like count" desc="Others won't see how many likes" checked={form.hide_likes} onChange={(v) => upd({ hide_likes: v })} />
              <SettingRow label="Hide comments" desc="Comments will be hidden from view" checked={form.hide_comments} onChange={(v) => upd({ hide_comments: v })} />
              <SettingRow label="Allow comments" desc="Let others comment on this reel" checked={form.allow_comments} onChange={(v) => upd({ allow_comments: v })} />
              <SettingRow label="Allow sharing" desc="Let others share this reel" checked={form.allow_sharing} onChange={(v) => upd({ allow_sharing: v })} />
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <StepIndicator steps={REEL_STEPS} current={step} onStep={go} />
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
          <UploadProgress progress={progress} />
          {error && <div className="text-xs mt-3" style={{ color: "#ef4444" }}>{error}</div>}
        </div>
      </div>
      <footer className="flex items-center gap-3 px-4 py-3 border-t shrink-0" style={{ borderColor: "var(--border-color)" }}>
        {step > 0 && (
          <button type="button" onClick={prev} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
            <FiChevronLeft size={16} /> Back
          </button>
        )}
        <div className="flex-1" />
        {isLast ? (
          <button type="button" disabled={!form.file || submitting} onClick={submit}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: form.file ? "var(--accent)" : "var(--bg-surface-2)", color: form.file ? "#fff" : "var(--text-muted)", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? <FiLoader className="animate-spin" size={16} /> : "Share reel"}
          </button>
        ) : (
          <button type="button" onClick={next}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--accent)", color: "#fff" }}>
            Next <FiChevronRight size={16} />
          </button>
        )}
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPOSER SHELL
   ══════════════════════════════════════ */
const KIND_TABS = [
  { key: "post", label: "Post", icon: FiImage },
  { key: "story", label: "Story", icon: FiCircle },
  { key: "reel", label: "Reel", icon: FiFilm },
];

export default function Composer() {
  const composer = useUIStore((s) => s.composer);
  const close = useUIStore((s) => s.closeComposer);
  const qc = useQueryClient();

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (composer.open) { setSubmitting(false); setProgress(0); setError(""); }
  }, [composer.open, composer.kind]);

  useEffect(() => {
    if (!composer.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [composer.open]);

  const handleSubmit = useCallback(async ({ file, caption, visibility, kind, hide_likes, hide_comments, allow_comments, allow_sharing }) => {
    if (!file) { setError("Please choose a file."); return; }
    setSubmitting(true);
    setError("");
    try {
      const asset = await mediaService.upload(file, setProgress);
      await feedsService.create({
        kind,
        caption: caption || "",
        media_url: asset.url,
        thumbnail_url: isVideo(asset.mime) ? "" : asset.url,
        visibility: visibility || "connections",
        hide_likes: !!hide_likes,
        hide_comments: !!hide_comments,
        allow_comments: allow_comments !== false,
        allow_sharing: allow_sharing !== false,
      });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["reels"] });
      qc.invalidateQueries({ queryKey: ["stories"] });
      qc.invalidateQueries({ queryKey: ["explore"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      close();
    } catch (e) {
      setError(e?.response?.data?.error?.message || e?.error?.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  }, [close, qc]);

  if (!composer.open) return null;

  const Panel = composer.kind === "story" ? StoryPanel : composer.kind === "reel" ? ReelPanel : PostPanel;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="composer-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end md:items-center md:justify-center"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget && !submitting) close(); }}
      >
        <motion.div
          key="composer-panel"
          initial={{ y: 40, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="w-full md:max-w-lg md:rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "var(--bg-card)",
            height: "calc(100dvh - 40px)",
            maxHeight: "calc(100dvh - 40px)",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <header className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-color)" }}>
            <span className="text-sm font-semibold">{KIND_TABS.find((t) => t.key === composer.kind)?.label}</span>
            <button onClick={close} disabled={submitting} className="p-1.5 rounded-full transition hover:opacity-70" aria-label="Close">
              <FiX size={20} />
            </button>
          </header>
          <div className="flex-1 min-h-0 overflow-hidden" style={{ display: "flex", flexDirection: "column" }}>
            <Panel onSubmit={handleSubmit} submitting={submitting} progress={progress} error={error} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
