import { motion } from "framer-motion";

export default function Avatar({ user, size = 36 }) {
  const url = user?.profile?.avatar;
  const initials = (user?.display_name || user?.username || "?").trim().slice(0, 1).toUpperCase();
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="rounded-full overflow-hidden flex items-center justify-center font-medium"
      style={{
        width: size, height: size,
        background: "var(--bg-surface-2)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
        fontSize: size * 0.4,
      }}
    >
      {url ? <img src={url} alt={user?.username} className="w-full h-full object-cover" /> : initials}
    </motion.div>
  );
}
