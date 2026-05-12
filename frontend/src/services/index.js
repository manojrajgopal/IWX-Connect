import { api, unwrap } from "./api";

export const authService = {
  signup: (payload) => unwrap(api.post("/auth/signup", payload)),
  login:  (payload) => unwrap(api.post("/auth/login", payload)),
  logout: () => unwrap(api.post("/auth/logout")),
  me:     () => unwrap(api.get("/auth/me")),
  updateProfile: (payload) => unwrap(api.patch("/auth/me/profile", payload)),
  preferences: (payload) => unwrap(payload ? api.patch("/auth/me/preferences", payload) : api.get("/auth/me/preferences")),
};

export const connectionsService = {
  search: (q) => unwrap(api.get("/connections/search", { params: { q } })),
  send:   (username) => unwrap(api.post("/connections/requests", { username })),
  pending: () => unwrap(api.get("/connections/requests/pending")),
  respond: (id, action) => unwrap(api.post(`/connections/requests/${id}/respond`, { action })),
  friends: () => unwrap(api.get("/connections/friends")),
  block:   (username) => unwrap(api.post(`/connections/block/${username}`)),
};

export const chatsService = {
  list:    () => unwrap(api.get("/chats/")),
  open:    (username) => unwrap(api.post("/chats/direct", { username })),
  messages: (id, before) => unwrap(api.get(`/chats/${id}/messages`, { params: before ? { before } : {} })),
  send:    (id, body) => unwrap(api.post(`/chats/${id}/messages/send`, { body })),
  read:    (id, up_to) => unwrap(api.post(`/chats/${id}/read`, { up_to })),
  delivered: (id, message_ids) => unwrap(api.post(`/chats/${id}/delivered`, { message_ids })),
  unreadSummary: () => unwrap(api.get("/chats/unread-summary")),
};

export const feedsService = {
  feed:     (kind = "post") => unwrap(api.get("/feeds/", { params: { kind } })),
  stories:  () => unwrap(api.get("/feeds/stories")),
  create:   (payload) => unwrap(api.post("/feeds/posts", payload)),
  like:     (id) => unwrap(api.post(`/feeds/posts/${id}/like`)),
  comments: (id, body) => unwrap(body ? api.post(`/feeds/posts/${id}/comments`, { body }) : api.get(`/feeds/posts/${id}/comments`)),
};

export const notificationsService = {
  list: () => unwrap(api.get("/notifications/")),
  seen: () => unwrap(api.post("/notifications/seen")),
  vapidKey: () => unwrap(api.get("/notifications/push/key")),
  subscribe: (sub) => unwrap(api.post("/notifications/push/subscribe", sub)),
};

export const mediaService = {
  upload: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return unwrap(api.post("/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }));
  },
};
