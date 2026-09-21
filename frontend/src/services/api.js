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

// Request interceptor to attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fuel_sync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized access (e.g., token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we receive a 401 on an authenticated request (not the login endpoint itself)
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('fuel_sync_token');
        localStorage.removeItem('fuel_sync_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
