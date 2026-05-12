import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Topbar from "../components/layout/Topbar.jsx";
import Sidebar from "../components/layout/Sidebar.jsx";
import MobileNav from "../components/layout/MobileNav.jsx";
import { useRealtime } from "../realtime/useRealtime.js";

export default function MainLayout() {
  useRealtime();
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <div className="flex-1 flex">
        <Sidebar />
        <motion.main
          key="main"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex-1 min-w-0"
          style={{ paddingBottom: "calc(var(--mobilebar-height) + env(safe-area-inset-bottom))" }}
        >
          <Outlet />
        </motion.main>
      </div>
      <MobileNav />
    </div>
  );
}
