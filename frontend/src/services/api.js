import axios from "axios";
import { useAuthStore } from "../stores/authStore";

export const api = axios.create({
  baseURL: "/api",
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
    const original = err.config;
    if (status === 401 && !original.__retried) {
      original.__retried = true;
      refreshing = refreshing || api.post("/auth/refresh").then((r) => {
        const access = r.data?.data?.access;
        useAuthStore.getState().setAccess(access);
        return access;
      }).catch(() => {
        useAuthStore.getState().clear();
        return null;
      }).finally(() => { refreshing = null; });
      const access = await refreshing;
      if (access) {
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      }
    }
    return Promise.reject(err);
  }
);

export const unwrap = (p) => p.then((r) => r.data?.data);
