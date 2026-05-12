import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { useUIStore } from "../../stores/uiStore";

/**
 * Floating action button to open the Composer.
 * `kind` selects the default tab inside the composer.
 */
export default function ComposeFab({ kind = "post", className = "" }) {
  const open = useUIStore((s) => s.openComposer);
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      onClick={() => open(kind)}
      title="Create"
      aria-label="Create"
      className={`fixed z-40 shadow-lg flex items-center justify-center rounded-full ${className}`}
      style={{
        right: 20,
        bottom: "calc(var(--mobilebar-height) + 20px + env(safe-area-inset-bottom))",
        width: 56, height: 56,
        background: "var(--accent)",
        color: "var(--accent-inverse)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <FiPlus size={26} />
    </motion.button>
  );
}
