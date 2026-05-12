import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services";
import { useAuthStore } from "../../stores/authStore";

export default function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "", display_name: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const setAccess = useAuthStore((s) => s.setAccess);
  const setUser = useAuthStore((s) => s.setUser);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      const data = await authService.signup(form);
      setAccess(data.access);
      setUser(data.user);
      nav("/");
    } catch (e) {
      setErr(e?.response?.data?.error?.message || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-3xl mb-1">Create your account</h2>
        <p style={{ color: "var(--text-secondary)" }}>Pick a username — others will use it to find you.</p>
      </div>
      <label className="label">Display name</label>
      <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
      <label className="label">Username</label>
      <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} />
      <label className="label">Email</label>
      <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label className="label">Password</label>
      <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {err && <div className="text-sm" style={{ color: "#dc2626" }}>{err}</div>}
      <button className="btn-primary" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account? <Link to="/auth/login" className="underline">Sign in</Link>
      </div>
    </form>
  );
}
