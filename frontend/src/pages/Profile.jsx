import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services";
import Avatar from "../components/ui/Avatar.jsx";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ display_name: "", about: "", location: "", website: "", is_private: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      display_name: user.display_name || "",
      about: user.profile?.about || "",
      location: user.profile?.location || "",
      website: user.profile?.website || "",
      is_private: !!user.profile?.is_private,
    });
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const me = await authService.updateProfile(form);
      setUser(me);
    } finally { setSaving(false); }
  };

  if (!user) return null;
  return (
    <div className="container-x py-6 md:py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Avatar user={user} size={72} />
        <div>
          <h2 className="font-serif text-3xl">{user.display_name || user.username}</h2>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>@{user.username}</div>
        </div>
      </div>
      <div className="card p-5 grid gap-4">
        <div><label className="label">Display name</label>
          <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
        <div><label className="label">About</label>
          <textarea className="input" rows={3} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><label className="label">Website</label>
            <input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={form.is_private} onChange={(e) => setForm({ ...form, is_private: e.target.checked })} />
          Private profile (visible only to accepted connections)
        </label>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}
