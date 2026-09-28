import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import useAuth from '../hooks/useAuth';

// Páginas de Autenticação
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Módulos Operacionais do Cliente
import HomePage from '../pages/HomePage';
import PerfilPage from '../pages/PerfilPage';
import OrderTrackingPage from '../pages/OrderTrackingPage';
import ComprarCombustivelPage from '../pages/ComprarCombustivelPage';
import EnderecosPage from '../pages/EnderecosPage';

// Módulos de Gestão do Posto (posto_admin e admin_geral)
import PostoPedidosPage from '../pages/posto/PostoPedidosPage';
import PostoCatalogoPage from '../pages/posto/PostoCatalogoPage';
import PostoEntregadoresPage from '../pages/posto/PostoEntregadoresPage';

// Módulos de Administração Geral (admin_geral)
import AdminPostosPage from '../pages/admin/AdminPostosPage';
import AdminVinculosPage from '../pages/admin/AdminVinculosPage';

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

      {/* Módulos do Cliente (Protegidos) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <PerfilPage />
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

      {/* Módulos de Gestão do Posto (Restrito a posto_admin e admin_geral) */}
      <Route
        path="/posto/pedidos"
        element={
          <RoleRoute allowedRoles={['posto_admin', 'admin_geral']}>
            <PostoPedidosPage />
          </RoleRoute>
        }
      />

      <Route
        path="/posto/precos"
        element={
          <RoleRoute allowedRoles={['posto_admin', 'admin_geral']}>
            <PostoCatalogoPage />
          </RoleRoute>
        }
      />

      <Route
        path="/posto/catalogo"
        element={
          <RoleRoute allowedRoles={['posto_admin', 'admin_geral']}>
            <PostoCatalogoPage />
          </RoleRoute>
        }
      />

      <Route
        path="/posto/entregadores"
        element={
          <RoleRoute allowedRoles={['posto_admin', 'admin_geral']}>
            <PostoEntregadoresPage />
          </RoleRoute>
        }
      />

      {/* Módulos de Administração Geral (Restrito a admin_geral) */}
      <Route
        path="/admin/postos"
        element={
          <RoleRoute allowedRoles={['admin_geral']}>
            <AdminPostosPage />
          </RoleRoute>
        }
      />

      <Route
        path="/admin/vinculos"
        element={
          <RoleRoute allowedRoles={['admin_geral']}>
            <AdminVinculosPage />
          </RoleRoute>
        }
      />

      {/* Redirecionamento Padrão (Fallback) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;