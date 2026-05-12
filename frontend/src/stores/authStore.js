import { create } from "zustand";

export const useAuthStore = create((set) => ({
  access: localStorage.getItem("iwx-access") || null,
  user: null,
  setAccess: (access) => {
    if (access) localStorage.setItem("iwx-access", access);
    else localStorage.removeItem("iwx-access");
    set({ access });
  },
  setUser: (user) => set({ user }),
  clear: () => {
    localStorage.removeItem("iwx-access");
    set({ access: null, user: null });
  },
}));
