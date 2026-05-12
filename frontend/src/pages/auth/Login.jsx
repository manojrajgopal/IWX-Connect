import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";
import { authService } from "../../services";
import { useAuthStore } from "../../stores/authStore";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-3xl mb-1">Welcome back</h2>
        <p style={{ color: "var(--text-secondary)" }}>Sign in to continue.</p>
      </div>
      <label className="label">Username</label>
      <input className="input" autoFocus autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <label className="label">Password</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className="input pr-12"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md"
          style={{ color: "var(--text-muted)" }}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
      {err && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm flex items-start gap-2 p-2 rounded-md"
          style={{ color: "#dc2626", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{err}</span>
        </motion.div>
      )}
      <button className="btn-primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        New here? <Link to="/auth/signup" className="underline">Create an account</Link>
      </div>
    </form>
  );
}
