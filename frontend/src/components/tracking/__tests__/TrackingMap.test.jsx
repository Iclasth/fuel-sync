import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TrackingMap from '../TrackingMap';
import L from 'leaflet';

describe('TrackingMap Component', () => {
  const baseOrder = {
    id: 101,
    status: 'EM_PREPARACAO',
    endereco_entrega: 'Marina da Glória, Vaga 12',
    destino_latitude: -22.919,
    destino_longitude: -43.170,
    posto: {
      id: 1,
      nome_fantasia: 'Posto Náutico Mar Azul',
      latitude: -22.912,
      longitude: -43.178,
    },
  };

  const baseAiPrediction = {
    distancia_km: 1.8,
    total_minutos: 25,
    fonte_roteamento: 'OSRM',
    fatores_tempo: {
      fila_minutos: 5,
      preparo_minutos: 10,
      transito_minutos: 10,
    },
    rota_geometria: {
      type: 'LineString',
      coordinates: [
        [-43.178, -22.912],
        [-43.175, -22.915],
        [-43.170, -22.919],
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza fallback gracioso quando coordenadas geográficas forem inválidas ou ausentes', () => {
    render(
      <TrackingMap
        order={{ ...baseOrder, destino_latitude: null, destino_longitude: null }}
        station={null}
        destination={null}
      />
    );

    expect(
      screen.getByText('Mapa de rastreamento temporariamente indisponível')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Não foi possível georreferenciar o posto de origem/i)
    ).toBeInTheDocument();
    expect(L.map).not.toHaveBeenCalled();
  });

  it('inicializa o mapa Leaflet com tiles OpenStreetMap e marcadores de origem e destino', () => {
    render(
      <TrackingMap
        order={baseOrder}
        aiPrediction={baseAiPrediction}
      />
    );

    expect(L.map).toHaveBeenCalledTimes(1);
    expect(L.tileLayer).toHaveBeenCalledWith(
      expect.stringContaining('tile.openstreetmap.org'),
      expect.objectContaining({ maxZoom: 19 })
    );
    // Marcador do posto e marcador do destino
    expect(L.marker).toHaveBeenCalledWith(
      [-22.912, -43.178],
      expect.objectContaining({ icon: expect.any(Object) })
    );
    expect(L.marker).toHaveBeenCalledWith(
      [-22.919, -43.170],
      expect.objectContaining({ icon: expect.any(Object) })
    );
    // Linha de contorno branco e rota OSRM
    expect(L.polyline).toHaveBeenCalledTimes(2);
  });

  it('exibe badge "Rota Real OSRM" e métricas de distância e deslocamento', () => {
    render(
      <TrackingMap
        order={baseOrder}
        aiPrediction={baseAiPrediction}
      />
    );

    expect(screen.getByText('Rota Real OSRM')).toBeInTheDocument();
    expect(screen.getByText('1.8 km')).toBeInTheDocument();
    expect(screen.getByText('~10 min')).toBeInTheDocument();
  });

  it('renderiza estilo tracejado e badge "Projeção Direta" quando fonte for HAVERSINE_FALLBACK', () => {
    const fallbackPred = {
      ...baseAiPrediction,
      fonte_roteamento: 'HAVERSINE_FALLBACK',
      rota_geometria: {
        type: 'LineString',
        coordinates: [
          [-43.178, -22.912],
          [-43.170, -22.919],
        ],
      },
    };

    render(
      <TrackingMap
        order={baseOrder}
        aiPrediction={fallbackPred}
      />
    );

    expect(screen.getByText('Projeção Direta')).toBeInTheDocument();
    expect(L.polyline).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ dashArray: '6, 6' })
    );
  });

  it('adiciona marcador pulsante do entregador quando status for EM_TRANSPORTE', () => {
    const transportOrder = {
      ...baseOrder,
      status: 'EM_TRANSPORTE',
      entregador: {
        id: 7,
        nome: 'Marcos Marinheiro',
        veiculo_descricao: 'Lancha de Apoio Náutico',
      },
    };

    render(
      <TrackingMap
        order={transportOrder}
        aiPrediction={baseAiPrediction}
      />
    );

    // Posto + Destino + Entregador = 3 markers
    expect(L.marker).toHaveBeenCalledTimes(3);
  });

  it('permite recentralizar o mapa acionando o botão Recentralizar', () => {
    render(
      <TrackingMap
        order={baseOrder}
        aiPrediction={baseAiPrediction}
      />
    );

    const btn = screen.getByRole('button', { name: /Recentralizar/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);

    // fitBounds chamado inicialmente + 1 vez no clique
    const mockMapInstance = L.map.mock.results[0].value;
    expect(mockMapInstance.fitBounds).toHaveBeenCalled();
  });

  it('destrói a instância do mapa no cleanup do unmount para evitar vazamento de memória', () => {
    const { unmount } = render(
      <TrackingMap
        order={baseOrder}
        aiPrediction={baseAiPrediction}
      />
    );

    const mockMapInstance = L.map.mock.results[0].value;
    unmount();
    expect(mockMapInstance.remove).toHaveBeenCalled();
  });
});
