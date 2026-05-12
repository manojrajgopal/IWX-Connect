import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Topbar from "../components/layout/Topbar.jsx";
import Sidebar from "../components/layout/Sidebar.jsx";
import MobileNav from "../components/layout/MobileNav.jsx";
import Composer from "../components/composer/Composer.jsx";
import StoriesViewer from "../components/feed/StoriesViewer.jsx";
import { useRealtime } from "../realtime/useRealtime.js";

export default function MainLayout() {
  useRealtime();
  const location = useLocation();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topbar />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex-1 min-w-0 min-h-0 overflow-y-auto pb-[calc(var(--mobilebar-height)+env(safe-area-inset-bottom))] md:pb-0"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
      <MobileNav />
      <Composer />
      <StoriesViewer />
    </div>
  );
}
