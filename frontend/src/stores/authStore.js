import { create } from "zustand";

export const useAuthStore = create((set) => ({
  access: localStorage.getItem("iwx-access") || null,
  session: localStorage.getItem("iwx-session") || null,
  user: null,
  setAccess: (access) => {
    if (access) localStorage.setItem("iwx-access", access);
    else localStorage.removeItem("iwx-access");
    set({ access });
  },
  setSession: (session) => {
    if (session) localStorage.setItem("iwx-session", session);
    else localStorage.removeItem("iwx-session");
    set({ session });
  },
  setUser: (user) => set({ user }),
  clear: () => {
    localStorage.removeItem("iwx-access");
    localStorage.removeItem("iwx-session");
    set({ access: null, session: null, user: null });
  },
}));
