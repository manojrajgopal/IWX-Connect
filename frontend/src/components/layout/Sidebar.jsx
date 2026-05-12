import { NavLink } from "react-router-dom";
import { FiHome, FiMessageCircle, FiUserPlus, FiCompass, FiFilm, FiUser, FiSettings } from "react-icons/fi";

const items = [
  { to: "/",          label: "Home",        icon: FiHome,         exact: true },
  { to: "/chats",     label: "Chats",       icon: FiMessageCircle },
  { to: "/requests",  label: "Requests",    icon: FiUserPlus },
  { to: "/discover",  label: "Discover",    icon: FiCompass },
  { to: "/reels",     label: "Reels",       icon: FiFilm },
  { to: "/profile",   label: "Profile",     icon: FiUser },
  { to: "/settings",  label: "Settings",    icon: FiSettings },
];

export default function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col shrink-0 sticky"
      style={{
        top: "var(--header-height)",
        height: "calc(100vh - var(--header-height))",
        width: "var(--sidebar-width)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-color)",
        overflowY: "auto",
      }}
    >
      <div className="p-4">
        <div className="eyebrow px-3 mb-2">Navigate</div>
        <nav className="flex flex-col gap-0.5">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.exact}
                className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                <Icon className="opacity-80" />
                <span>{it.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
        IWX Connect · {new Date().getFullYear()}
      </div>
    </aside>
  );
}
