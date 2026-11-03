import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SafetyGuidelinesCard from '../SafetyGuidelinesCard';

describe('SafetyGuidelinesCard Component', () => {
  it('renderiza cabeçalho com Normam-04/DPC para pedidos em Marina', () => {
    const order = { tipo_local: 'MARINA' };

    render(<SafetyGuidelinesCard order={order} />);

    expect(screen.getByText('Checklist de Segurança Operacional')).toBeInTheDocument();
    expect(screen.getByText('Normam-04/DPC — Marítima')).toBeInTheDocument();
    expect(screen.getByText(/Desligar motores, geradores e circuitos elétricos/i)).toBeInTheDocument();
  });

  it('renderiza cabeçalho com NR-20 para abastecimento de Empresa ou Gerador', () => {
    const order = { tipo_local: 'GERADOR' };

    render(<SafetyGuidelinesCard order={order} />);

    expect(screen.getByText('NR-20 — Abastecimento Industrial')).toBeInTheDocument();
    expect(screen.getByText(/Isolar e sinalizar a área operacional/i)).toBeInTheDocument();
    expect(screen.getByText(/Fixar grampo de aterramento estático/i)).toBeInTheDocument();
  });

  it('renderiza recomendações customizadas enviadas pela IA', () => {
    const aiPrediction = {
      recomendacoes_seguranca: [
        'Aterrar caminhão-tanque no hidrante de espuma 02.',
        'Manter observador com rádio VHF em escuta constante no canal 16.',
      ],
    };

    render(
      <SafetyGuidelinesCard
        aiPrediction={aiPrediction}
        order={{ tipo_local: 'MARINA' }}
      />
    );

    expect(
      screen.getByText('Aterrar caminhão-tanque no hidrante de espuma 02.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Manter observador com rádio VHF em escuta constante no canal 16.')
    ).toBeInTheDocument();
  });
});
