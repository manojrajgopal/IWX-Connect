import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
  items: [],
  unread: 0,
  push: (n) => set((s) => ({ items: [n, ...s.items].slice(0, 100), unread: s.unread + 1 })),
  setMany: (list) => set({ items: list, unread: list.filter((n) => !n.seen).length }),
  markAllSeen: () => set({ unread: 0 }),
}));
