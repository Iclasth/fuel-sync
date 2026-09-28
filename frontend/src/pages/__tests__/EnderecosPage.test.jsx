import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { EnderecosPage } from '../EnderecosPage';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('EnderecosPage', () => {
  const mockUser = {
    id: 'usr-1',
    email: 'cliente@teste.com',
    role: 'cliente',
    name: 'Cliente Teste',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={{ user: mockUser, isAuthenticated: true, isLoading: false }}>
        <MemoryRouter>
          <EnderecosPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('carrega e lista os pontos de entrega salvos da API', async () => {
    const mockLocations = [
      {
        id: 1,
        apelido: 'Píer Glória Vaga 14',
        tipo_local: 'MARINA',
        endereco: 'Marina da Glória',
        ponto_referencia: 'Trapiche B',
        latitude: -22.92,
        longitude: -43.17,
      },
    ];

    api.get.mockResolvedValueOnce({ data: mockLocations });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Píer Glória Vaga 14')).toBeInTheDocument();
    });
    expect(screen.getByText('Marina da Glória')).toBeInTheDocument();
  });

  it('permite adicionar novo ponto de entrega via POST na API', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    api.post.mockResolvedValueOnce({
      data: {
        id: 2,
        apelido: 'Poita Angra',
        tipo_local: 'MARINA',
        endereco: 'Canal de Angra',
        latitude: -23.0,
        longitude: -44.3,
      },
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Ex: Marina Santos/i), {
      target: { value: 'Poita Angra' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Av\. Beira Mar/i), {
      target: { value: 'Canal de Angra' },
    });

    const submitBtn = screen.getByRole('button', { name: /Salvar Ponto de Entrega/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/v1/customers/locations', expect.objectContaining({
        apelido: 'Poita Angra',
        endereco: 'Canal de Angra',
      }));
    });
  });

  it('permite remover ponto de entrega via DELETE na API', async () => {
    const mockLocations = [
      {
        id: 5,
        apelido: 'Ponto Antigo',
        tipo_local: 'MARINA',
        endereco: 'Rua do Píer, 1',
        latitude: -22.92,
        longitude: -43.17,
      },
    ];

    api.get.mockResolvedValueOnce({ data: mockLocations });
    api.delete.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Ponto Antigo')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Remover endereço Ponto Antigo/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/v1/customers/locations/5');
      expect(screen.queryByText('Ponto Antigo')).not.toBeInTheDocument();
    });
  });
});
