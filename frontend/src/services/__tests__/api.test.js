import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import api from '../api';

describe('API Service and Interceptors', () => {
  const originalLocation = window.location;
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    delete window.location;
    window.location = { href: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
    api.defaults.adapter = originalAdapter;
  });

  describe('Request Interceptor', () => {
    it('attaches Bearer token when fuel_sync_token exists in localStorage', async () => {
      localStorage.setItem('fuel_sync_token', 'valid-jwt-token');

      const requestInterceptor = api.interceptors.request.handlers[0];
      const config = await requestInterceptor.fulfilled({ headers: {} });

      expect(config.headers.Authorization).toBe('Bearer valid-jwt-token');
    });

    it('does not attach Authorization header when no token is present', async () => {
      const requestInterceptor = api.interceptors.request.handlers[0];
      const config = await requestInterceptor.fulfilled({ headers: {} });

      expect(config.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor (Silent Refresh)', () => {
    it('passes through successful responses unchanged', () => {
      const responseInterceptor = api.interceptors.response.handlers[0];
      const mockResponse = { status: 200, data: { success: true } };

      const result = responseInterceptor.fulfilled(mockResponse);
      expect(result).toBe(mockResponse);
    });

    it('rejects immediately without refresh if 401 occurs on /auth/login', async () => {
      const responseInterceptor = api.interceptors.response.handlers[0];
      const mockError = {
        config: { url: '/api/v1/auth/login' },
        response: { status: 401 },
      };

      await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      expect(window.location.href).toBe('');
    });

    it('clears session and redirects to /login if 401 occurs without refresh token', async () => {
      localStorage.setItem('fuel_sync_token', 'expired-token');
      const responseInterceptor = api.interceptors.response.handlers[0];
      const mockError = {
        config: { url: '/api/v1/orders' },
        response: { status: 401 },
      };

      await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      expect(localStorage.getItem('fuel_sync_token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('clears session and redirects to /login if request has already been retried (_retry: true)', async () => {
      localStorage.setItem('fuel_sync_token', 'expired-token');
      localStorage.setItem('fuel_sync_refresh_token', 'dummy-refresh');
      const responseInterceptor = api.interceptors.response.handlers[0];
      const mockError = {
        config: { url: '/api/v1/orders', _retry: true },
        response: { status: 401 },
      };

      await expect(responseInterceptor.rejected(mockError)).rejects.toEqual(mockError);
      expect(localStorage.getItem('fuel_sync_token')).toBeNull();
      expect(localStorage.getItem('fuel_sync_refresh_token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('successfully refreshes token and replays original request on 401', async () => {
      localStorage.setItem('fuel_sync_token', 'expired-token');
      localStorage.setItem('fuel_sync_refresh_token', 'valid-refresh-token');

      const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          accessToken: 'fresh-new-token',
          refreshToken: 'fresh-refresh-token',
        },
      });

      api.defaults.adapter = async (config) => ({
        data: { id: 'order-1' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });

      const responseInterceptor = api.interceptors.response.handlers[0];
      const mockError = {
        config: { url: '/api/v1/orders', headers: {} },
        response: { status: 401 },
      };

      const result = await responseInterceptor.rejected(mockError);

      expect(axiosPostSpy).toHaveBeenCalledWith(
        '/api/v1/auth/refresh',
        { refreshToken: 'valid-refresh-token' },
        expect.any(Object)
      );

      expect(localStorage.getItem('fuel_sync_token')).toBe('fresh-new-token');
      expect(localStorage.getItem('fuel_sync_refresh_token')).toBe('fresh-refresh-token');
      expect(mockError.config.headers.Authorization).toBe('Bearer fresh-new-token');
      expect(result.data).toEqual({ id: 'order-1' });

      axiosPostSpy.mockRestore();
    });

    it('queues concurrent 401 requests and processes them once refresh completes', async () => {
      localStorage.setItem('fuel_sync_token', 'expired-token');
      localStorage.setItem('fuel_sync_refresh_token', 'valid-refresh-token');

      let resolveRefresh;
      const refreshPromise = new Promise((res) => {
        resolveRefresh = res;
      });

      const axiosPostSpy = vi.spyOn(axios, 'post').mockReturnValueOnce(
        refreshPromise.then(() => ({
          data: {
            accessToken: 'concurrent-fresh-token',
            refreshToken: 'concurrent-fresh-refresh',
          },
        }))
      );

      api.defaults.adapter = async (config) => ({
        data: { url: config.url, tokenUsed: config.headers?.Authorization },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });

      const responseInterceptor = api.interceptors.response.handlers[0];

      const err1 = { config: { url: '/api/v1/orders/1', headers: {} }, response: { status: 401 } };
      const err2 = { config: { url: '/api/v1/orders/2', headers: {} }, response: { status: 401 } };

      const p1 = responseInterceptor.rejected(err1);
      const p2 = responseInterceptor.rejected(err2);

      // Resolve refresh
      resolveRefresh();

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      expect(res1.data.tokenUsed).toBe('Bearer concurrent-fresh-token');
      expect(res2.data.tokenUsed).toBe('Bearer concurrent-fresh-token');

      axiosPostSpy.mockRestore();
    });

    it('clears storage and redirects to /login when refresh request fails', async () => {
      localStorage.setItem('fuel_sync_token', 'expired-token');
      localStorage.setItem('fuel_sync_refresh_token', 'invalid-refresh-token');

      const refreshError = new Error('Refresh token invalid');
      const axiosPostSpy = vi.spyOn(axios, 'post').mockRejectedValueOnce(refreshError);

      const responseInterceptor = api.interceptors.response.handlers[0];
      const mockError = {
        config: { url: '/api/v1/orders', headers: {} },
        response: { status: 401 },
      };

      await expect(responseInterceptor.rejected(mockError)).rejects.toThrow('Refresh token invalid');

      expect(localStorage.getItem('fuel_sync_token')).toBeNull();
      expect(localStorage.getItem('fuel_sync_refresh_token')).toBeNull();
      expect(window.location.href).toBe('/login');

      axiosPostSpy.mockRestore();
    });
  });
});

