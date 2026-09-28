import React, { useState, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('fuel_sync_token');
    } catch {
      return null;
    }
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    try {
      return localStorage.getItem('fuel_sync_refresh_token');
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('fuel_sync_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading] = useState(false);

  const updateTokens = useCallback((newAccessToken, newRefreshToken) => {
    if (newAccessToken) {
      localStorage.setItem('fuel_sync_token', newAccessToken);
      setToken(newAccessToken);
    }
    if (newRefreshToken) {
      localStorage.setItem('fuel_sync_refresh_token', newRefreshToken);
      setRefreshToken(newRefreshToken);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data;

    localStorage.setItem('fuel_sync_token', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('fuel_sync_refresh_token', newRefreshToken);
      setRefreshToken(newRefreshToken);
    }
    localStorage.setItem('fuel_sync_user', JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);

    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fuel_sync_token');
    localStorage.removeItem('fuel_sync_refresh_token');
    localStorage.removeItem('fuel_sync_user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    refreshToken,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    logout,
    updateTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
