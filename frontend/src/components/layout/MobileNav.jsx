import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiHome, FiMessageCircle, FiUserPlus, FiFilm, FiUser } from "react-icons/fi";
import { connectionsService } from "../../services";
import { useAuthStore } from "../../stores/authStore";
import { useChatStore } from "../../stores/chatStore";

const items = [
  { to: "/",         icon: FiHome,          label: "Home",     exact: true },
  { to: "/chats",    icon: FiMessageCircle, label: "Chats",    key: "chats" },
  { to: "/requests", icon: FiUserPlus,      label: "Requests", key: "pending" },
  { to: "/reels",    icon: FiFilm,          label: "Reels" },
  { to: "/profile",  icon: FiUser,          label: "Me" },
];

export default function MobileNav() {
  const access = useAuthStore((s) => s.access);
  const pending = useQuery({
    queryKey: ["pending"],
    queryFn: () => connectionsService.pending(),
    enabled: !!access,
    refetchInterval: 60_000,
  });
  const pendingCount = Array.isArray(pending.data) ? pending.data.length : 0;
  const unreadConvos = useChatStore((s) => s.unreadConvos);

  const badgeFor = (key) => {
    if (key === "pending") return pendingCount;
    if (key === "chats") return unreadConvos;
    return 0;
  };

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
        const count = badgeFor(it.key);
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.exact}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 text-[11px] flex-1 py-2 ${isActive ? "" : "opacity-60"}`
            }
            style={{ color: "var(--text-primary)" }}
          >
            <div className="relative">
              <Icon size={20} />
              {count > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 text-[9px] font-semibold rounded-full px-1.5 min-w-[16px] h-[16px] inline-flex items-center justify-center leading-none"
                  style={{ background: "var(--accent)", color: "var(--accent-inverse, white)" }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </div>
            <span>{it.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
