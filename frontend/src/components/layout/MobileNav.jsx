import { NavLink } from "react-router-dom";
import { FiHome, FiMessageCircle, FiFilm, FiUsers, FiUser } from "react-icons/fi";
import { useChatStore } from "../../stores/chatStore";

const items = [
  { to: "/",            icon: FiHome,          exact: true },
  { to: "/chats",       icon: FiMessageCircle, key: "chats" },
  { to: "/reels",       icon: FiFilm },
  { to: "/connections", icon: FiUsers },
  { to: "/profile",     icon: FiUser },
];

export default function MobileNav() {
  const unreadConvos = useChatStore((s) => s.unreadConvos);

  const badgeFor = (key) => {
    if (key === "chats") return unreadConvos;
    return 0;
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around"
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
        const count = badgeFor(it.key);
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.exact}
            className={({ isActive }) =>
              `relative flex items-center justify-center flex-1 py-3 transition-all duration-200 ${isActive ? "" : "opacity-50"}`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--accent)" : "var(--text-primary)",
            })}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={2} />
              {count > 0 && (
                <span
                  className="absolute -top-1.5 -right-2.5 text-[9px] font-bold rounded-full min-w-[16px] h-[16px] inline-flex items-center justify-center leading-none"
                  style={{ background: "var(--accent)", color: "var(--accent-inverse, white)" }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
}
