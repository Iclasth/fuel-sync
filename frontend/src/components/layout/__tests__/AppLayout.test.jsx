import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from '../AppLayout';
import { AuthContext } from '../../../context/AuthContext';

describe('AppLayout Sidebar Navigation', () => {
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
          <AppLayout>
            <div data-testid="page-content">Conteúdo da Página</div>
          </AppLayout>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('oculta "Abastecimento" e "Endereços" e exibe "Minhas Entregas" para o entregador', () => {
    const courierUser = {
      id: 'usr-courier-1',
      name: 'Carlos Entregador',
      email: 'carlos@navrotas.com',
      role: 'entregador',
    };

    renderWithUser(courierUser);

    // Deve exibir itens do entregador
    expect(screen.getByText('Minhas Entregas')).toBeInTheDocument();
    expect(screen.getByText('Rastreamento')).toBeInTheDocument();

    // NÃO deve exibir itens de compra ou cadastro de endereços do cliente
    expect(screen.queryByText('Abastecimento')).not.toBeInTheDocument();
    expect(screen.queryByText('Endereços')).not.toBeInTheDocument();
    expect(screen.queryByText('Tabela de Preços')).not.toBeInTheDocument();
  });

  it('exibe "Abastecimento" e "Endereços" para o cliente B2C', () => {
    const customerUser = {
      id: 'usr-cliente-1',
      name: 'Cliente Civil',
      email: 'cliente@teste.com',
      role: 'cliente',
    };

    renderWithUser(customerUser);

    expect(screen.getByText('Abastecimento')).toBeInTheDocument();
    expect(screen.getByText('Endereços')).toBeInTheDocument();
    expect(screen.getByText('Meus Pedidos')).toBeInTheDocument();

    // Não exibe itens de gestão de posto
    expect(screen.queryByText('Minhas Entregas')).not.toBeInTheDocument();
    expect(screen.queryByText('Tabela de Preços')).not.toBeInTheDocument();
  });

  it('exibe itens de gestão do posto para posto_admin', () => {
    const stationAdminUser = {
      id: 'usr-admin-1',
      name: 'Gestor Posto',
      email: 'admin@posto.com',
      role: 'posto_admin',
    };

    renderWithUser(stationAdminUser);

    expect(screen.getByText('Meu Posto')).toBeInTheDocument();
    expect(screen.getByText('Tabela de Preços')).toBeInTheDocument();
    expect(screen.getByText('Fila de Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Entregadores')).toBeInTheDocument();

    expect(screen.queryByText('Abastecimento')).not.toBeInTheDocument();
    expect(screen.queryByText('Minhas Entregas')).not.toBeInTheDocument();
  });
});
