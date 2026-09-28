import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import useAuth from '../hooks/useAuth';

// Páginas de Autenticação
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Módulos Operacionais e de Gestão
import HomePage from '../pages/HomePage';
import OrderTrackingPage from '../pages/OrderTrackingPage';
import ComprarCombustivelPage from '../pages/ComprarCombustivelPage';
import EnderecosPage from '../pages/EnderecosPage';

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
          <p className="text-sm font-medium text-gray-600">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Fluxo de Autenticação (Público) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/cadastro"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Módulos Operacionais Protegidos */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/comprar"
        element={
          <ProtectedRoute>
            <ComprarCombustivelPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rastreio"
        element={
          <ProtectedRoute>
            <OrderTrackingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/enderecos"
        element={
          <ProtectedRoute>
            <EnderecosPage />
          </ProtectedRoute>
        }
      />

      {/* Redirecionamento Padrão (Fallback) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;