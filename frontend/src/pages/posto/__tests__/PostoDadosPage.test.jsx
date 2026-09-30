import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import PostoDadosPage from '../PostoDadosPage';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('PostoDadosPage', () => {
  const mockUser = {
    id: 'usr-admin-1',
    email: 'admin@posto.com',
    role: 'posto_admin',
    name: 'Gestor Posto',
  };

  const mockStation = {
    id: 1,
    nome_fantasia: 'Auto Posto Náutico Imperial',
    razao_social: 'Auto Posto Imperial Ltda',
    cnpj: '12.345.678/0001-99',
    telefone: '(21) 3333-4444',
    endereco: 'Av. Infante Dom Henrique, s/n - Glória',
    latitude: -22.9208,
    longitude: -43.1729,
    tempo_medio_preparo_minutos: 15,
    ativo: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true, isLoading: false }}>
        <MemoryRouter>
          <PostoDadosPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('carrega e preenche os dados cadastrais do posto a partir de /stations/me', async () => {
    api.get.mockResolvedValueOnce({ data: mockStation });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Auto Posto Náutico Imperial')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Auto Posto Imperial Ltda')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12.345.678/0001-99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(21) 3333-4444')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Av. Infante Dom Henrique, s/n - Glória')).toBeInTheDocument();
  });

  it('permite alterar campos e salvar enviando PUT para a API', async () => {
    api.get.mockResolvedValueOnce({ data: mockStation });
    api.put.mockResolvedValueOnce({
      data: {
        ...mockStation,
        nome_fantasia: 'Auto Posto Náutico Imperial Renovado',
        tempo_medio_preparo_minutos: 20,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Auto Posto Náutico Imperial')).toBeInTheDocument();
    });

    const nomeInput = screen.getByLabelText(/Nome Fantasia \*/i);
    fireEvent.change(nomeInput, { target: { value: 'Auto Posto Náutico Imperial Renovado' } });

    const prepInput = screen.getByLabelText(/Tempo Médio de Preparo/i);
    fireEvent.change(prepInput, { target: { value: '20' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar Dados do Posto/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/api/v1/stations/1',
        expect.objectContaining({
          nome_fantasia: 'Auto Posto Náutico Imperial Renovado',
          tempo_medio_preparo_minutos: 20,
        })
      );
      expect(
        screen.getByText(/Informações do posto atualizadas com sucesso/i)
      ).toBeInTheDocument();
    });
  });

  it('exibe mensagem informativa caso o usuário não tenha posto vinculado (404)', async () => {
    api.get.mockRejectedValueOnce({
      response: { status: 404, data: { error: 'Nenhum posto vinculado' } },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nenhum Posto Vinculado')).toBeInTheDocument();
      expect(
        screen.getByText(/Entre em contato com um/i)
      ).toBeInTheDocument();
    });
  });
});
