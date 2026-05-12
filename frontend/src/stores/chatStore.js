import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  conversations: [],
  byId: {},
  activeId: null,
  typing: {},           // { [convId]: { user, timeout } }
  unreadConvos: 0,      // number of conversations with unread messages (for sidebar badge)
  unreadMessages: 0,    // total unread messages

  setConversations: (list) => {
    const unreadConvos = list.filter((c) => c.unread > 0).length;
    const unreadMessages = list.reduce((sum, c) => sum + (c.unread || 0), 0);
    set({ conversations: list, unreadConvos, unreadMessages });
  },

  updateUnreadFromSummary: (summary) => set({
    unreadConvos: summary.unread_conversations || 0,
    unreadMessages: summary.unread_messages || 0,
  }),

  setMessages: (id, msgs) => set((s) => ({ byId: { ...s.byId, [id]: msgs } })),

  appendMessage: (id, msg) => set((s) => {
    const existing = s.byId[id] || [];
    if (existing.find((m) => m.public_id === msg.public_id)) return s;
    return { byId: { ...s.byId, [id]: [...existing, msg] } };
  }),

  updateMessageStatus: (convId, messageIds, status) => set((s) => {
    const msgs = s.byId[convId];
    if (!msgs) return s;
    const updated = msgs.map((m) => {
      if (messageIds.includes(m.id) || messageIds.includes(m.public_id)) {
        return { ...m, status };
      }
      return m;
    });
    return { byId: { ...s.byId, [convId]: updated } };
  }),

  markAllRead: (convId, upTo) => set((s) => {
    const msgs = s.byId[convId];
    const updated = msgs ? msgs.map((m) => {
      if (upTo === Infinity || m.id <= upTo) return { ...m, status: "read" };
      return m;
    }) : undefined;
    // Update conversation unread count
    const convs = s.conversations.map((c) => {
      if (c.public_id === convId) return { ...c, unread: 0 };
      return c;
    });
    const unreadConvos = convs.filter((c) => c.unread > 0).length;
    const unreadMessages = convs.reduce((sum, c) => sum + (c.unread || 0), 0);
    const byId = updated ? { ...s.byId, [convId]: updated } : s.byId;
    return { byId, conversations: convs, unreadConvos, unreadMessages };
  }),

  setActive: (id) => set({ activeId: id }),

  setTyping: (convId, user) => set((s) => {
    const prev = s.typing[convId];
    if (prev?.timeout) clearTimeout(prev.timeout);
    const timeout = setTimeout(() => {
      const st = get();
      const { [convId]: _, ...rest } = st.typing;
      set({ typing: rest });
    }, 3000);
    return { typing: { ...s.typing, [convId]: { user, timeout } } };
  }),

  clearTyping: (convId) => set((s) => {
    const prev = s.typing[convId];
    if (prev?.timeout) clearTimeout(prev.timeout);
    const { [convId]: _, ...rest } = s.typing;
    return { typing: rest };
  }),

  bumpConversation: (convId, preview, sender) => set((s) => {
    const convs = s.conversations.map((c) => {
      if (c.public_id === convId) {
        const newUnread = s.activeId === convId ? c.unread : (c.unread || 0) + 1;
        return { ...c, unread: newUnread, last_message: { body: preview, sender, created_at: new Date().toISOString() }, last_message_at: new Date().toISOString() };
      }
      return c;
    }).sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
    const unreadConvos = convs.filter((c) => c.unread > 0).length;
    const unreadMessages = convs.reduce((sum, c) => sum + (c.unread || 0), 0);
    return { conversations: convs, unreadConvos, unreadMessages };
  }),
}));
