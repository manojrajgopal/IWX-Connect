import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  conversations: [],
  byId: {},
  activeId: null,
  setConversations: (list) => set({ conversations: list }),
  setMessages: (id, msgs) => set((s) => ({ byId: { ...s.byId, [id]: msgs } })),
  appendMessage: (id, msg) => set((s) => ({ byId: { ...s.byId, [id]: [...(s.byId[id] || []), msg] } })),
  setActive: (id) => set({ activeId: id }),
}));
