import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import AdminUsuariosPage from '../AdminUsuariosPage';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('AdminUsuariosPage', () => {
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
          <AdminUsuariosPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  const mockUsuarios = [
    {
      id: 'usr-admin-1',
      nome: 'Super Administrador',
      email: 'admin@navrotas.com',
      role: 'admin_geral',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'usr-gestor-1',
      nome: 'Ricardo Gestor',
      email: 'ricardo@posto.com',
      role: 'posto_admin',
      created_at: '2026-09-02T11:00:00Z',
    },
    {
      id: 'usr-entregador-1',
      nome: 'Carlos Santos',
      email: 'carlos@entregas.com',
      role: 'entregador',
      created_at: '2026-09-03T12:00:00Z',
    },
    {
      id: 'usr-cliente-1',
      nome: 'Mariana Cliente',
      email: 'mariana@gmail.com',
      role: 'cliente',
      created_at: '2026-09-04T13:00:00Z',
    },
  ];

  it('renderiza cabeçalho, KPIs e tabela com listagem de usuários e papéis', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsuarios });

    renderComponent();

    expect(screen.getByText('Carregando usuários da plataforma...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Gestão de Usuários & Papéis/i)).toBeInTheDocument();
      expect(screen.getByText('Ricardo Gestor')).toBeInTheDocument();
      expect(screen.getByText('Carlos Santos')).toBeInTheDocument();
      expect(screen.getByText('Mariana Cliente')).toBeInTheDocument();
    });

    // Verifica badges de papel
    expect(screen.getAllByText('Administrador Geral').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gestor de Posto').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Entregador').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Cliente/i).length).toBeGreaterThanOrEqual(1);

    // Identificador "(Você)" no usuário logado
    expect(screen.getByText('Você')).toBeInTheDocument();
  });

  it('filtra usuários reativamente por busca textual', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsuarios });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Ricardo Gestor')).toBeInTheDocument();
    });

    const inputBusca = screen.getByPlaceholderText(/Buscar por nome, e-mail ou UUID/i);
    fireEvent.change(inputBusca, { target: { value: 'Mariana' } });

    expect(screen.getByText('Mariana Cliente')).toBeInTheDocument();
    expect(screen.queryByText('Ricardo Gestor')).not.toBeInTheDocument();
    expect(screen.queryByText('Carlos Santos')).not.toBeInTheDocument();
  });

  it('filtra usuários por role selecionada', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsuarios });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Ricardo Gestor')).toBeInTheDocument();
    });

    const selectFiltro = screen.getByDisplayValue('Todos os Papéis');
    fireEvent.change(selectFiltro, { target: { value: 'posto_admin' } });

    expect(screen.getByText('Ricardo Gestor')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Santos')).not.toBeInTheDocument();
    expect(screen.queryByText('Mariana Cliente')).not.toBeInTheDocument();
  });

  it('permite abrir o modal e alterar o papel de um usuário', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsuarios });
    api.patch.mockResolvedValueOnce({
      data: { ...mockUsuarios[3], role: 'posto_admin' },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Mariana Cliente')).toBeInTheDocument();
    });

    // Procura todos os botões de alterar papel (o do admin logado está desabilitado)
    const botoesAlterar = screen.getAllByRole('button', { name: /Alterar Papel/i });
    // Clica no botão da Mariana Cliente (último botão)
    const botaoMariana = botoesAlterar[botoesAlterar.length - 1];
    fireEvent.click(botaoMariana);

    // Modal deve estar visível
    expect(screen.getByText('Alterar Papel de Acesso')).toBeInTheDocument();

    // Seleciona nova role posto_admin
    const selectsNoModal = screen.getAllByRole('combobox');
    const selectModalRole = selectsNoModal[selectsNoModal.length - 1];
    fireEvent.change(selectModalRole, { target: { value: 'posto_admin' } });

    // Submete formulário
    const botaoConfirmar = screen.getByRole('button', { name: /Confirmar Alteração/i });
    fireEvent.click(botaoConfirmar);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/v1/users/usr-cliente-1/role', {
        role: 'posto_admin',
      });
      expect(
        screen.getByText(/Papel do usuário Mariana Cliente atualizado com sucesso/i)
      ).toBeInTheDocument();
    });
  });

  it('desabilita alteração de papel para o próprio usuário logado', async () => {
    api.get.mockResolvedValueOnce({ data: mockUsuarios });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Super Administrador')).toBeInTheDocument();
    });

    const botoes = screen.getAllByRole('button', { name: /Alterar Papel/i });
    const botaoSelf = botoes[0];

    expect(botaoSelf).toBeDisabled();
    expect(botaoSelf).toHaveAttribute('title', 'Você não pode alterar seu próprio papel');
  });
});
