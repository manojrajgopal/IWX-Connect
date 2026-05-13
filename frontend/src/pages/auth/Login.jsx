import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiAlertCircle, FiLock, FiUser, FiArrowRight, FiShield, FiZap, FiHeart } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../../services";
import { useAuthStore } from "../../stores/authStore";

const trustedBy = [
  { icon: FiShield, text: "Encrypted sessions" },
  { icon: FiZap, text: "Instant access" },
  { icon: FiHeart, text: "No ads, ever" },
];

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const setAccess = useAuthStore((s) => s.setAccess);
  const setUser = useAuthStore((s) => s.setUser);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      const data = await authService.login(form);
      setAccess(data.access);
      setUser(data.user);
      nav("/");
    } catch (e) {
      setErr(e?.response?.data?.error?.message || "Login failed");
    } finally { setLoading(false); }
  };

  const canSubmit = form.username.trim().length > 0 && form.password.length > 0;

  return (
    <motion.form
      onSubmit={submit}
      className="flex flex-col gap-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="mb-1">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}
        >
          <FiLock size={20} style={{ color: "var(--text-primary)" }} />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl mb-2">Welcome back</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Sign in to your account to continue where you left off.
        </p>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Username</label>
        <div className="relative">
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          >
            <FiUser size={15} />
          </span>
          <input
            className="input pl-10"
            autoFocus
            autoComplete="username"
            placeholder="Enter your username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="label mb-0">Password</label>
          <button
            type="button"
            className="text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--text-muted)" }}
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          >
            <FiLock size={15} />
          </span>
          <input
            type={show ? "text" : "password"}
            className="input pl-10 pr-12"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
            style={{ color: "var(--text-muted)" }}
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
      </div>

      {/* Remember me */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none group">
        <span
          className="w-4 h-4 rounded flex items-center justify-center transition-all shrink-0"
          style={{
            background: remember ? "var(--accent)" : "transparent",
            border: `1.5px solid ${remember ? "var(--accent)" : "var(--border-color)"}`,
          }}
        >
          {remember && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4.2 7.5L8 2.5" stroke="var(--accent-inverse)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span
          className="text-sm transition-colors group-hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => setRemember((v) => !v)}
        >
          Keep me signed in for 30 days
        </span>
      </label>

      {/* Error */}
      <AnimatePresence>
        {err && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-sm flex items-start gap-2.5 p-3 rounded-lg overflow-hidden"
            style={{ color: "#dc2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}
          >
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{err}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <button
        className="btn-primary h-11 text-sm font-semibold gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={loading || !canSubmit}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 019.75 7.75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Signing in…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Sign in
            <FiArrowRight size={16} />
          </span>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          New to IWX?
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
      </div>

      {/* Create account CTA */}
      <Link
        to="/auth/signup"
        className="btn h-11 text-sm font-semibold justify-center w-full transition-all hover:shadow-sm"
      >
        Create an account
      </Link>

      {/* Trust badges */}
      <div
        className="mt-2 rounded-xl p-4 flex flex-col gap-3"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "rgba(22,163,74,0.12)" }}
          >
            <FiShield size={11} style={{ color: "#16a34a" }} />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Your connection is secure
          </span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {trustedBy.map((t) => (
            <div key={t.text} className="flex items-center gap-1.5">
              <t.icon size={12} style={{ color: "var(--text-muted)" }} />
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.form>
  );
}
