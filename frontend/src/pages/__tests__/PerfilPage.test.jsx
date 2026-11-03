import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PerfilPage } from '../PerfilPage';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('PerfilPage', () => {
  const mockUser = {
    id: 'usr-123',
    name: 'Capitão Gancho',
    email: 'gancho@marina.com',
    role: 'cliente',
    metadata: {
      phone: '11999998888',
      endereco_padrao: 'Marina da Glória, Vaga 10',
      ponto_referencia_padrao: 'Píer C',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (user = mockUser) => {
    return render(
      <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), isLoading: false }}>
        <MemoryRouter>
          <PerfilPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('preenche o formulário com os dados cadastrais do usuário autenticado', () => {
    renderComponent();

    expect(screen.getByDisplayValue('Capitão Gancho')).toBeInTheDocument();
    expect(screen.getByDisplayValue('gancho@marina.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('11999998888')).toBeInTheDocument();
  });

  it('exibe mensagem defensiva de erro caso user.id não esteja disponível no submit (FE-02)', async () => {
    renderComponent(null);

    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    fireEvent.change(nomeInput, { target: { value: 'Cliente Sem Id' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Usuário não autenticado ou identificador inválido/i)).toBeInTheDocument();
    });
    expect(api.put).not.toHaveBeenCalled();
  });

  it('exibe mensagem de sucesso ao atualizar os dados cadastrais via API com sucesso', async () => {
    api.put.mockResolvedValueOnce({ data: { success: true } });
    renderComponent();

    const nomeInput = screen.getByDisplayValue('Capitão Gancho');
    fireEvent.change(nomeInput, { target: { value: 'Capitão Gancho Atualizado' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/customers/usr-123', expect.objectContaining({
        name: 'Capitão Gancho Atualizado',
      }));
      expect(screen.getByText(/Dados cadastrais atualizados com sucesso!/i)).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro e não emite mensagem de sucesso quando a API falha (FE-01)', async () => {
    api.put.mockRejectedValueOnce({
      response: {
        data: { error: 'Falha interna ao atualizar cadastro do cliente' },
      },
    });

    renderComponent();

    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Falha interna ao atualizar cadastro do cliente/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Dados cadastrais atualizados com sucesso!/i)).not.toBeInTheDocument();
  });
});
