import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '../AuthProvider';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  it('initializes with unauthenticated state when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('restores state from localStorage if token, refreshToken and user exist', () => {
    const mockUser = { id: 'usr-1', email: 'test@fuelsync.com', role: 'posto_admin' };
    localStorage.setItem('fuel_sync_token', 'mock-jwt-token');
    localStorage.setItem('fuel_sync_refresh_token', 'mock-refresh-token');
    localStorage.setItem('fuel_sync_user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('mock-jwt-token');
    expect(result.current.refreshToken).toBe('mock-refresh-token');
    expect(result.current.user).toEqual(mockUser);
  });

  it('successfully logs in, saves tokens to localStorage, and updates state', async () => {
    const mockUser = { id: 'usr-2', email: 'client@fuelsync.com', role: 'cliente' };
    api.post.mockResolvedValueOnce({
      data: {
        accessToken: 'new-token-123',
        refreshToken: 'new-refresh-456',
        user: mockUser,
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('client@fuelsync.com', 'password123');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'client@fuelsync.com',
      password: 'password123',
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('new-token-123');
    expect(result.current.refreshToken).toBe('new-refresh-456');
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem('fuel_sync_token')).toBe('new-token-123');
    expect(localStorage.getItem('fuel_sync_refresh_token')).toBe('new-refresh-456');
  });

  it('clears state and all localStorage items on logout', () => {
    localStorage.setItem('fuel_sync_token', 'token-to-remove');
    localStorage.setItem('fuel_sync_refresh_token', 'refresh-to-remove');
    localStorage.setItem('fuel_sync_user', JSON.stringify({ id: '1' }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('fuel_sync_token')).toBeNull();
    expect(localStorage.getItem('fuel_sync_refresh_token')).toBeNull();
    expect(localStorage.getItem('fuel_sync_user')).toBeNull();
  });

  it('updates tokens via updateTokens without altering user profile', () => {
    const mockUser = { id: 'usr-3', email: 'user@fuelsync.com', role: 'cliente' };
    localStorage.setItem('fuel_sync_token', 'old-token');
    localStorage.setItem('fuel_sync_refresh_token', 'old-refresh');
    localStorage.setItem('fuel_sync_user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.updateTokens('refreshed-token', 'refreshed-refresh');
    });

    expect(result.current.token).toBe('refreshed-token');
    expect(result.current.refreshToken).toBe('refreshed-refresh');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('fuel_sync_token')).toBe('refreshed-token');
    expect(localStorage.getItem('fuel_sync_refresh_token')).toBe('refreshed-refresh');
  });
});
