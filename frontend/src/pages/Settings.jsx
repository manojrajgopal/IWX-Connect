import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSun, FiMoon, FiMonitor, FiUser, FiLogOut, FiBell, FiShield, FiEye, FiLock,
  FiGlobe, FiVolume2, FiVolumeX, FiChevronRight, FiSmartphone, FiDownload, FiTrash2, FiInfo,
  FiX, FiLoader,
} from "react-icons/fi";
import { useTheme } from "../hooks/useTheme.jsx";
import { authService, securityService, notificationsService } from "../services";
import { useAuthStore } from "../stores/authStore";
import { useAlertStore } from "../stores/alertStore";
import Avatar from "../components/ui/Avatar.jsx";

/* ── Toggle Switch ── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        width: 44, height: 24,
        background: checked ? "var(--accent)" : "var(--bg-surface-2)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="inline-block rounded-full shadow-sm transition-transform duration-200"
        style={{
          width: 18, height: 18,
          background: "#fff",
          transform: checked ? "translateX(22px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}

/* ── Section wrapper ── */
function Section({ icon: Icon, title, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-2">
        {Icon && <Icon size={16} style={{ color: "var(--accent)" }} />}
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{title}</h3>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
        {children}
      </div>
    </motion.section>
  );
}

/* ── Row item ── */
function Row({ label, description, right, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      className={`flex items-center gap-3 px-5 py-3.5 w-full text-left ${onClick ? "hover:opacity-80 transition-opacity cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</div>}
      </div>
      {right}
      {onClick && !right && <FiChevronRight size={16} style={{ color: "var(--text-muted)" }} />}
    </Wrapper>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const showConfirm = useAlertStore((s) => s.showConfirm);
  const showAlert = useAlertStore((s) => s.showAlert);
  const nav = useNavigate();
  const [prefs, setPrefs] = useState(null);
  const [pwModal, setPwModal] = useState(false);
  const [sessionsModal, setSessionsModal] = useState(false);

  useEffect(() => { authService.preferences().then(setPrefs); }, []);

  const update = (patch) => {
    const prev = prefs;
    setPrefs({ ...prefs, ...patch });
    authService.preferences({ ...prefs, ...patch }).catch(() => {
      setPrefs(prev);
      useAlertStore.getState().showAlert("Failed to save preference.", { title: "Error", variant: "danger" });
    });
  };

  const enablePush = async () => {
    const showAlert = useAlertStore.getState().showAlert;
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      return showAlert("Push notifications are not supported in this browser.", { title: "Not supported", variant: "warning" });
    const reg = await navigator.serviceWorker.ready;
    const { public_key } = await notificationsService.vapidKey();
    if (!public_key)
      return showAlert("Push notifications are not configured on the server yet.", { title: "Not available", variant: "warning" });
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(public_key),
    });
    await notificationsService.subscribe(sub.toJSON());
    showAlert("Push notifications enabled successfully!", { title: "Enabled", variant: "info" });
  };

  const onLogout = async () => {
    const ok = await showConfirm("You will be signed out of your account.", { title: "Sign out?", confirmText: "Sign out", variant: "danger" });
    if (!ok) return;
    try { await authService.logout(); } catch {}
    clear();
    nav("/auth/login");
  };

  const themeOptions = [
    { value: "light", icon: FiSun, label: "Light" },
    { value: "dark",  icon: FiMoon, label: "Dark" },
  ];

  return (
    <div className="container-x py-6 md:py-8 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="font-serif text-2xl md:text-3xl mb-1">Settings</h1>

      {/* ── Account / Profile ── */}
      <Section icon={FiUser} title="Account">
        <Row
          label={user?.display_name || user?.username || "Profile"}
          description={user ? `@${user.username}` : undefined}
          right={<Avatar user={user} size={36} />}
          onClick={() => nav("/profile")}
        />
      </Section>

      {/* ── Appearance ── */}
      <Section icon={FiMonitor} title="Appearance">
        <div className="px-5 py-4">
          <div className="text-sm font-medium mb-3">Theme</div>
          <div className="flex gap-2">
            {themeOptions.map((t) => {
              const Icon = t.icon;
              const active = t.value === theme;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: active ? "var(--accent)" : "var(--bg-surface-2)",
                    color: active ? "var(--accent-inverse, #fff)" : "var(--text-primary)",
                    border: active ? "none" : "1px solid var(--border-color)",
                  }}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Notifications ── */}
      {prefs && (
        <Section icon={FiBell} title="Notifications">
          <Row
            label="In-app notifications"
            description="Show notifications inside the app"
            right={<Toggle checked={!!prefs.notifications_in_app} onChange={(v) => update({ notifications_in_app: v })} />}
          />
          <Row
            label="Push notifications"
            description="Receive browser push alerts"
            right={<Toggle checked={!!prefs.notifications_push} onChange={(v) => update({ notifications_push: v })} />}
          />
          <Row
            label="Email notifications"
            description="Get notified via email"
            right={<Toggle checked={!!prefs.notifications_email} onChange={(v) => update({ notifications_email: v })} />}
          />
          <Row
            label="Notification sounds"
            description="Play a sound for new notifications"
            right={<Toggle checked={!!prefs.notification_sounds} onChange={(v) => update({ notification_sounds: v })} />}
          />
          <div className="px-5 py-3">
            <button className="btn text-xs" onClick={enablePush}>
              <FiSmartphone size={14} className="inline mr-1.5" />
              Enable browser notifications
            </button>
          </div>
        </Section>
      )}

      {/* ── Privacy ── */}
      {prefs && (
        <Section icon={FiShield} title="Privacy">
          <Row
            label="Online status"
            description="Let others see when you're online"
            right={<Toggle checked={!!prefs.show_presence} onChange={(v) => update({ show_presence: v })} />}
          />
          <Row
            label="Read receipts"
            description="Let others know you've read their messages"
            right={<Toggle checked={!!prefs.read_receipts} onChange={(v) => update({ read_receipts: v })} />}
          />
          <Row
            label="Profile visibility"
            description="Allow non-connections to view your profile"
            right={<Toggle checked={!!prefs.public_profile} onChange={(v) => update({ public_profile: v })} />}
          />
          <Row
            label="Activity status"
            description="Show your activity to connections"
            right={<Toggle checked={!!prefs.show_activity} onChange={(v) => update({ show_activity: v })} />}
          />
        </Section>
      )}

      {/* ── Chat ── */}
      {prefs && (
        <Section icon={FiVolume2} title="Chat">
          <Row
            label="Message sounds"
            description="Play sound when receiving messages"
            right={<Toggle checked={!!prefs.message_sounds} onChange={(v) => update({ message_sounds: v })} />}
          />
          <Row
            label="Media auto-download"
            description="Automatically download images and videos"
            right={<Toggle checked={!!prefs.auto_download_media} onChange={(v) => update({ auto_download_media: v })} />}
          />
          <Row
            label="Link previews"
            description="Show previews for shared links"
            right={<Toggle checked={!!prefs.link_previews} onChange={(v) => update({ link_previews: v })} />}
          />
        </Section>
      )}

      {/* ── Content ── */}
      {prefs && (
        <Section icon={FiEye} title="Content">
          <Row
            label="Autoplay videos"
            description="Automatically play videos in feed"
            right={<Toggle checked={!!prefs.autoplay_videos} onChange={(v) => update({ autoplay_videos: v })} />}
          />
          <Row
            label="Data saver"
            description="Reduce image quality to save bandwidth"
            right={<Toggle checked={!!prefs.data_saver} onChange={(v) => update({ data_saver: v })} />}
          />
        </Section>
      )}

      {/* ── Security ── */}
      <Section icon={FiLock} title="Security">
        <Row label="Change password" onClick={() => setPwModal(true)} />
        <Row label="Active sessions" description="Manage your logged-in devices" onClick={() => setSessionsModal(true)} />
        <Row label="Two-factor authentication" description="Coming soon" />
      </Section>

      {/* ── About ── */}
      <Section icon={FiInfo} title="About">
        <Row label="Version" right={<span className="text-xs" style={{ color: "var(--text-muted)" }}>1.0.0</span>} />
        <Row label="Terms of Service" onClick={() => showAlert("Terms of Service will be available soon.", { title: "Terms of Service", variant: "info" })} />
        <Row label="Privacy Policy" onClick={() => showAlert("Privacy Policy will be available soon.", { title: "Privacy Policy", variant: "info" })} />
      </Section>

      {/* ── Sign out (visible on all screens, but especially needed on mobile) ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onLogout}
        className="card flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-medium transition-opacity hover:opacity-80"
        style={{ color: "#ef4444" }}
      >
        <FiLogOut size={16} />
        Sign out
      </motion.button>

      <div className="text-center text-[11px] pb-4" style={{ color: "var(--text-muted)" }}>
        IWX Connect &middot; {new Date().getFullYear()}
      </div>

      {/* ── Password Change Modal ── */}
      <AnimatePresence>
        {pwModal && <PasswordModal onClose={() => setPwModal(false)} />}
      </AnimatePresence>

      {/* ── Sessions Modal ── */}
      <AnimatePresence>
        {sessionsModal && <SessionsModal onClose={() => setSessionsModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Overlay shell ── */
function ModalOverlay({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .95, opacity: 0 }}
        className="card w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── Password Change Modal ── */
function PasswordModal({ onClose }) {
  const showAlert = useAlertStore.getState().showAlert;
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) return setError("Passwords do not match");
    if (form.new_password.length < 8) return setError("Password must be at least 8 characters");
    setBusy(true);
    setError("");
    try {
      await authService.changePassword(form);
      showAlert("Password changed successfully!", { title: "Done", variant: "info" });
      onClose();
    } catch (err) {
      setError(err?.error?.message || "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    background: "var(--bg-surface-2)", border: "1px solid var(--border-color)",
    color: "var(--text-primary)", fontSize: 14,
  };

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={submit} className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Change password</h3>
          <button type="button" onClick={onClose}><FiX size={20} /></button>
        </div>
        {error && <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,.12)", color: "#ef4444" }}>{error}</div>}
        <input style={inputStyle} type="password" placeholder="Current password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} required />
        <input style={inputStyle} type="password" placeholder="New password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} required />
        <input style={inputStyle} type="password" placeholder="Confirm new password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required />
        <button type="submit" disabled={busy} className="btn w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff", opacity: busy ? 0.6 : 1 }}>
          {busy ? <FiLoader className="animate-spin mx-auto" size={18} /> : "Update password"}
        </button>
      </form>
    </ModalOverlay>
  );
}

/* ── Active Sessions Modal ── */
function SessionsModal({ onClose }) {
  const showConfirm = useAlertStore.getState().showConfirm;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    securityService.sessions().then(setSessions).finally(() => setLoading(false));
  }, []);

  const revoke = async (id) => {
    const ok = await showConfirm("This will sign out that session.", { title: "Revoke session?", confirmText: "Revoke", variant: "danger" });
    if (!ok) return;
    await securityService.revokeSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const parseUA = (ua) => {
    if (!ua) return "Unknown device";
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] || "Browser";
    const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[1] || "Unknown OS";
    return `${browser} on ${os}`;
  };

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active sessions</h3>
          <button onClick={onClose}><FiX size={20} /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><FiLoader className="animate-spin" size={24} style={{ color: "var(--text-muted)" }} /></div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>No active sessions</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-surface-2)" }}>
                <FiSmartphone size={20} style={{ color: "var(--text-muted)" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{parseUA(s.device?.user_agent)}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Last active {timeAgo(s.last_used_at)}</div>
                </div>
                <button onClick={() => revoke(s.id)} className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ background: "rgba(239,68,68,.12)", color: "#ef4444" }}>
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

function urlB64ToUint8Array(b64) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
