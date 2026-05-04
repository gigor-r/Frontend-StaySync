import axios from 'axios';

const KEYS = { access: 'ss_access_token', refresh: 'ss_refresh_token' };
const BFF_URL = import.meta.env.VITE_BFF_URL ?? '/bff';

const apiClient = axios.create({
  baseURL: BFF_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor: attach JWT ─────────────────────────── */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(KEYS.access);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ── Response interceptor: handle 401 ───────────────────────── */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    /* Try token refresh once on 401 */
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      const refreshToken = localStorage.getItem(KEYS.refresh);

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BFF_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem(KEYS.access,  data.accessToken);
          localStorage.setItem(KEYS.refresh, data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(original);
        } catch {
          /* Refresh failed → force logout */
          Object.values(KEYS).forEach(k => localStorage.removeItem(k));
          localStorage.removeItem('ss_user');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
