import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';
import api from '../../../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

  it('renders registration form elements correctly', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /Criar nova conta/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nome completo ou razão social/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/000\.000\.000-00/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\(11\) 98765-4321/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/usuario@dominio\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar Minha Conta/i })).toBeInTheDocument();
  });

  it('displays error when passwords do not match', async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Nome completo/i), {
      target: { value: 'João Silva' },
    });
    fireEvent.change(screen.getByPlaceholderText(/000\.000\.000-00/i), {
      target: { value: '52998224725' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\(11\)/i), {
      target: { value: '11999998888' },
    });
    fireEvent.change(screen.getByPlaceholderText(/usuario@dominio\.com/i), {
      target: { value: 'joao@empresa.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Mínimo 6 dígitos/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Repita a senha/i), {
      target: { value: '654321' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Criar Minha Conta/i }));

    expect(await screen.findByTestId('register-error-alert')).toHaveTextContent(
      'As senhas não coincidem.'
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it('calls api.post with cleaned data and navigates on success', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Cliente cadastrado com sucesso.' } });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Nome completo/i), {
      target: { value: 'João Silva' },
    });
    fireEvent.change(screen.getByPlaceholderText(/000\.000\.000-00/i), {
      target: { value: '529.982.247-25' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\(11\)/i), {
      target: { value: '(11) 99999-8888' },
    });
    fireEvent.change(screen.getByPlaceholderText(/usuario@dominio\.com/i), {
      target: { value: 'joao@empresa.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Mínimo 6 dígitos/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Repita a senha/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Criar Minha Conta/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/signup/customer', {
        name: 'João Silva',
        email: 'joao@empresa.com',
        password: '123456',
        cpf: '52998224725',
        phone: '(11) 99999-8888',
      });
    });
  });
});
