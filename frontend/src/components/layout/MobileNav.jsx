import { NavLink } from "react-router-dom";
import { FiHome, FiMessageCircle, FiUserPlus, FiFilm, FiUser } from "react-icons/fi";

const items = [
  { to: "/",         icon: FiHome,          label: "Home",     exact: true },
  { to: "/chats",    icon: FiMessageCircle, label: "Chats" },
  { to: "/requests", icon: FiUserPlus,      label: "Requests" },
  { to: "/reels",    icon: FiFilm,          label: "Reels" },
  { to: "/profile",  icon: FiUser,          label: "Me" },
];

export default function MobileNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around px-1"
      style={{
        height: "var(--mobilebar-height)",
        background: "var(--bg-header)",
        borderTop: "1px solid var(--border-color)",
        backdropFilter: "saturate(160%) blur(10px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.exact}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-[11px] flex-1 py-2 ${isActive ? "" : "opacity-60"}`
            }
            style={{ color: "var(--text-primary)" }}
          >
            <Icon size={20} />
            <span>{it.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
