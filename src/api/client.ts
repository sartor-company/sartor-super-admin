import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { notifySessionExpired } from '../utils/appFeedback';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/** Prevent stacked toasts/redirects when many requests 401 at once */
let handlingSessionExpiry = false;

function handleSessionExpired(serverMessage?: string) {
  if (handlingSessionExpiry) return;
  if (window.location.pathname.startsWith('/login')) return;
  handlingSessionExpiry = true;

  notifySessionExpired(serverMessage);
  useAuthStore.getState().logout();

  // Let the in-app toast paint before navigating away
  window.setTimeout(() => {
    window.location.href = '/login?session=expired';
  }, 1200);
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers['s-token'] = token;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message;
    if (msg) {
      err.message = msg;
    }
    if (err.response?.status === 401) {
      handleSessionExpired(
        typeof msg === 'string' && /session|expired|sign in|unauthorized/i.test(msg)
          ? msg
          : undefined,
      );
    }
    return Promise.reject(err);
  },
);

export type ApiResponse<T> = {
  message: string;
  status: boolean;
  data: T;
};

export function unwrap<T>(res: { data: ApiResponse<T> }): T {
  if (!res.data.status) throw new Error(res.data.message || 'Request failed');
  return res.data.data;
}
