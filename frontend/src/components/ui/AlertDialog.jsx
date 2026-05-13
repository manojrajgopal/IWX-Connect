import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";
import { useAlertStore } from "../../stores/alertStore";

const iconMap = {
  danger:  FiAlertTriangle,
  warning: FiAlertCircle,
  info:    FiInfo,
};

const colorMap = {
  danger:  { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", icon: "#ef4444", btn: "#ef4444" },
  warning: { bg: "rgba(234,179,8,0.10)",  border: "rgba(234,179,8,0.25)",  icon: "#eab308", btn: "#eab308" },
  info:    { bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.25)", icon: "#3b82f6", btn: "var(--accent)" },
};

export default function AlertDialog() {
  const dialog = useAlertStore((s) => s.dialog);
  const dismiss = useAlertStore((s) => s.dismiss);

  // Close on Escape
  useEffect(() => {
    if (!dialog) return;
    const handler = (e) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dialog, dismiss]);

  return createPortal(
    <AnimatePresence>
      {dialog && (
        <motion.div
          key="alert-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full max-w-sm rounded-xl shadow-xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <DialogContent dialog={dialog} dismiss={dismiss} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function DialogContent({ dialog, dismiss }) {
  const variant = dialog.variant || "info";
  const colors = colorMap[variant] || colorMap.info;
  const Icon = iconMap[variant] || FiInfo;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 pb-2">
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <Icon size={18} style={{ color: colors.icon }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
            {dialog.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {dialog.message}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 p-1 rounded-md transition-colors"
          style={{ color: "var(--text-muted)" }}
          aria-label="Close"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Actions */}
      <div
        className="flex items-center justify-end gap-2 px-5 py-4 mt-1"
        style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-surface)" }}
      >
        {dialog.type === "confirm" && (
          <button
            onClick={() => dialog.resolve(false)}
            className="btn text-sm px-4 py-2"
          >
            {dialog.cancelText || "Cancel"}
          </button>
        )}
        <button
          onClick={() => dialog.resolve(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition"
          style={{
            background: variant === "danger" ? colors.btn : "var(--accent)",
            color: variant === "danger" ? "#fff" : "var(--accent-inverse)",
            border: "none",
          }}
          autoFocus
        >
          {dialog.type === "confirm" ? (dialog.confirmText || "Confirm") : "OK"}
        </button>
      </div>
    </div>
  );
}
