import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthContext } from '../../context/AuthContext';

describe('ProtectedRoute', () => {
  const renderProtectedRoute = (authValues) => {
    return render(
      <AuthContext.Provider value={authValues}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Tela de Login</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Conteúdo Protegido</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('shows loading spinner when auth is loading', () => {
    renderProtectedRoute({
      isAuthenticated: false,
      isLoading: true,
    });

    expect(screen.getByText('Carregando sessão...')).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    renderProtectedRoute({
      isAuthenticated: false,
      isLoading: false,
    });

    expect(screen.getByText('Tela de Login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
  });

  it('renders protected content when user is authenticated', () => {
    renderProtectedRoute({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'cliente' },
    });

    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
    expect(screen.queryByText('Tela de Login')).not.toBeInTheDocument();
  });
});
