import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import OrderTrackingPage from '../OrderTrackingPage';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('OrderTrackingPage', () => {
  const mockUser = {
    id: 'usr-1',
    email: 'cliente@teste.com',
    role: 'cliente',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/rastreio?orderId=1']}>
        <AuthContext.Provider
          value={{
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            logout: vi.fn(),
          }}
        >
          <OrderTrackingPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('exibe botão de cancelamento quando o pedido estiver com status PENDENTE', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/orders') {
        return Promise.resolve({ data: [{ id: 1, status: 'PENDENTE' }] });
      }
      if (url === '/api/v1/orders/1') {
        return Promise.resolve({
          data: {
            id: 1,
            status: 'PENDENTE',
            endereco_entrega: 'Marina da Glória',
            valor_total: 1200.0,
            itens_pedido: [{ id: 1, combustivel_id: 1, quantidade_litros: 200, valor_unitario: 6.0 }],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/PEDIDO #1/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancelar Pedido/i })).toBeInTheDocument();
    });
  });

  it('bloqueia e esconde o botão de cancelamento quando status já avançou para EM_TRANSPORTE', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/orders') {
        return Promise.resolve({ data: [{ id: 2, status: 'EM_TRANSPORTE' }] });
      }
      if (url === '/api/v1/orders/1') {
        return Promise.resolve({
          data: {
            id: 1,
            status: 'EM_TRANSPORTE',
            endereco_entrega: 'Marina da Glória',
            valor_total: 1200.0,
            itens_pedido: [],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/PEDIDO #1/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Cancelar Pedido/i })).not.toBeInTheDocument();
    });
  });

  it('executa cancelamento chamando POST /api/v1/orders/:id/cancel quando confirmado pelo usuário', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/orders') {
        return Promise.resolve({ data: [{ id: 1, status: 'PENDENTE' }] });
      }
      if (url === '/api/v1/orders/1') {
        return Promise.resolve({
          data: {
            id: 1,
            status: 'PENDENTE',
            endereco_entrega: 'Marina da Glória',
            valor_total: 1200.0,
            itens_pedido: [],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    api.post.mockResolvedValueOnce({ data: { success: true } });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar Pedido/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cancelar Pedido/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/orders/1/cancel',
        expect.objectContaining({ motivo: expect.any(String) })
      );
    });
  });

  it('exibe informações do entregador designado quando disponível', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/orders') {
        return Promise.resolve({ data: [{ id: 1, status: 'EM_TRANSPORTE' }] });
      }
      if (url === '/api/v1/orders/1') {
        return Promise.resolve({
          data: {
            id: 1,
            status: 'EM_TRANSPORTE',
            endereco_entrega: 'Marina da Glória',
            valor_total: 1200.0,
            entregador_id: 5,
            entregador: {
              id: 5,
              nome: 'Carlos Santos (Operador Náutico)',
              telefone: '(11) 98765-4321',
              veiculo_descricao: 'Furgão Utilitário',
              placa: 'BRA2E19',
            },
            itens_pedido: [],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Carlos Santos (Operador Náutico)')).toBeInTheDocument();
      expect(screen.getByText(/BRA2E19/)).toBeInTheDocument();
      expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
    });
  });
});
