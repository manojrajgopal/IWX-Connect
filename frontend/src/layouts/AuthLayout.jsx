import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="hidden md:flex flex-col justify-between p-10"
        style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-color)" }}
      >
        <Link to="/" className="font-serif text-3xl font-extrabold">IWX</Link>
        <div>
          <h1 className="font-serif text-5xl leading-tight mb-3">Connect.<br/>Share.<br/>Belong.</h1>
          <p className="max-w-md" style={{ color: "var(--text-secondary)" }}>
            A premium social space for messages, moments, and the people who matter.
          </p>
        </div>
        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>© {new Date().getFullYear()} IWX</div>
      </motion.aside>
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center p-6 md:p-10"
      >
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
