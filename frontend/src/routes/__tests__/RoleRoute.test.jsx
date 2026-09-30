import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RoleRoute from '../RoleRoute';
import { AuthContext } from '../../context/AuthContext';

describe('RoleRoute', () => {
  const renderRoleRoute = (authValues, allowedRoles = ['posto_admin']) => {
    return render(
      <AuthContext.Provider value={authValues}>
        <MemoryRouter initialEntries={['/admin-posto']}>
          <Routes>
            <Route path="/login" element={<div>Tela de Login</div>} />
            <Route path="/" element={<div>Home Pública/Cliente</div>} />
            <Route
              path="/admin-posto"
              element={
                <RoleRoute allowedRoles={allowedRoles}>
                  <div>Painel do Posto</div>
                </RoleRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('shows loading spinner when auth is loading', () => {
    renderRoleRoute({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    expect(screen.getByText('Carregando permissões...')).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    renderRoleRoute({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    expect(screen.getByText('Tela de Login')).toBeInTheDocument();
    expect(screen.queryByText('Painel do Posto')).not.toBeInTheDocument();
  });

  it('redirects to / when user does not have allowed role', () => {
    renderRoleRoute({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'cliente' },
    }, ['posto_admin']);

    expect(screen.getByText('Home Pública/Cliente')).toBeInTheDocument();
    expect(screen.queryByText('Painel do Posto')).not.toBeInTheDocument();
  });

  it('renders protected role content when user has allowed role', () => {
    renderRoleRoute({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '2', role: 'posto_admin' },
    }, ['posto_admin']);

    expect(screen.getByText('Painel do Posto')).toBeInTheDocument();
    expect(screen.queryByText('Home Pública/Cliente')).not.toBeInTheDocument();
  });
});
