import { Outlet, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMessageCircle, FiUsers, FiShield, FiZap, FiHeart, FiGlobe } from "react-icons/fi";

const features = [
  { icon: FiMessageCircle, title: "Real-time messaging", desc: "Instant encrypted conversations" },
  { icon: FiUsers, title: "Community feeds", desc: "Share moments that matter" },
  { icon: FiShield, title: "Privacy first", desc: "End-to-end security built in" },
  { icon: FiZap, title: "Lightning fast", desc: "Optimized for every device" },
];

const stats = [
  { value: "10K+", label: "Active users" },
  { value: "500K+", label: "Messages sent" },
  { value: "99.9%", label: "Uptime" },
];

const floatVariants = {
  animate: (i) => ({
    y: [0, -12, 0],
    transition: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
  }),
};

export default function AuthLayout() {
  return (
    <div className="h-screen overflow-hidden flex flex-col lg:grid lg:grid-cols-[1fr_minmax(420px,480px)] xl:grid-cols-[1fr_480px]">
      {/* ── Left brand panel ── */}
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative hidden lg:flex flex-col justify-between overflow-hidden"
        style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--border-color)" }}
      >
        {/* Decorative floating orbs */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={floatVariants}
            animate="animate"
            className="absolute rounded-full pointer-events-none"
            style={{
              width: [180, 120, 90][i],
              height: [180, 120, 90][i],
              top: ["12%", "55%", "78%"][i],
              left: ["60%", "15%", "70%"][i],
              background: `radial-gradient(circle, ${["rgba(236,236,236,0.08)", "rgba(236,236,236,0.05)", "rgba(236,236,236,0.06)"][i]} 0%, transparent 70%)`,
              filter: "blur(1px)",
            }}
          />
        ))}

        {/* Top: Logo */}
        <div className="relative z-10 p-8 xl:p-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-serif text-lg font-extrabold transition-transform group-hover:scale-105"
              style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}
            >
              W
            </div>
            <span className="font-serif text-2xl font-extrabold tracking-tight">IWX Connect</span>
          </Link>
        </div>

        {/* Center: Hero + features */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 xl:px-10 gap-10">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="font-serif text-4xl xl:text-5xl 2xl:text-6xl leading-[1.08] mb-4"
            >
              Connect.
              <br />
              Share.
              <br />
              <span style={{ color: "var(--text-muted)" }}>Belong.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-base xl:text-lg max-w-md leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              A premium social space for messages, moments, and the people who matter most to you.
            </motion.p>
          </div>

          {/* Feature grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="grid grid-cols-2 gap-3"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
                className="rounded-xl p-4 flex flex-col gap-2 transition-colors"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
              >
                <f.icon size={18} style={{ color: "var(--text-muted)" }} />
                <span className="text-sm font-semibold">{f.title}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{f.desc}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex gap-8"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-xl xl:text-2xl font-bold font-serif">{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 px-8 xl:px-10 pb-6 flex items-center justify-between">
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} InfiniteWaveX · All rights reserved
          </div>
          <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </motion.aside>

      {/* ── Right form panel ── */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 flex flex-col h-screen lg:h-auto overflow-hidden"
      >
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between p-4 sm:p-6" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <Link to="/" className="inline-flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-serif text-sm font-extrabold"
              style={{ background: "var(--accent)", color: "var(--accent-inverse)" }}
            >
              W
            </div>
            <span className="font-serif text-xl font-extrabold">IWX Connect</span>
          </Link>
        </div>

        {/* Mobile hero banner */}
        <div
          className="lg:hidden px-4 sm:px-6 py-6"
          style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)" }}
        >
          <h2 className="font-serif text-2xl sm:text-3xl mb-2">
            Connect. Share. <span style={{ color: "var(--text-muted)" }}>Belong.</span>
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Your premium social space for messages, moments, and meaningful connections.
          </p>
          <div className="flex gap-6 mt-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-lg font-bold font-serif">{s.value}</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form area — only this section scrolls */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex items-start lg:items-center justify-center min-h-full p-4 sm:p-6 lg:p-10 xl:p-12">
            <div className="w-full max-w-[420px] py-2">
              <Outlet />
            </div>
          </div>
        </div>

        {/* Mobile bottom features */}
        <div
          className="lg:hidden grid grid-cols-2 gap-3 px-4 sm:px-6 py-5"
          style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-surface)" }}
        >
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-2">
              <f.icon size={14} style={{ color: "var(--text-muted)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{f.title}</span>
            </div>
          ))}
        </div>

        {/* Mobile footer */}
        <div
          className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4 text-[11px]"
          style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-color)" }}
        >
          <span>© {new Date().getFullYear()} InfiniteWaveX</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
