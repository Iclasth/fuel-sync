import React, { useState, useCallback, useEffect } from 'react';
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
  const [isVerifying, setIsVerifying] = useState(() => {
    try {
      return Boolean(localStorage.getItem('fuel_sync_token'));
    } catch {
      return false;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem('fuel_sync_token');
    localStorage.removeItem('fuel_sync_refresh_token');
    localStorage.removeItem('fuel_sync_user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

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

  // Validação autoritativa com o back-end para mitigar adulteração de localStorage
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      if (!token) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (isMounted && response.data) {
          const verifiedUser = response.data;
          setUser(verifiedUser);
          localStorage.setItem('fuel_sync_user', JSON.stringify(verifiedUser));
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          if (isMounted) logout();
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  // Detector de adulteração de storage em tempo de execução
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'fuel_sync_user' && token) {
        api.get('/auth/me')
          .then((res) => {
            setUser(res.data);
            localStorage.setItem('fuel_sync_user', JSON.stringify(res.data));
          })
          .catch(() => logout());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token, logout]);

  const value = {
    user,
    token,
    refreshToken,
    isAuthenticated: Boolean(token),
    isLoading: isLoading || isVerifying,
    isVerifying,
    login,
    logout,
    updateTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
