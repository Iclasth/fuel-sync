import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

  it('mantém latitude e longitude durante digitação e desabilita botão durante envio (FE-05 & FE-06)', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    let resolvePost;
    api.post.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePost = resolve;
    }));

    renderComponent();

    const apelidoInput = screen.getByPlaceholderText(/Ex: Marina Santos/i);
    const enderecoInput = screen.getByPlaceholderText(/Av\. Beira Mar/i);
    const latInput = screen.getByPlaceholderText('-23.987654');
    const lonInput = screen.getByPlaceholderText('-46.302145');

    fireEvent.change(apelidoInput, { target: { value: 'Píer Especial' } });
    fireEvent.change(enderecoInput, { target: { value: 'Rua das Palmeiras, 10' } });

    fireEvent.change(latInput, { target: { value: '-22.500000' } });
    fireEvent.change(lonInput, { target: { value: '-43.123456' } });

    expect(latInput.value).toBe('-22.500000');
    expect(lonInput.value).toBe('-43.123456');

    const submitBtn = screen.getByRole('button', { name: /Salvar Ponto de Entrega/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Salvando\.\.\./i })).toBeDisabled();
    });

    await act(async () => {
      resolvePost({
        data: {
          id: 99,
          apelido: 'Píer Especial',
          tipo_local: 'MARINA',
          endereco: 'Rua das Palmeiras, 10',
          latitude: -22.5,
          longitude: -43.123456,
        },
      });
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/v1/customers/locations',
        expect.objectContaining({
          latitude: -22.5,
          longitude: -43.123456,
        })
      );
      expect(screen.getByRole('button', { name: /Salvar Ponto de Entrega/i })).not.toBeDisabled();
    });
  });
});
