import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthContext } from '../../../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithContext = (loginFn = mockLogin) => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            login: loginFn,
            isAuthenticated: false,
            isLoading: false,
          }}
        >
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('renders login form elements correctly', () => {
    renderWithContext();

    expect(screen.getByRole('heading', { name: /Acesse sua conta/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('usuario@dominio.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar na Plataforma/i })).toBeInTheDocument();
  });

  it('toggles password visibility when button clicked', () => {
    renderWithContext();

    const passwordInput = screen.getByPlaceholderText('••••••••');
    const toggleButton = screen.getByLabelText('Exibir senha');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideButton = screen.getByLabelText('Ocultar senha');
    fireEvent.click(hideButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('displays error message when login fails with invalid credentials', async () => {
    mockLogin.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { error: 'Credenciais inválidas.' },
      },
    });

    renderWithContext();

    fireEvent.change(screen.getByPlaceholderText('usuario@dominio.com'), {
      target: { value: 'wrong@fuelsync.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar na Plataforma/i }));

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent('Credenciais inválidas.');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to destination upon successful login', async () => {
    mockLogin.mockResolvedValueOnce({ id: '1', email: 'user@fuelsync.com' });

    renderWithContext();

    fireEvent.change(screen.getByPlaceholderText('usuario@dominio.com'), {
      target: { value: 'user@fuelsync.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar na Plataforma/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@fuelsync.com', 'secret123');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
