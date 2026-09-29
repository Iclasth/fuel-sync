const { generateFallbackPrediction } = require('../../src/modules/ai/fallbackGenerator');

describe('Unit: AI Module - Fallback Generator', () => {
    const normalMetrics = {
        total_minutos: 25,
        tempo_espera: 12,
        tempo_preparo: 10,
        tempo_viagem: 3
    };

    const crowdedMetrics = {
        total_minutos: 65,
        tempo_espera: 36, // > 25 min
        tempo_preparo: 15,
        tempo_viagem: 14
    };

    it('deve gerar predição segura de alta confiança quando não há contratempos e a fila é normal', () => {
        const prediction = generateFallbackPrediction(normalMetrics, null);

        expect(prediction.confianca).toBe(90);
        expect(prediction.risco_atraso).toBe(false);
        expect(prediction.motivo_risco).toBeNull();
        expect(prediction.mensagem).toContain('25 min');
    });

    it('deve sinalizar risco de atraso quando o tempo de espera na fila for superior a 25 minutos', () => {
        const prediction = generateFallbackPrediction(crowdedMetrics, null);

        expect(prediction.confianca).toBe(75);
        expect(prediction.risco_atraso).toBe(true);
        expect(prediction.motivo_risco).toBe('Fila de espera elevada no posto');
        expect(prediction.mensagem).toContain('1h 5min');
    });

    it('deve priorizar a descrição do contratempo quando fornecida na rota', () => {
        const setback = 'Chuva torrencial e mar agitado no canal náutico';
        const prediction = generateFallbackPrediction(normalMetrics, setback);

        expect(prediction.confianca).toBe(75);
        expect(prediction.risco_atraso).toBe(true);
        expect(prediction.motivo_risco).toBe(setback);
        expect(prediction.mensagem).toContain(setback);
        expect(prediction.mensagem).toContain('Atenção: Ocorreu um evento durante a rota');
    });

    it('deve penalizar severamente a confiança (20%) e apontar risco crítico se houver anomalia de distância (> 100 km)', () => {
        const anomalyMetrics = {
            total_minutos: 8639,
            distanceKm: 2874.4,
            tempo_espera: 0,
            tempo_preparo: 15,
            tempo_viagem: 8624,
            tempo_formatado: '143h 59min',
            anomalia_distancia: true
        };

        const prediction = generateFallbackPrediction(anomalyMetrics, null);

        expect(prediction.confianca).toBe(20);
        expect(prediction.risco_atraso).toBe(true);
        expect(prediction.motivo_risco).toContain('100 km');
        expect(prediction.mensagem).toContain('excede o raio operacional padrão');
    });

    describe('Mensagens Específicas por Estado do Pedido', () => {
        it('deve gerar mensagem de estimativa de aceite com contagem de fila para status PENDENTE', () => {
            const metrics = {
                tipo_fase: 'ACEITE',
                fila_pedidos: 3,
                tempo_espera: 12,
                total_minutos: 17,
                tempo_formatado: '17 min'
            };

            const prediction = generateFallbackPrediction(metrics, null, 'PENDENTE');

            expect(prediction.mensagem).toContain('aguarda confirmação do posto');
            expect(prediction.mensagem).toContain('Há 3 pedido(s) pendente(s) na fila de análise da base');
            expect(prediction.mensagem).toContain('aproximadamente 17 min');
        });

        it('deve gerar mensagem de baseline oficial para status CONFIRMADO_POSTO', () => {
            const metrics = {
                tipo_fase: 'ENTREGA',
                fila_pedidos: 2,
                tempo_espera: 24,
                total_minutos: 48,
                tempo_formatado: '48 min',
                horario_previsto_chegada: '2026-09-29T15:30:00.000Z'
            };

            const prediction = generateFallbackPrediction(metrics, null, 'CONFIRMADO_POSTO');

            expect(prediction.mensagem).toContain('Pedido confirmado pelo posto');
            expect(prediction.mensagem).toContain('Fila de separação: 2 pedido(s)');
            expect(prediction.mensagem).toContain('Previsão estimada de entrega');
        });

        it('deve reportar atraso vs baseline no status EM_PREPARACAO quando houver variação superior a 5 min', () => {
            const metrics = {
                tipo_fase: 'ENTREGA',
                tempo_espera: 0,
                tempo_preparo: 15,
                tempo_viagem: 20,
                total_minutos: 35,
                tempo_formatado: '35 min',
                tem_atraso_baseline: true,
                delta_atraso_minutos: 12,
                horario_previsto_chegada: '2026-09-29T16:00:00.000Z'
            };

            const prediction = generateFallbackPrediction(metrics, null, 'EM_PREPARACAO');

            expect(prediction.risco_atraso).toBe(true);
            expect(prediction.motivo_risco).toContain('atraso de ~12 min em relação ao baseline');
            expect(prediction.mensagem).toContain('Carga em preparação no posto');
            expect(prediction.mensagem).toContain('atraso de ~12 min vs. previsão inicial');
        });

        it('deve reportar entregador em rota e previsão pontual no status EM_TRANSPORTE quando sem atrasos', () => {
            const metrics = {
                tipo_fase: 'ENTREGA',
                tempo_espera: 0,
                tempo_preparo: 0,
                tempo_viagem: 15,
                total_minutos: 15,
                tempo_formatado: '15 min',
                tem_atraso_baseline: false,
                horario_previsto_chegada: '2026-09-29T15:15:00.000Z'
            };

            const prediction = generateFallbackPrediction(metrics, null, 'EM_TRANSPORTE');

            expect(prediction.risco_atraso).toBe(false);
            expect(prediction.mensagem).toContain('Entregador em deslocamento direto para o local indicado');
            expect(prediction.mensagem).toContain('Previsão de chegada pontual');
        });
    });
});

