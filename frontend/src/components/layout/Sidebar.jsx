import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiHome, FiMessageCircle, FiUserPlus, FiCompass, FiFilm, FiSettings, FiBell } from "react-icons/fi";
import { connectionsService } from "../../services";
import { useNotificationStore } from "../../stores/notificationStore";
import { useChatStore } from "../../stores/chatStore";
import { useAuthStore } from "../../stores/authStore";
import Badge from "../ui/Badge.jsx";

const items = [
  { to: "/",              label: "Home",          icon: FiHome,          exact: true },
  { to: "/chats",         label: "Chats",         icon: FiMessageCircle, key: "chats" },
  { to: "/requests",      label: "Requests",      icon: FiUserPlus,      key: "pending" },
  { to: "/notifications", label: "Notifications", icon: FiBell,          key: "notifications" },
  { to: "/discover",      label: "Discover",      icon: FiCompass },
  { to: "/reels",         label: "Reels",         icon: FiFilm },
  { to: "/settings",      label: "Settings",      icon: FiSettings },
];

export default function Sidebar() {
  const access = useAuthStore((s) => s.access);
  const pending = useQuery({
    queryKey: ["pending"],
    queryFn: () => connectionsService.pending(),
    enabled: !!access,
    refetchInterval: 60_000,
  });
  const unreadNotifications = useNotificationStore((s) => s.unread);
  const unreadConvos = useChatStore((s) => s.unreadConvos);
  const pendingCount = Array.isArray(pending.data) ? pending.data.length : 0;

  const badgeFor = (key) => {
    if (key === "pending") return pendingCount;
    if (key === "notifications") return unreadNotifications;
    if (key === "chats") return unreadConvos;
    return 0;
  };

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
            const count = badgeFor(it.key);
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.exact}
                className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""} ${count > 0 ? "nav-link-unread" : ""}`}
                style={count > 0 ? { fontWeight: 600 } : undefined}
              >
                <Icon className="opacity-80" />
                <span className="flex-1">{it.label}</span>
                <Badge count={count} />
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
