import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../AppRoutes';
import { AuthContext } from '../../context/AuthContext';

// Mock child pages to isolate route-level testing
vi.mock('../../pages/auth/LoginPage', () => ({
  default: () => <div data-testid="login-page">LoginPage</div>,
}));

vi.mock('../../pages/auth/RegisterPage', () => ({
  default: () => <div data-testid="register-page">RegisterPage</div>,
}));

vi.mock('../../pages/HomePage', () => ({
  default: () => <div data-testid="home-page">HomePage</div>,
}));

vi.mock('../../pages/ComprarCombustivelPage', () => ({
  default: () => <div data-testid="comprar-page">ComprarPage</div>,
}));

vi.mock('../../pages/OrderTrackingPage', () => ({
  default: () => <div data-testid="rastreio-page">RastreioPage</div>,
}));

vi.mock('../../pages/EnderecosPage', () => ({
  default: () => <div data-testid="enderecos-page">EnderecosPage</div>,
}));

describe('AppRoutes', () => {
  const renderWithRoute = (initialPath, authState) => {
    return render(
      <AuthContext.Provider value={authState}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('redirects unauthenticated user accessing / to /login', () => {
    renderWithRoute('/', { isAuthenticated: false, isLoading: false });
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('renders login page when unauthenticated user accesses /login', () => {
    renderWithRoute('/login', { isAuthenticated: false, isLoading: false });
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('redirects authenticated user accessing /login to /', () => {
    renderWithRoute('/login', {
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'cliente' },
    });
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('renders HomePage when authenticated user accesses /', () => {
    renderWithRoute('/', {
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'cliente' },
    });
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders ComprarCombustivelPage when authenticated user accesses /comprar', () => {
    renderWithRoute('/comprar', {
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'cliente' },
    });
    expect(screen.getByTestId('comprar-page')).toBeInTheDocument();
  });

  it('redirects unauthenticated user accessing /comprar to /login', () => {
    renderWithRoute('/comprar', { isAuthenticated: false, isLoading: false });
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('redirects invalid routes to / which redirects to /login if unauthenticated', () => {
    renderWithRoute('/non-existent-route', { isAuthenticated: false, isLoading: false });
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
