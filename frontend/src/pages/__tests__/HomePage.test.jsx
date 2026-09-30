import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('HomePage - Painel Operacional', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithUser = (user) => {
    return render(
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated: true,
          isLoading: false,
          logout: vi.fn(),
        }}
      >
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('exibe pedidos designados e dados operacionais para o entregador', async () => {
    const courierUser = {
      id: 'usr-courier-1',
      name: 'Carlos Santos',
      email: 'carlos@navrotas.com',
      role: 'entregador',
    };

    const mockCourierProfile = {
      id: 5,
      usuario_id: 'usr-courier-1',
      nome: 'Carlos Santos',
      placa: 'BRA2E19',
      veiculo_descricao: 'Furgão Utilitário com Tanque Homologado',
      status: 'EM_ROTA',
      telefone: '(11) 98765-4321',
    };

    const mockAssignedOrders = [
      {
        id: 101,
        status: 'EM_TRANSPORTE',
        endereco_entrega: 'Marina da Glória, Pier B',
        ponto_referencia: 'Vaga 14 - Lancha Marlin',
        instrucoes_adicionais: 'Atracar na vaga 14 e contatar rádio canal 16',
        valor_total: 1200.0,
        destino_latitude: -22.9208,
        destino_longitude: -43.1729,
        entregador_id: 5,
        created_at: '2026-09-28T10:00:00Z',
      },
      {
        id: 99,
        status: 'CONCLUIDO',
        endereco_entrega: 'Iate Clube do Rio',
        valor_total: 800.0,
        entregador_id: 5,
        created_at: '2026-09-28T08:00:00Z',
      },
    ];

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/couriers/me') {
        return Promise.resolve({ data: mockCourierProfile });
      }
      if (url === '/api/v1/orders' || url === '/orders') {
        return Promise.resolve({ data: mockAssignedOrders });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithUser(courierUser);

    await waitFor(() => {
      expect(screen.getByText('Suas Entregas Designadas')).toBeInTheDocument();
      expect(screen.getByText('Placa: BRA2E19')).toBeInTheDocument();
      expect(screen.getByText('Furgão Utilitário com Tanque Homologado')).toBeInTheDocument();
      expect(screen.getByText('Pedido #101')).toBeInTheDocument();
      expect(screen.getByText('Marina da Glória, Pier B')).toBeInTheDocument();
      expect(screen.getByText(/Atracar na vaga 14 e contatar rádio canal 16/)).toBeInTheDocument();
    });

    // Deve exibir botão de concluir entrega para o pedido em transporte
    expect(screen.getByRole('button', { name: /Concluir Entrega/i })).toBeInTheDocument();
  });

  it('permite que o entregador conclua a entrega de um pedido com sucesso', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const courierUser = {
      id: 'usr-courier-1',
      name: 'Carlos Santos',
      email: 'carlos@navrotas.com',
      role: 'entregador',
    };

    const mockCourierProfile = {
      id: 5,
      usuario_id: 'usr-courier-1',
      nome: 'Carlos Santos',
      placa: 'BRA2E19',
      status: 'EM_ROTA',
    };

    const mockAssignedOrders = [
      {
        id: 101,
        status: 'EM_TRANSPORTE',
        endereco_entrega: 'Marina da Glória, Pier B',
        valor_total: 1200.0,
        entregador_id: 5,
      },
    ];

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/couriers/me') {
        return Promise.resolve({ data: mockCourierProfile });
      }
      if (url === '/api/v1/orders' || url === '/orders') {
        return Promise.resolve({ data: mockAssignedOrders });
      }
      return Promise.resolve({ data: [] });
    });

    api.patch.mockResolvedValueOnce({
      data: { id: 101, status: 'CONCLUIDO', entregador_id: 5 },
    });

    renderWithUser(courierUser);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Concluir Entrega/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Concluir Entrega/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/orders/101/status', {
        status: 'CONCLUIDO',
      });
      expect(screen.getByText(/Entrega do Pedido #101 concluída com sucesso!/i)).toBeInTheDocument();
    });
  });

  it('exibe painel central de governança e atalhos rápidos para admin_geral sem erro de posto vinculado', async () => {
    const generalAdminUser = {
      id: 'usr-admin-1',
      name: 'Super Administrador',
      email: 'admin@navrotas.com',
      role: 'admin_geral',
    };

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations') {
        return Promise.resolve({
          data: [
            { id: 1, nome_fantasia: 'Posto Alpha', ativo: true },
            { id: 2, nome_fantasia: 'Posto Beta', ativo: false },
          ],
        });
      }
      if (url === '/api/v1/stations/audit/price-history') {
        return Promise.resolve({
          data: [{ id: 'audit-1' }, { id: 'audit-2' }, { id: 'audit-3' }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithUser(generalAdminUser);

    await waitFor(() => {
      expect(screen.getByText('Centro de Controle do Administrador Geral')).toBeInTheDocument();
      expect(screen.getAllByText('Postos Cadastrados').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Vínculos de Gestores').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Gestão de Usuários').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Auditoria de Preços').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Novo Abastecimento').length).toBeGreaterThanOrEqual(1);
    });

    // Não deve exibir o aviso enganoso de posto pendente
    expect(screen.queryByText('Vínculo de Posto Pendente')).not.toBeInTheDocument();
    expect(screen.queryByText(/Nenhum posto de abastecimento vinculado ao seu perfil/)).not.toBeInTheDocument();
  });
});
