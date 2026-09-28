import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import PostoCatalogoPage from '../PostoCatalogoPage';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe('PostoCatalogoPage', () => {
  const mockUser = {
    id: 'usr-admin-1',
    email: 'admin@posto.com',
    role: 'posto_admin',
    name: 'Gestor Posto',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    api.get.mockImplementation((url) => {
      if (url === '/api/v1/stations') {
        return Promise.resolve({
          data: [{ id: 1, nome_fantasia: 'Auto Posto Imperial' }],
        });
      }
      if (url === '/api/v1/catalog') {
        return Promise.resolve({
          data: [{ id: 1, nome: 'Gasolina Comum', tipo: 'COMUM' }],
        });
      }
      if (url.includes('/fuels/1/history')) {
        return Promise.resolve({
          data: [
            { id: 'h-1', preco_anterior: 5.5, preco_novo: 5.89, alterado_em: '2026-09-28T10:00:00Z' },
          ],
        });
      }
      if (url.includes('/fuels')) {
        return Promise.resolve({
          data: [
            {
              id: 'sf-1',
              combustivel_id: 1,
              preco_litro: 5.89,
              estoque_litros: 4500,
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
          <PostoCatalogoPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('lista combustíveis cadastrados com preço e estoque', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Gasolina Comum')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5.89')).toBeInTheDocument();
      expect(screen.getByDisplayValue('4500')).toBeInTheDocument();
    });
  });

  it('permite reajustar preço e salvar enviando PUT para a API', async () => {
    api.put.mockResolvedValueOnce({ data: { success: true } });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('5.89')).toBeInTheDocument();
    });

    const precoInput = screen.getByDisplayValue('5.89');
    fireEvent.change(precoInput, { target: { value: '6.15' } });

    const salvarBtn = screen.getByRole('button', { name: /Salvar/i });
    fireEvent.click(salvarBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/api/v1/stations/1/fuels/1',
        expect.objectContaining({
          preco_litro: 6.15,
        })
      );
    });
  });

  it('abre o modal de histórico de reajustes auditado', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Gasolina Comum')).toBeInTheDocument();
    });

    const historyBtn = screen.getByTitle(/Histórico de Reajustes/i);
    fireEvent.click(historyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Histórico de Auditoria de Preço/i)).toBeInTheDocument();
      expect(screen.getByText(/trg_audit_preco_combustivel/i)).toBeInTheDocument();
    });
  });
});
