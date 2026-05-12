import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiMoon, FiSun, FiLogOut } from "react-icons/fi";
import { useTheme } from "../../hooks/useTheme.jsx";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { authService } from "../../services";
import Avatar from "../ui/Avatar.jsx";

export default function Topbar() {
  const { theme, toggle } = useTheme();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const unread = useNotificationStore((s) => s.unread);
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
        <button className="btn-ghost relative" onClick={toggle} title="Theme">
          {theme === "dark" ? <FiSun /> : <FiMoon />}
        </button>
        <NavLink to="/notifications" className="btn-ghost relative" title="Notifications">
          <FiBell />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 text-[10px] px-1.5 py-[1px] rounded-full"
                  style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}>
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </NavLink>
        {user && <Avatar user={user} size={32} />}
        <button className="btn-ghost" onClick={onLogout} title="Sign out"><FiLogOut /></button>
      </div>
    </header>
  );
}
