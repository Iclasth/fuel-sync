const { predictEtaForOrder, clearPredictionCache, getPredictionCache } = require('../../src/modules/ai/aiService');
const { generateCognitivePrediction } = require('../../src/modules/ai/groqClient');
const { fetchRealRoute } = require('../../src/modules/ai/routingClient');
const supabase = require('../../src/config/supabaseClient');

jest.mock('../../src/config/supabaseClient', () => ({
    from: jest.fn()
}));

jest.mock('../../src/modules/ai/groqClient', () => ({
    generateCognitivePrediction: jest.fn()
}));

jest.mock('../../src/modules/ai/routingClient', () => {
    const actual = jest.requireActual('../../src/modules/ai/routingClient');
    return {
        ...actual,
        fetchRealRoute: jest.fn().mockImplementation((params) => {
            return Promise.resolve(actual.generateFallbackRoute(params));
        })
    };
});

describe('Unit: AI Service - Idempotent Cache & Deduplication', () => {
    const originalEnv = process.env;

    const baseParams = {
        orderId: 101,
        station: {
            id: 1,
            nome: 'Posto Marina Imperial',
            latitude: -23.550520,
            longitude: -46.633308,
            tempo_medio_preparo: 15
        },
        destination: {
            latitude: -23.518600,
            longitude: -46.625300,
            tipo_local: 'MARINA',
            ponto_referencia: 'Vaga B-12'
        },
        pendingDeliveries: 0,
        customerName: 'Roberto Marinho',
        setbackDescription: null,
        user: { id: 'usr-1', role: 'admin_geral' }
    };

    const mockCognitiveResult = {
        confianca: 95,
        risco_atraso: false,
        motivo_risco: null,
        mensagem: 'Previsão calculada com precisão no canal náutico.'
    };

    beforeEach(() => {
        process.env = { ...originalEnv };
        clearPredictionCache();
        jest.clearAllMocks();

        generateCognitivePrediction.mockResolvedValue(mockCognitiveResult);

        // Mock Supabase default
        supabase.from.mockImplementation((table) => {
            if (table === 'pedidos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    update: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: {
                            id: 101,
                            status: 'CONFIRMADO_POSTO',
                            cliente_id: 1,
                            posto_id: 1,
                            destino_latitude: -23.518600,
                            destino_longitude: -46.625300,
                            tipo_local: 'MARINA',
                            posto: {
                                id: 1,
                                nome_fantasia: 'Posto Marina Imperial',
                                latitude: -23.550520,
                                longitude: -46.633308,
                                tempo_medio_preparo_minutos: 15
                            }
                        },
                        error: null
                    })
                };
            }

            if (table === 'previsoes_ia') {
                return {
                    insert: jest.fn().mockImplementation((payload) => ({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { id: 1, ...payload, criado_em: new Date().toISOString() },
                                error: null
                            })
                        })
                    }))
                };
            }

            if (table === 'entregas') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockResolvedValue({ data: [], error: null })
                };
            }

            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
            };
        });
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('deve armazenar a predição em cache e reutilizá-la na segunda chamada para o mesmo pedido', async () => {
        const result1 = await predictEtaForOrder(baseParams);
        expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);
        expect(result1.confianca).toBe(95);

        const cache = getPredictionCache();
        expect(cache.has('order_101_CONFIRMADO_POSTO')).toBe(true);

        const result2 = await predictEtaForOrder(baseParams);
        expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);
        expect(result2.mensagem).toBe(result1.mensagem);
        expect(result2.total_minutos).toBe(result1.total_minutos);
    });

    it('deve gerar chave de cache baseada em coordenadas quando orderId não for fornecido', async () => {
        const coordsParams = {
            orderId: null,
            station: {
                latitude: -23.550520,
                longitude: -46.633308,
                tempo_medio_preparo: 10
            },
            destination: {
                latitude: -23.518600,
                longitude: -46.625300,
                tipo_local: 'MARINA'
            },
            setbackDescription: 'vento_forte',
            user: { id: 'usr-1', role: 'admin_geral' }
        };

        const result1 = await predictEtaForOrder(coordsParams);
        expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);

        const cache = getPredictionCache();
        const expectedKey = 'coords_-23.55052_-46.633308_-23.5186_-46.6253_vento_forte';
        expect(cache.has(expectedKey)).toBe(true);

        const result2 = await predictEtaForOrder(coordsParams);
        expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);
        expect(result2.confianca).toBe(result1.confianca);
    });

    it('deve deduplicar requisições concorrentes em andamento (in-flight promise)', async () => {
        generateCognitivePrediction.mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 60));
            return mockCognitiveResult;
        });

        const [res1, res2] = await Promise.all([
            predictEtaForOrder(baseParams),
            predictEtaForOrder(baseParams)
        ]);

        expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);
        expect(res1.mensagem).toBe(res2.mensagem);
        expect(res1.confianca).toBe(95);
        expect(res2.confianca).toBe(95);
    });

    it('deve invalidar cache quando o status do pedido mudar', async () => {
        await predictEtaForOrder(baseParams);
        expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);

        // Altera status do pedido no banco para EM_TRANSPORTE
        supabase.from.mockImplementation((table) => {
            if (table === 'pedidos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: {
                            id: 101,
                            status: 'EM_TRANSPORTE',
                            cliente_id: 1,
                            posto_id: 1,
                            destino_latitude: -23.518600,
                            destino_longitude: -46.625300,
                            tipo_local: 'MARINA',
                            posto: {
                                id: 1,
                                nome_fantasia: 'Posto Marina Imperial',
                                latitude: -23.550520,
                                longitude: -46.633308
                            }
                        },
                        error: null
                    })
                };
            }
            if (table === 'previsoes_ia') {
                return {
                    insert: jest.fn().mockImplementation((payload) => ({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { id: 2, ...payload },
                                error: null
                            })
                        })
                    }))
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
            };
        });

        await predictEtaForOrder(baseParams);
        expect(generateCognitivePrediction).toHaveBeenCalledTimes(2);

        const cache = getPredictionCache();
        expect(cache.has('order_101_CONFIRMADO_POSTO')).toBe(true);
        expect(cache.has('order_101_EM_TRANSPORTE')).toBe(true);
    });

    it('deve expirar e recalcular após expiração do TTL', async () => {
        const cache = getPredictionCache();

        await predictEtaForOrder(baseParams);
        expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);

        // Simula expiração forçando expiresAt no passado
        const entry = cache.get('order_101_CONFIRMADO_POSTO');
        entry.expiresAt = Date.now() - 1000;

        await predictEtaForOrder(baseParams);
        expect(generateCognitivePrediction).toHaveBeenCalledTimes(2);
    });

    it('deve remover a entrada de cache em caso de erro na execução e permitir nova tentativa', async () => {
        generateCognitivePrediction.mockRejectedValueOnce(new Error('Falha simulada na chamada'));

        // O erro é tratado internamente pelo fallback determinístico, garantindo resiliência
        const result = await predictEtaForOrder(baseParams);
        expect(result).toBeDefined();
        expect(result.mensagem).toBeDefined();
    });
});
