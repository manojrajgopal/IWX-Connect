import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiEye, FiEyeOff, FiCheck, FiX, FiCopy, FiRefreshCw, FiShield, FiAlertCircle } from "react-icons/fi";
import { authService } from "../../services";
import { useAuthStore } from "../../stores/authStore";
import {
  passwordRules,
  passwordScore,
  sampleStrongPassword,
  STRENGTH,
  PASSWORD_MIN_LENGTH,
} from "../../utils/password";

const initial = { username: "", email: "", password: "", confirm_password: "", display_name: "" };

export default function Signup() {
  const [form, setForm] = useState(initial);
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  const [err, setErr] = useState("");
  const [fieldErrs, setFieldErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [sample, setSample] = useState("");
  const [copied, setCopied] = useState(false);

  const setAccess = useAuthStore((s) => s.setAccess);
  const setUser = useAuthStore((s) => s.setUser);
  const nav = useNavigate();

  const onChange = (k) => (e) => {
    const value = k === "username" ? e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "") : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    setFieldErrs((fe) => ({ ...fe, [k]: undefined }));
  };

  const rules = useMemo(
    () => passwordRules(form.password, { username: form.username, email: form.email }),
    [form.password, form.username, form.email]
  );
  const score = passwordScore(rules);
  const allOk = rules.every((r) => r.ok);
  const passwordsMatch = form.password.length > 0 && form.password === form.confirm_password;
  const formValid =
    /^[a-z0-9_.]{3,24}$/.test(form.username) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    allOk &&
    passwordsMatch;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setFieldErrs({});
    if (!formValid) {
      setErr("Please complete all requirements before continuing.");
      return;
    }
    setLoading(true);
    try {
      const data = await authService.signup({
        username: form.username,
        email: form.email,
        password: form.password,
        confirm_password: form.confirm_password,
        display_name: form.display_name,
      });
      setAccess(data.access);
      setUser(data.user);
      nav("/");
    } catch (ex) {
      const payload = ex?.response?.data?.error;
      setErr(payload?.message || "Signup failed");
      const details = payload?.details;
      if (details && typeof details === "object" && !Array.isArray(details)) {
        const next = {};
        for (const [k, v] of Object.entries(details)) {
          next[k] = Array.isArray(v) ? v.join(" ") : String(v);
        }
        setFieldErrs(next);
      }
    } finally { setLoading(false); }
  };

  const generate = () => { setSample(sampleStrongPassword()); setCopied(false); };
  const useSample = () => {
    if (!sample) return;
    setForm((f) => ({ ...f, password: sample, confirm_password: sample }));
    setShow(true); setShowConfirm(true);
  };
  const copySample = async () => {
    if (!sample) return;
    try { await navigator.clipboard.writeText(sample); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const strength = STRENGTH[score];

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-3xl mb-1">Create your account</h2>
        <p style={{ color: "var(--text-secondary)" }}>Pick a username — others will use it to find you.</p>
      </div>

      <Field label="Display name" hint="Shown on your profile. You can change this later.">
        <input className="input" value={form.display_name} onChange={onChange("display_name")} placeholder="e.g. Alex Carter" />
      </Field>

      <Field
        label="Username"
        hint="3–24 chars · lowercase letters, numbers, dot or underscore."
        error={fieldErrs.username}
      >
        <input
          className="input"
          value={form.username}
          onChange={onChange("username")}
          placeholder="alex.carter"
          autoComplete="username"
          spellCheck={false}
        />
      </Field>

      <Field label="Email" error={fieldErrs.email}>
        <input
          type="email"
          className="input"
          value={form.email}
          onChange={onChange("email")}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </Field>

      <Field
        label="Password"
        hint={`Minimum ${PASSWORD_MIN_LENGTH} characters with upper, lower, number, and symbol.`}
        error={fieldErrs.password}
      >
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            className="input pr-12"
            value={form.password}
            onChange={onChange("password")}
            onFocus={() => setPwdFocused(true)}
            onBlur={() => setPwdFocused(false)}
            placeholder="••••••••••••"
            autoComplete="new-password"
            spellCheck={false}
          />
          <EyeButton shown={show} onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} />
        </div>

        <div className="mt-2">
          <div className="h-1.5 rounded-full overflow-hidden flex gap-1">
            {STRENGTH.map((s, i) => (
              <div key={i} className="flex-1 rounded-full" style={{ background: i <= score && form.password ? s.color : "var(--border)" }} />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span style={{ color: form.password ? strength.color : "var(--text-muted)" }}>
              {form.password ? `Strength: ${strength.label}` : "Strength meter"}
            </span>
            <span style={{ color: "var(--text-muted)" }}>{form.password.length} chars</span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {(pwdFocused || (form.password && !allOk)) && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs overflow-hidden"
            >
              {rules.map((r) => (
                <li key={r.id} className="flex items-center gap-2" style={{ color: r.ok ? "var(--text-primary)" : "var(--text-muted)" }}>
                  <span
                    className="inline-flex items-center justify-center rounded-full"
                    style={{
                      width: 16, height: 16,
                      background: r.ok ? "rgba(22,163,74,0.15)" : "var(--bg-card)",
                      color: r.ok ? "#16a34a" : "var(--text-muted)",
                      border: `1px solid ${r.ok ? "#16a34a" : "var(--border)"}`,
                    }}
                  >
                    {r.ok ? <FiCheck size={10} /> : <FiX size={10} />}
                  </span>
                  <span>{r.label}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <div className="mt-3 rounded-lg p-3 flex items-center gap-2 flex-wrap" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <FiShield style={{ color: "var(--accent)" }} />
          <div className="text-xs flex-1 min-w-[160px]" style={{ color: "var(--text-secondary)" }}>
            {sample ? (
              <code style={{ color: "var(--text-primary)" }}>{sample}</code>
            ) : (
              <span>Need ideas? Generate a strong sample password.</span>
            )}
          </div>
          <button type="button" onClick={generate} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md" style={{ border: "1px solid var(--border)" }}>
            <FiRefreshCw size={12} /> {sample ? "New" : "Generate"}
          </button>
          {sample && (
            <>
              <button type="button" onClick={copySample} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md" style={{ border: "1px solid var(--border)" }}>
                <FiCopy size={12} /> {copied ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={useSample} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: "var(--accent)", color: "white" }}>
                Use this
              </button>
            </>
          )}
        </div>
      </Field>

      <Field label="Confirm password" error={fieldErrs.confirm_password}>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            className="input pr-12"
            value={form.confirm_password}
            onChange={onChange("confirm_password")}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            spellCheck={false}
          />
          <EyeButton shown={showConfirm} onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"} />
        </div>
        {form.confirm_password && (
          <div className="mt-1 text-xs flex items-center gap-1.5" style={{ color: passwordsMatch ? "#16a34a" : "#dc2626" }}>
            {passwordsMatch ? <FiCheck size={12} /> : <FiX size={12} />}
            {passwordsMatch ? "Passwords match" : "Passwords don't match yet"}
          </div>
        )}
      </Field>

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

      <button className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || !formValid}>
        {loading ? "Creating…" : "Create account"}
      </button>

      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account? <Link to="/auth/login" className="underline">Sign in</Link>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="label">{label}</label>
      {children}
      {hint && !error && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</span>}
      {error && <span className="text-xs" style={{ color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

function EyeButton({ shown, onClick, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md"
      style={{ color: "var(--text-muted)" }}
      tabIndex={-1}
      {...props}
    >
      {shown ? <FiEyeOff size={16} /> : <FiEye size={16} />}
    </button>
  );
}
