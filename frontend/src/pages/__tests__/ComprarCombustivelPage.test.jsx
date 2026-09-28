import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ComprarCombustivelPage from '../ComprarCombustivelPage';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('ComprarCombustivelPage', () => {
  const mockUser = {
    id: 'usr-1',
    email: 'cliente@teste.com',
    role: 'cliente',
    name: 'Cliente Teste',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations') {
        return Promise.resolve({
          data: [
            { id: 1, nome_fantasia: 'Auto Posto Imperial', endereco: 'Av. Brasil, 100' },
          ],
        });
      }
      if (url.includes('/fuels')) {
        return Promise.resolve({
          data: [
            {
              id: 'sf-1',
              combustivel_id: 1,
              preco_litro: 6.0,
              disponivel: true,
              combustiveis: { nome: 'Gasolina Comum' },
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            logout: vi.fn(),
          }}
        >
          <ComprarCombustivelPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('renderiza o formulário de compra e carrega postos e combustíveis', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: /Solicitação de Abastecimento/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Gasolina Comum')).toBeInTheDocument();
      expect(screen.getByText(/R\$ 6.00 \/ L/i)).toBeInTheDocument();
    });
  });

  it('calcula o valor total estimado em tempo real ao alterar litros', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Gasolina Comum')).toBeInTheDocument();
    });

    const litrosInput = screen.getByPlaceholderText('Ex: 500');
    fireEvent.change(litrosInput, { target: { value: '100' } });

    await waitFor(() => {
      // 100 L * R$ 6.00 = R$ 600,00
      expect(screen.getByText(/600,00/i)).toBeInTheDocument();
    });
  });

  it('submete o pedido via POST /api/v1/orders com sucesso', async () => {
    api.post.mockResolvedValueOnce({
      data: { id: 101, status: 'PENDENTE' },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Gasolina Comum')).toBeInTheDocument();
    });

    const litrosInput = screen.getByPlaceholderText('Ex: 500');
    fireEvent.change(litrosInput, { target: { value: '250' } });

    // Preenche endereço caso precise
    const submitBtn = screen.getByRole('button', { name: /Confirmar Solicitação de Abastecimento/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/orders',
        expect.objectContaining({
          posto_id: 1,
          itens: [
            expect.objectContaining({
              combustivel_id: 1,
              quantidade_litros: 250,
              valor_unitario: 6.0,
            }),
          ],
        })
      );
    });
  });
});
