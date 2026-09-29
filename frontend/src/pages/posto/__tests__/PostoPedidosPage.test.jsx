import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import PostoPedidosPage from '../PostoPedidosPage';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('PostoPedidosPage', () => {
  const mockUser = {
    id: 'usr-admin-1',
    email: 'admin@posto.com',
    role: 'posto_admin',
    name: 'Gestor Posto',
  };

  const mockOrders = [
    {
      id: 101,
      status: 'EM_PREPARACAO',
      endereco_entrega: 'Marina da Glória, Pier B',
      ponto_referencia: 'Vaga 14',
      valor_total: 650.0,
      created_at: '2026-09-28T10:00:00Z',
      entregador_id: null,
    },
    {
      id: 102,
      status: 'EM_TRANSPORTE',
      endereco_entrega: 'Iate Clube, Cais Principal',
      ponto_referencia: 'Vaga 02',
      valor_total: 1200.0,
      created_at: '2026-09-28T11:00:00Z',
      entregador_id: 1,
      entregador: {
        id: 1,
        nome: 'Carlos Santos',
        placa: 'BRA2E19',
      },
    },
  ];

  const mockCouriers = [
    {
      id: 1,
      nome: 'Carlos Santos',
      placa: 'BRA2E19',
      status: 'DISPONIVEL',
    },
    {
      id: 2,
      nome: 'Mariana Lima',
      placa: 'RIO1A23',
      status: 'DISPONIVEL',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true, isLoading: false }}>
        <MemoryRouter>
          <PostoPedidosPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('lista os pedidos e exibe o entregador quando já designado', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/orders') return Promise.resolve({ data: mockOrders });
      if (url === '/api/v1/couriers') return Promise.resolve({ data: mockCouriers });
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
      expect(screen.getByText('#102')).toBeInTheDocument();
    });

    expect(screen.getByText('Carlos Santos')).toBeInTheDocument();
  });

  it('abre modal de despacho ao clicar em "Despachar" e exige seleção de entregador', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/orders') return Promise.resolve({ data: mockOrders });
      if (url === '/api/v1/couriers') return Promise.resolve({ data: mockCouriers });
      return Promise.resolve({ data: [] });
    });

    api.patch.mockResolvedValueOnce({
      data: { ...mockOrders[0], status: 'EM_TRANSPORTE', entregador_id: 2 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
    });

    // Clica em "Despachar" no pedido #101
    const despacharBtn = screen.getByRole('button', { name: /Despachar/i });
    fireEvent.click(despacharBtn);

    // Modal deve abrir
    await waitFor(() => {
      expect(screen.getByText('Despachar Pedido #101')).toBeInTheDocument();
      expect(screen.getByLabelText(/Entregador Responsável \*/i)).toBeInTheDocument();
    });

    // Seleciona o entregador Mariana Lima (id 2)
    const select = screen.getByLabelText(/Entregador Responsável \*/i);
    fireEvent.change(select, { target: { value: '2' } });

    // Clica em "Confirmar Despacho"
    const confirmarBtn = screen.getByRole('button', { name: /Confirmar Despacho/i });
    fireEvent.click(confirmarBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/orders/101/status', {
        status: 'EM_TRANSPORTE',
        entregador_id: 2,
      });
    });
  });
});
