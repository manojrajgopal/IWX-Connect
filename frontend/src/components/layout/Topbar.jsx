import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiMoon, FiSun, FiLogOut, FiPlus, FiImage, FiFilm, FiCircle, FiSettings } from "react-icons/fi";
import { useTheme } from "../../hooks/useTheme.jsx";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { useUIStore } from "../../stores/uiStore";
import { authService } from "../../services";
import Avatar from "../ui/Avatar.jsx";

const CREATE_OPTIONS = [
  { kind: "post",  label: "Post",  desc: "Share a photo or video", icon: FiImage },
  { kind: "story", label: "Story", desc: "Disappears in 24 hours", icon: FiCircle },
  { kind: "reel",  label: "Reel",  desc: "Short looping video",    icon: FiFilm },
];

function CreatePicker({ onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button className="btn-ghost relative" onClick={() => setOpen((o) => !o)} title="Create" aria-label="Create">
        <FiPlus size={20} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden shadow-lg z-50"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
        >
          {CREATE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.kind}
                onClick={() => { setOpen(false); onPick(opt.kind); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm transition hover:opacity-80"
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--bg-surface-2)" }}>
                  <Icon size={16} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  const { theme, toggle } = useTheme();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const unread = useNotificationStore((s) => s.unread);
  const openComposer = useUIStore((s) => s.openComposer);
  const nav = useNavigate();

  const onLogout = async () => {
    try { await authService.logout(); } catch {}
    clear();
    nav("/auth/login");
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6"
      style={{
        height: "var(--header-height)",
        background: "var(--bg-header)",
        borderBottom: "1px solid var(--border-color)",
        backdropFilter: "saturate(150%) blur(8px)",
      }}
    >
      <Link to="/" className="flex items-baseline gap-2">
        <span className="font-serif text-2xl md:text-3xl font-extrabold tracking-tight">IWX</span>
        <span className="font-serif text-base md:text-lg" style={{ color: "var(--text-secondary)" }}>Connect</span>
      </Link>

      <div className="hidden sm:flex items-center gap-2 max-w-md flex-1 mx-6">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            className="input pl-9"
            placeholder="Search people, chats, posts"
            onKeyDown={(e) => { if (e.key === "Enter") nav(`/discover?q=${encodeURIComponent(e.currentTarget.value)}`); }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CreatePicker onPick={openComposer} />
        {/* Theme, Profile, Logout: desktop only */}
        <button className="btn-ghost relative hidden md:flex" onClick={toggle} title="Theme">
          {theme === "dark" ? <FiSun /> : <FiMoon />}
        </button>
        <NavLink to="/settings" className="btn-ghost relative md:hidden" title="Settings">
          <FiSettings />
        </NavLink>
        <NavLink to="/notifications" className="btn-ghost relative" title="Notifications">
          <FiBell />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 text-[10px] px-1.5 py-[1px] rounded-full"
                  style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}>
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </NavLink>
        {user && <Link to="/profile" className="hidden md:block" aria-label="Profile"><Avatar user={user} size={32} /></Link>}
        <button className="btn-ghost hidden md:flex" onClick={onLogout} title="Sign out"><FiLogOut /></button>
      </div>
    </header>
  );
}
