import axios, { type InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'pms_token';
const REFRESH_KEY = 'pms_refresh';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setRefreshToken = (t: string | null) =>
  t ? localStorage.setItem(REFRESH_KEY, t) : localStorage.removeItem(REFRESH_KEY);

/** Persist the tokens returned by /auth/login or /auth/refresh. */
export function setSession(s: { token: string; refreshToken?: string }) {
  setToken(s.token);
  if (s.refreshToken !== undefined) setRefreshToken(s.refreshToken);
}

/** Clear the whole local session (both tokens). */
export function clearSession() {
  setToken(null);
  setRefreshToken(null);
}

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A single in-flight refresh shared by all concurrent 401s, so a burst of
// requests after the access token expires triggers exactly one /auth/refresh.
let refreshing: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const rt = getRefreshToken();
      if (!rt) return null;
      try {
        // Bare axios (not `api`) so this request skips the interceptors below.
        const r = await axios.post('/api/auth/refresh', { refreshToken: rt });
        setSession({ token: r.data.token, refreshToken: r.data.refreshToken });
        return r.data.token as string;
      } catch {
        clearSession();
        return null;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

function redirectToLogin() {
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');

    // On a 401, transparently refresh the access token once and retry the request.
    if (status === 401 && original && !original._retry && !isAuthCall && getRefreshToken()) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    // Refresh unavailable or failed → end the session. Never on the login call
    // itself, so the Login page can surface "invalid credentials".
    if (status === 401 && !isAuthCall) {
      clearSession();
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

export function apiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (e.response?.data as { error?: string })?.error ?? e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}

/** Download a file from an authenticated API endpoint (e.g. CSV export). */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const doFetch = (token: string | null) =>
    fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

  let res = await doFetch(getToken());
  // The access token may have expired — refresh once and retry.
  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch(newToken);
  }
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
