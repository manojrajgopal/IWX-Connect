import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme.jsx";
import { authService, notificationsService } from "../services";
import { useAlertStore } from "../stores/alertStore";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState(null);

  useEffect(() => { authService.preferences().then(setPrefs); }, []);

  const update = async (patch) => {
    const next = await authService.preferences({ ...prefs, ...patch });
    setPrefs(next);
  };

  const enablePush = async () => {
    const showAlert = useAlertStore.getState().showAlert;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const { public_key } = await notificationsService.vapidKey();
    if (!public_key) return showAlert("Push notifications are not configured on the server yet. Please contact an administrator.", { title: "Not available", variant: "warning" });
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(public_key),
    });
    await notificationsService.subscribe(sub.toJSON());
  };

  return (
    <div className="container-x py-6 md:py-8 max-w-3xl flex flex-col gap-6">
      <h2 className="font-serif text-3xl">Settings</h2>

      <div className="card p-5">
        <div className="eyebrow mb-2">Appearance</div>
        <div className="flex items-center gap-3">
          {["light", "dark"].map((t) => (
            <button key={t}
              className={t === theme ? "btn-primary" : "btn"}
              onClick={() => setTheme(t)}>{t}</button>
          ))}
        </div>
      </div>

      {prefs && (
        <div className="card p-5 grid gap-3">
          <div className="eyebrow mb-1">Notifications</div>
          {[
            ["notifications_in_app", "In-app notifications"],
            ["notifications_push", "Browser push notifications"],
            ["notifications_email", "Email notifications"],
            ["show_presence", "Show my online status"],
            ["read_receipts", "Send read receipts"],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <input type="checkbox" checked={!!prefs[k]} onChange={(e) => update({ [k]: e.target.checked })} />
            </label>
          ))}
          <div>
            <button className="btn" onClick={enablePush}>Enable browser notifications</button>
          </div>
        </div>
      )}
    </div>
  );
}

function urlB64ToUint8Array(b64) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
