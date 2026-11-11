import axios from 'axios';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sg_access_token',
  REFRESH_TOKEN: 'sg_refresh_token',
  USER: 'sg_user',
};

export function getStoredAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getStoredRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setStoredSession({ access_token, refresh_token, user }) {
  if (access_token) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
  }
  if (refresh_token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
  }
  if (user !== undefined) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
}

export function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 20000,
});

// Request interceptor: attach Bearer token when present
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single in-flight refresh promise shared across concurrent 401 responses
let refreshPromise = null;

function isAuthBypassUrl(url = '') {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  );
}

function normalizeError(error) {
  if (!error.response) {
    return new Error('Cannot reach the server. Is the backend running?');
  }
  const message =
    error.response?.data?.error ||
    error.message ||
    'Something went wrong';
  const normalized = new Error(message);
  normalized.status = error.response.status;
  normalized.details = error.response?.data?.details;
  normalized.response = error.response;
  return normalized;
}

// Response interceptor: handle 401 token refresh and error normalization
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(normalizeError(error));
    }

    if (
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthBypassUrl(originalRequest.url)
    ) {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        clearStoredSession();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(normalizeError(error));
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${api.defaults.baseURL}/auth/refresh`,
              { refresh_token: refreshToken },
              { timeout: 15000 }
            )
            .then((res) => {
              const { access_token, refresh_token } = res.data;
              setStoredSession({ access_token, refresh_token });
              return access_token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        clearStoredSession();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
        return Promise.reject(normalizeError(refreshErr));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

// Endpoint helpers returning response.data
export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  refresh: (refresh_token) =>
    api.post('/auth/refresh', { refresh_token }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const profileApi = {
  get: () => api.get('/profile').then((r) => r.data),
  update: (fields) => api.put('/profile', fields).then((r) => r.data),
};

export const countriesApi = {
  list: (params) => api.get('/countries', { params }).then((r) => r.data),
  get: (id) => api.get(`/countries/${id}`).then((r) => r.data),
};

export const universitiesApi = {
  list: (params) => api.get('/universities', { params }).then((r) => r.data),
  get: (id) => api.get(`/universities/${id}`).then((r) => r.data),
  byCountry: (countryId, params) =>
    api.get(`/universities/country/${countryId}`, { params }).then((r) => r.data),
};

export const programsApi = {
  list: (params) => api.get('/programs', { params }).then((r) => r.data),
  get: (id) => api.get(`/programs/${id}`).then((r) => r.data),
  fields: () => api.get('/programs/fields').then((r) => r.data),
  byUniversity: (universityId) =>
    api.get(`/programs/university/${universityId}`).then((r) => r.data),
};

export const intakesApi = {
  byUniversity: (universityId) =>
    api.get(`/intakes/university/${universityId}`).then((r) => r.data),
};

export const languageApi = {
  byUniversity: (universityId) =>
    api.get(`/language-requirements/university/${universityId}`).then((r) => r.data),
};

export const scholarshipsApi = {
  list: () => api.get('/scholarships').then((r) => r.data),
  byUniversity: (universityId) =>
    api.get(`/scholarships/university/${universityId}`).then((r) => r.data),
  assess: (payload) => api.post('/scholarships/assess', payload).then((r) => r.data),
};

export const adminApi = {
  list: (table, params) => api.get(`/admin/${table}`, { params }).then((r) => r.data),
  get: (table, id) => api.get(`/admin/${table}/${id}`).then((r) => r.data),
  create: (table, payload) => api.post(`/admin/${table}`, payload).then((r) => r.data),
  update: (table, id, payload) =>
    api.put(`/admin/${table}/${id}`, payload).then((r) => r.data),
  remove: (table, id) => api.delete(`/admin/${table}/${id}`).then((r) => r.data),
};

// Formatting helpers (Section 5.6)
export function formatMoney(n) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num) || !Number.isFinite(num)) return '—';
  return `$${Math.round(num).toLocaleString('en-US')}`;
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDuration(months) {
  if (months === null || months === undefined || months === '') return '—';
  const num = Number(months);
  if (Number.isNaN(num) || num <= 0) return '—';
  if (num % 12 === 0) {
    const years = num / 12;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${num} ${num === 1 ? 'month' : 'months'}`;
}

export default api;

