import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import AdminVinculosPage from '../AdminVinculosPage';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('AdminVinculosPage', () => {
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
          <AdminVinculosPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  const mockPostos = [
    {
      id: 1,
      nome_fantasia: 'Posto Baía de Guanabara',
      cnpj: '11.222.333/0001-44',
      endereco: 'Pier Mauá, Vaga 12',
    },
    {
      id: 2,
      nome_fantasia: 'Marina da Glória Fuel',
      cnpj: '22.333.444/0001-55',
      endereco: 'Aterro do Flamengo, Pier B',
    },
  ];

  const mockGestores = [
    {
      id: 'usr-gestor-1',
      nome: 'Ricardo Silva',
      email: 'ricardo@posto.com',
      role: 'posto_admin',
    },
    {
      id: 'usr-gestor-2',
      nome: 'Fernanda Oliveira',
      email: 'fernanda@posto.com',
      role: 'posto_admin',
    },
  ];

  const mockAdminsPosto = [
    {
      id: 'link-1',
      posto_id: 1,
      user_id: 'usr-gestor-1',
      criado_em: '2026-09-20T10:00:00Z',
      usuario: {
        id: 'usr-gestor-1',
        nome: 'Ricardo Silva',
        email: 'ricardo@posto.com',
      },
    },
  ];

  it('renderiza postos, carrega lista de gestores no select e exibe administradores vinculados', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations') {
        return Promise.resolve({ data: mockPostos });
      }
      if (url === '/api/v1/users?role=posto_admin') {
        return Promise.resolve({ data: mockGestores });
      }
      if (url === '/api/v1/stations/1/admins') {
        return Promise.resolve({ data: mockAdminsPosto });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Vínculos.*Postos/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Posto Baía de Guanabara/).length).toBeGreaterThanOrEqual(1);
    });

    // Verifica se os gestores foram carregados no select
    await waitFor(() => {
      expect(screen.getByText(/Ricardo Silva — ricardo@posto.com/)).toBeInTheDocument();
      expect(screen.getByText(/Fernanda Oliveira — fernanda@posto.com/)).toBeInTheDocument();
    });

    // Verifica exibição do gestor já vinculado com nome e email na tabela
    expect(screen.getAllByText('Ricardo Silva').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ricardo@posto.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Autorizado')).toBeInTheDocument();
  });

  it('vincula um gestor selecionado na lista suspensa sem necessidade de colar UUID', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations') {
        return Promise.resolve({ data: mockPostos });
      }
      if (url === '/api/v1/users?role=posto_admin') {
        return Promise.resolve({ data: mockGestores });
      }
      if (url === '/api/v1/stations/1/admins') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    api.post.mockResolvedValueOnce({
      data: { id: 'new-link', posto_id: 1, user_id: 'usr-gestor-2' },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Fernanda Oliveira — fernanda@posto.com/)).toBeInTheDocument();
    });

    // Seleciona o gestor no dropdown
    const selectGestor = screen.getByDisplayValue('Selecione um gestor na lista...');
    fireEvent.change(selectGestor, { target: { value: 'usr-gestor-2' } });

    // Clica no botão de vincular
    const botaoVincular = screen.getByRole('button', { name: /Conceder Acesso ao Posto/i });
    expect(botaoVincular).not.toBeDisabled();
    fireEvent.click(botaoVincular);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/stations/1/admins', {
        user_id: 'usr-gestor-2',
      });
      expect(
        screen.getByText('Administrador vinculado com sucesso ao posto físico!')
      ).toBeInTheDocument();
    });
  });

  it('exibe aviso e atalho para Gestão de Usuários quando não houver gestores cadastrados', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations') {
        return Promise.resolve({ data: mockPostos });
      }
      if (url === '/api/v1/users?role=posto_admin') {
        return Promise.resolve({ data: [] }); // Lista vazia de gestores
      }
      if (url === '/api/v1/stations/1/admins') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Nenhum usuário com papel de Administrador de Posto/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Ir para Gestão de Usuários e/i)).toBeInTheDocument();
    });
  });
});
