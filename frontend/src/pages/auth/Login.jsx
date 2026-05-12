import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services";
import { useAuthStore } from "../../stores/authStore";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
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
      <input className="input" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <label className="label">Password</label>
      <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {err && <div className="text-sm" style={{ color: "#dc2626" }}>{err}</div>}
      <button className="btn-primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        New here? <Link to="/auth/signup" className="underline">Create an account</Link>
      </div>
    </form>
  );
}
