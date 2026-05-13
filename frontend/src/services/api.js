import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const backendUrl = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: `${backendUrl}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    const original = err.config || {};
    const url = (original.url || "").toString();
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/signup") || url.includes("/auth/refresh") || url.includes("/auth/logout");
    if (status === 401 && !original.__retried && !isAuthRoute) {
      original.__retried = true;
      refreshing = refreshing || api.post("/auth/refresh").then((r) => {
        const access = r.data?.data?.access;
        useAuthStore.getState().setAccess(access);
        return access;
      }).catch(() => {
        useAuthStore.getState().clear();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
          window.location.replace("/auth/login");
        }
        return null;
      }).finally(() => { refreshing = null; });
      const access = await refreshing;
      if (access) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      }
    }
    return Promise.reject(err);
  }
);

export const unwrap = (p) => p.then((r) => r.data?.data);
