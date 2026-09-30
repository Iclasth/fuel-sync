import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import AdminAuditoriaPage from '../AdminAuditoriaPage';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('AdminAuditoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdminUser = {
    id: 'usr-admin-1',
    name: 'Super Administrador',
    email: 'admin@navrotas.com',
    role: 'admin_geral',
  };

  const renderComponent = () => {
    return render(
      <AuthContext.Provider
        value={{
          user: mockAdminUser,
          isAuthenticated: true,
          isLoading: false,
          logout: vi.fn(),
        }}
      >
        <MemoryRouter>
          <AdminAuditoriaPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  const mockAuditData = [
    {
      id: 'audit-1',
      posto_id: 1,
      combustivel_id: 101,
      preco_anterior: '5.50',
      preco_novo: '5.85',
      alterado_em: '2026-09-30T10:00:00Z',
      alterado_por: 'usr-gestor-1',
      posto: { id: 1, nome_fantasia: 'Posto Baía de Guanabara', cnpj: '11.222.333/0001-44' },
      combustivel: { id: 101, nome: 'Gasolina Náutica Podium', unidade_medida: 'LITRO' },
      usuario: { id: 'usr-gestor-1', nome: 'Ricardo Gestor', email: 'ricardo@posto.com', role: 'posto_admin' },
    },
    {
      id: 'audit-2',
      posto_id: 2,
      combustivel_id: 102,
      preco_anterior: '4.80',
      preco_novo: '4.60',
      alterado_em: '2026-09-30T11:30:00Z',
      alterado_por: 'usr-gestor-2',
      posto: { id: 2, nome_fantasia: 'Marina da Glória Fuel', cnpj: '22.333.444/0001-55' },
      combustivel: { id: 102, nome: 'Diesel S10 Marítimo', unidade_medida: 'LITRO' },
      usuario: { id: 'usr-gestor-2', nome: 'Fernanda Admin', email: 'fernanda@posto.com', role: 'posto_admin' },
    },
    {
      id: 'audit-3',
      posto_id: 1,
      combustivel_id: 103,
      preco_anterior: null,
      preco_novo: '6.20',
      alterado_em: '2026-09-30T12:00:00Z',
      alterado_por: null,
      posto: { id: 1, nome_fantasia: 'Posto Baía de Guanabara', cnpj: '11.222.333/0001-44' },
      combustivel: { id: 103, nome: 'Etanol Náutico', unidade_medida: 'LITRO' },
      usuario: null,
    },
  ];

  it('renderiza cabeçalho, KPIs e tabela com histórico auditado de alterações', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations/audit/price-history') {
        return Promise.resolve({ data: mockAuditData });
      }
      if (url === '/api/v1/stations') {
        return Promise.resolve({ data: [{ id: 1, nome_fantasia: 'Posto Baía de Guanabara' }] });
      }
      if (url === '/api/v1/catalog') {
        return Promise.resolve({ data: [{ id: 101, nome: 'Gasolina Náutica Podium' }] });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    expect(screen.getByText('Carregando registros de auditoria...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Auditoria de Preços de Combustível')).toBeInTheDocument();
      expect(screen.getAllByText('Posto Baía de Guanabara').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Marina da Glória Fuel')).toBeInTheDocument();
    });

    // Verifica badges de variação
    expect(screen.getAllByText(/\+ R\$ 0.35/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/- R\$ 0.20/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Primeiro Cadastro').length).toBeGreaterThanOrEqual(1);

    // Verifica exibição do responsável
    expect(screen.getByText('Ricardo Gestor')).toBeInTheDocument();
    expect(screen.getByText('Sistema (Automático)')).toBeInTheDocument();
  });

  it('filtra registros por tipo de evento (AUMENTO)', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations/audit/price-history') {
        return Promise.resolve({ data: mockAuditData });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Posto Baía de Guanabara').length).toBeGreaterThanOrEqual(1);
    });

    // Seleciona filtro AUMENTO
    const selects = screen.getAllByRole('combobox');
    const tipoSelect = selects[2]; // Terceiro select é o tipo de alteração
    fireEvent.change(tipoSelect, { target: { value: 'AUMENTO' } });

    // Apenas Gasolina Náutica Podium (+ R$ 0.35) deve ser exibida
    expect(screen.getByText('Gasolina Náutica Podium')).toBeInTheDocument();
    expect(screen.queryByText('Diesel S10 Marítimo')).not.toBeInTheDocument();
    expect(screen.queryByText('Etanol Náutico')).not.toBeInTheDocument();
  });

  it('exibe estado vazio quando busca textual não encontra resultados', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations/audit/price-history') {
        return Promise.resolve({ data: mockAuditData });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Posto Baía de Guanabara').length).toBeGreaterThanOrEqual(1);
    });

    const inputBusca = screen.getByPlaceholderText(/Buscar por nome do posto/i);
    fireEvent.change(inputBusca, { target: { value: 'TermoInexistente999' } });

    expect(screen.getByText('Nenhum evento de auditoria encontrado')).toBeInTheDocument();
  });
});
