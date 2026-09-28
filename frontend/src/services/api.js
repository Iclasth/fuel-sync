import axios from 'axios';

// The baseURL is relative to leverage Vite's reverse proxy in dev (/api -> backend:3000)
// and reverse proxy (e.g. Nginx) in production, preventing CORS issues.
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fuel_sync_token');
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized access with Silent Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on auth endpoints (login, refresh, signup)
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/signup');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If the request was already retried once, terminate session
    if (originalRequest._retry) {
      localStorage.removeItem('fuel_sync_token');
      localStorage.removeItem('fuel_sync_refresh_token');
      localStorage.removeItem('fuel_sync_user');
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('fuel_sync_refresh_token');
    if (!refreshToken) {
      localStorage.removeItem('fuel_sync_token');
      localStorage.removeItem('fuel_sync_user');
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // If refresh is already underway, enqueue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
          } else {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Use direct axios call to avoid circular interceptor recursion
      const response = await axios.post(
        '/api/v1/auth/refresh',
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('fuel_sync_token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('fuel_sync_refresh_token', newRefreshToken);
      }

      if (api.defaults.headers.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }

      if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
        originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
      } else {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      processQueue(null, accessToken);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('fuel_sync_token');
      localStorage.removeItem('fuel_sync_refresh_token');
      localStorage.removeItem('fuel_sync_user');
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
