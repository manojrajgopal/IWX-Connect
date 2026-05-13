import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye, FiEyeOff, FiCheck, FiX, FiCopy, FiRefreshCw, FiShield, FiAlertCircle,
  FiUser, FiMail, FiLock, FiArrowRight, FiStar, FiUserPlus,
} from "react-icons/fi";
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

const STEPS = [
  { label: "Identity", icon: FiUser },
  { label: "Security", icon: FiLock },
  { label: "Confirm", icon: FiCheck },
];

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

  const identityOk = /^[a-z0-9_.]{3,24}$/.test(form.username) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const securityOk = allOk;
  const confirmOk = passwordsMatch;
  const formValid = identityOk && securityOk && confirmOk;

  // Determine current progress step
  const currentStep = !identityOk ? 0 : !securityOk ? 1 : 2;

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
          <FiUserPlus size={20} style={{ color: "var(--text-primary)" }} />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl mb-2">Create your account</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Join a community that values privacy, creativity, and real connections.
        </p>
      </div>

      {/* Progress indicator */}
      <div
        className="rounded-xl p-3.5 flex items-center gap-2"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}
      >
        {STEPS.map((s, i) => {
          const done = (i === 0 && identityOk) || (i === 1 && securityOk) || (i === 2 && confirmOk);
          const active = i === currentStep;
          return (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: done ? "rgba(22,163,74,0.12)" : active ? "var(--bg-card)" : "transparent",
                  border: `1.5px solid ${done ? "#16a34a" : active ? "var(--text-primary)" : "var(--border-color)"}`,
                  color: done ? "#16a34a" : active ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {done ? <FiCheck size={13} /> : <s.icon size={13} />}
              </div>
              <div className="hidden sm:block">
                <div
                  className="text-[11px] font-semibold leading-tight"
                  style={{ color: done ? "#16a34a" : active ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  {s.label}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {done ? "Complete" : active ? "In progress" : "Pending"}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1" style={{ background: done ? "#16a34a" : "var(--border-color)" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Display name */}
      <Field label="Display name" hint="Shown on your profile. You can change this later.">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
            <FiStar size={15} />
          </span>
          <input className="input pl-10" value={form.display_name} onChange={onChange("display_name")} placeholder="e.g. Alex Carter" />
        </div>
      </Field>

      {/* Username */}
      <Field
        label="Username"
        hint="3–24 chars · lowercase letters, numbers, dot or underscore."
        error={fieldErrs.username}
        valid={/^[a-z0-9_.]{3,24}$/.test(form.username)}
        showValid={form.username.length > 0}
      >
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
            <FiUser size={15} />
          </span>
          <input
            className="input pl-10"
            value={form.username}
            onChange={onChange("username")}
            placeholder="alex.carter"
            autoComplete="username"
            spellCheck={false}
          />
          {form.username.length > 0 && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: /^[a-z0-9_.]{3,24}$/.test(form.username) ? "#16a34a" : "#dc2626" }}
            >
              {/^[a-z0-9_.]{3,24}$/.test(form.username) ? <FiCheck size={15} /> : <FiX size={15} />}
            </span>
          )}
        </div>
      </Field>

      {/* Email */}
      <Field label="Email" error={fieldErrs.email}>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
            <FiMail size={15} />
          </span>
          <input
            type="email"
            className="input pl-10"
            value={form.email}
            onChange={onChange("email")}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {form.email.length > 0 && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? "#16a34a" : "#dc2626" }}
            >
              {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? <FiCheck size={15} /> : <FiX size={15} />}
            </span>
          )}
        </div>
      </Field>

      {/* Password */}
      <Field
        label="Password"
        hint={`Minimum ${PASSWORD_MIN_LENGTH} characters with upper, lower, number, and symbol.`}
        error={fieldErrs.password}
      >
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
            <FiLock size={15} />
          </span>
          <input
            type={show ? "text" : "password"}
            className="input pl-10 pr-12"
            value={form.password}
            onChange={onChange("password")}
            onFocus={() => setPwdFocused(true)}
            onBlur={() => setPwdFocused(false)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            spellCheck={false}
          />
          <EyeButton shown={show} onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} />
        </div>

        {/* Strength meter */}
        <div className="mt-2.5">
          <div className="h-1.5 rounded-full overflow-hidden flex gap-1">
            {STRENGTH.map((s, i) => (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-300"
                style={{ background: i <= score && form.password ? s.color : "var(--border-color)" }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span style={{ color: form.password ? strength.color : "var(--text-muted)" }}>
              {form.password ? `Strength: ${strength.label}` : "Strength meter"}
            </span>
            <span
              className="tabular-nums px-1.5 py-0.5 rounded text-[11px]"
              style={{ color: "var(--text-muted)", background: form.password ? "var(--bg-surface)" : "transparent" }}
            >
              {form.password ? `${form.password.length} chars` : ""}
            </span>
          </div>
        </div>

        {/* Rules checklist */}
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
                    className="inline-flex items-center justify-center rounded-full transition-all"
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

        {/* Password generator */}
        <div
          className="mt-3 rounded-xl p-3.5 flex items-center gap-2.5 flex-wrap"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          <FiShield size={16} style={{ color: "var(--accent)" }} />
          <div className="text-xs flex-1 min-w-[140px]" style={{ color: "var(--text-secondary)" }}>
            {sample ? (
              <code className="break-all text-[11px]" style={{ color: "var(--text-primary)" }}>{sample}</code>
            ) : (
              <span>Need ideas? Generate a strong sample password.</span>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button" onClick={generate}
              className="text-[11px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ border: "1px solid var(--border-color)", background: "var(--bg-surface)" }}
            >
              <FiRefreshCw size={11} /> {sample ? "New" : "Generate"}
            </button>
            {sample && (
              <>
                <button
                  type="button" onClick={copySample}
                  className="text-[11px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ border: "1px solid var(--border-color)", background: "var(--bg-surface)" }}
                >
                  <FiCopy size={11} /> {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button" onClick={useSample}
                  className="text-[11px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-colors hover:opacity-90"
                  style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}
                >
                  Use this
                </button>
              </>
            )}
          </div>
        </div>
      </Field>

      {/* Confirm password */}
      <Field label="Confirm password" error={fieldErrs.confirm_password}>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }}>
            <FiLock size={15} />
          </span>
          <input
            type={showConfirm ? "text" : "password"}
            className="input pl-10 pr-12"
            value={form.confirm_password}
            onChange={onChange("confirm_password")}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            spellCheck={false}
          />
          <EyeButton shown={showConfirm} onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"} />
        </div>
        {form.confirm_password && (
          <div className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: passwordsMatch ? "#16a34a" : "#dc2626" }}>
            {passwordsMatch ? <FiCheck size={12} /> : <FiX size={12} />}
            {passwordsMatch ? "Passwords match" : "Passwords don't match yet"}
          </div>
        )}
      </Field>

      {/* Terms notice */}
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        By creating an account, you agree to our{" "}
        <a href="#" className="underline">Terms of Service</a> and{" "}
        <a href="#" className="underline">Privacy Policy</a>.
        We'll never share your data without consent.
      </p>

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
        disabled={loading || !formValid}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 019.75 7.75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Creating account…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Create account
            <FiArrowRight size={16} />
          </span>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Already a member?
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
      </div>

      {/* Sign in CTA */}
      <Link
        to="/auth/login"
        className="btn h-11 text-sm font-semibold justify-center w-full transition-all hover:shadow-sm"
      >
        Sign in instead
      </Link>
    </motion.form>
  );
}

function Field({ label, hint, error, valid, showValid, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="label mb-0">{label}</label>
        {showValid && !error && (
          <span className="text-[11px] font-medium" style={{ color: valid ? "#16a34a" : "var(--text-muted)" }}>
            {valid ? "Valid" : ""}
          </span>
        )}
      </div>
      {children}
      {hint && !error && <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{hint}</span>}
      {error && <span className="text-xs" style={{ color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

function EyeButton({ shown, onClick, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
      style={{ color: "var(--text-muted)" }}
      tabIndex={-1}
      {...props}
    >
      {shown ? <FiEyeOff size={16} /> : <FiEye size={16} />}
    </button>
  );
}
