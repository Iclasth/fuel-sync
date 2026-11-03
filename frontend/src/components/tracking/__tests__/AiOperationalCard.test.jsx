import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AiOperationalCard from '../AiOperationalCard';

describe('AiOperationalCard Component', () => {
  it('exibe estado de carregamento quando isLoading for true', () => {
    render(
      <AiOperationalCard
        isLoading={true}
        status="EM_TRANSPORTE"
      />
    );

    expect(screen.getByText(/Calculando telemetria e estimativa de entrega/i)).toBeInTheDocument();
  });

  it('renderiza ESTIMATIVA DE CONFIRMAÇÃO e badge de fila quando status for PENDENTE', () => {
    const aiPrediction = {
      total_minutos: 12,
      fila_pedidos: 3,
      mensagem: 'Aguardando validação do operador do posto.',
    };

    render(
      <AiOperationalCard
        aiPrediction={aiPrediction}
        status="PENDENTE"
      />
    );

    expect(screen.getByText('ESTIMATIVA DE CONFIRMAÇÃO')).toBeInTheDocument();
    expect(screen.getByText('3 na fila de análise')).toBeInTheDocument();
    expect(screen.getByText(/Confirmação estimada: ~12 minutos/i)).toBeInTheDocument();
    expect(screen.getByText('Aguardando validação do operador do posto.')).toBeInTheDocument();
  });

  it('renderiza ESTIMATIVA DE ENTREGA e janela de entrega amigável', () => {
    const aiPrediction = {
      total_minutos: 35,
      confianca: 92,
      mensagem: 'Rota calculada sem anomalias no tráfego marítimo.',
      janela_entrega: {
        formato_amigavel: '15:10 - 15:30',
      },
    };

    render(
      <AiOperationalCard
        aiPrediction={aiPrediction}
        status="EM_PREPARACAO"
      />
    );

    expect(screen.getByText('ESTIMATIVA DE ENTREGA')).toBeInTheDocument();
    expect(screen.getByText(/Chegada estimada: ~35 minutos/i)).toBeInTheDocument();
    expect(screen.getByText('Janela Prevista: 15:10 - 15:30')).toBeInTheDocument();
    expect(screen.getByText('Confiabilidade 92%')).toBeInTheDocument();
    expect(screen.queryByText(/Precisão/i)).not.toBeInTheDocument();
  });

  it('exibe decomposição visual dos fatores de tempo (fila, preparo e trânsito)', () => {
    const aiPrediction = {
      total_minutos: 30,
      fatores_tempo: {
        fila_minutos: 4,
        preparo_minutos: 12,
        transito_minutos: 14,
      },
    };

    render(
      <AiOperationalCard
        aiPrediction={aiPrediction}
        status="EM_TRANSPORTE"
      />
    );

    expect(screen.getByText('Composição do Tempo Estimado')).toBeInTheDocument();
    expect(screen.getByText('4 min')).toBeInTheDocument();
    expect(screen.getByText('12 min')).toBeInTheDocument();
    expect(screen.getByText('14 min')).toBeInTheDocument();
  });

  it('renderiza chips de condições operacionais e alerta de risco de atraso', () => {
    const aiPrediction = {
      total_minutos: 45,
      risco_atraso: true,
      motivo_risco: 'Maré desfavorável e fila na atracação secundária',
      condicoes_operacionais: {
        nivel_trafego: 'CONGESTIONADO_OU_ADVERSO',
        complexidade_acesso: 'ALTA',
      },
    };

    render(
      <AiOperationalCard
        aiPrediction={aiPrediction}
        status="EM_TRANSPORTE"
      />
    );

    expect(screen.getByText('Tráfego Adverso')).toBeInTheDocument();
    expect(screen.getByText('Acesso Complexo')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Atenção: Maré desfavorável e fila na atracação secundária'
    );
  });
});
