import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Splash from "./components/startup/Splash.jsx";
import RouteFallback from "./components/ui/RouteFallback.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import { useAuthStore } from "./stores/authStore";
import { authService } from "./services";

const Home          = lazy(() => import("./pages/Home.jsx"));
const Chats         = lazy(() => import("./pages/Chats.jsx"));
const Requests      = lazy(() => import("./pages/Requests.jsx"));
const Discover      = lazy(() => import("./pages/Discover.jsx"));
const Reels         = lazy(() => import("./pages/Reels.jsx"));
const Profile       = lazy(() => import("./pages/Profile.jsx"));
const Settings      = lazy(() => import("./pages/Settings.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const Login         = lazy(() => import("./pages/auth/Login.jsx"));
const Signup        = lazy(() => import("./pages/auth/Signup.jsx"));

const lazyRoute = (C, variant = "grid") => (
  <Suspense fallback={<RouteFallback variant={variant} />}>
    <C />
  </Suspense>
);

function ProtectedRoute({ children }) {
  const access = useAuthStore((s) => s.access);
  const loc = useLocation();
  if (!access) return <Navigate to="/auth/login" replace state={{ from: loc }} />;
  return children;
}

const SPLASH_KEY = "iwx-connect-visited";

export default function App() {
  const access = useAuthStore((s) => s.access);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const [phase, setPhase] = useState(() =>
    typeof window === "undefined" || sessionStorage.getItem(SPLASH_KEY) ? "ready" : "splash"
  );
  const onSplashDone = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setPhase("ready");
  }, []);

  useEffect(() => {
    if (!access) return;
    authService.me().then(setUser).catch(() => clear());
  }, [access, setUser, clear]);

  if (phase !== "ready") return <Splash onComplete={onSplashDone} />;

  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login"  element={lazyRoute(Login, "form")} />
        <Route path="signup" element={lazyRoute(Signup, "form")} />
      </Route>

      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index               element={lazyRoute(Home)} />
        <Route path="chats"        element={lazyRoute(Chats, "list")} />
        <Route path="requests"     element={lazyRoute(Requests, "list")} />
        <Route path="discover"     element={lazyRoute(Discover, "list")} />
        <Route path="reels"        element={lazyRoute(Reels)} />
        <Route path="profile"      element={lazyRoute(Profile, "form")} />
        <Route path="settings"     element={lazyRoute(Settings, "form")} />
        <Route path="notifications" element={lazyRoute(Notifications, "list")} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
