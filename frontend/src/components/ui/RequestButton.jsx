import { useState } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiUserPlus, FiLoader } from "react-icons/fi";
import { connectionsService } from "../../services";

/**
 * Connect / Requested button with optimistic, persistent state.
 * Props:
 *  - username: target username
 *  - initialState?: "idle" | "requested" | "connected"
 *  - onSent?: (username) => void
 *  - className?: string
 */
export default function RequestButton({ username, initialState = "idle", onSent, className = "" }) {
  const [state, setState] = useState(initialState); // idle | loading | requested | connected | error
  const [err, setErr] = useState("");

  const handle = async (e) => {
    e?.preventDefault?.();
    if (state === "loading" || state === "requested" || state === "connected") return;
    setState("loading"); setErr("");
    try {
      await connectionsService.send(username);
      setState("requested");
      onSent?.(username);
    } catch (ex) {
      const code = ex?.response?.data?.error?.code;
      if (code === "pending") { setState("requested"); onSent?.(username); return; }
      if (code === "already_connected") { setState("connected"); return; }
      setErr(ex?.response?.data?.error?.message || "Couldn't send");
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  const disabled = state === "loading" || state === "requested" || state === "connected";

  let label = "Connect";
  let Icon = FiUserPlus;
  let bg = "var(--accent)";
  let fg = "var(--accent-inverse, white)";
  if (state === "loading")   { label = "Sending…";   Icon = FiLoader; }
  if (state === "requested") { label = "Requested";  Icon = FiCheck; bg = "transparent"; fg = "var(--text-secondary)"; }
  if (state === "connected") { label = "Connected";  Icon = FiCheck; bg = "transparent"; fg = "var(--text-secondary)"; }
  if (state === "error")     { label = err || "Retry"; Icon = FiUserPlus; bg = "#dc2626"; fg = "white"; }

  return (
    <motion.button
      type="button"
      onClick={handle}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${className}`}
      style={{
        background: bg,
        color: fg,
        border: state === "requested" || state === "connected" ? "1px solid var(--border-color, var(--border))" : "1px solid transparent",
        cursor: disabled ? "default" : "pointer",
        opacity: state === "loading" ? 0.85 : 1,
      }}
      aria-busy={state === "loading"}
    >
      <Icon size={14} className={state === "loading" ? "animate-spin" : ""} />
      <span>{label}</span>
    </motion.button>
  );
}
