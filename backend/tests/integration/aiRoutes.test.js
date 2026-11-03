const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');
const { generateCognitivePrediction } = require('../../src/modules/ai/groqClient');
const { fetchRealRoute } = require('../../src/modules/ai/routingClient');
const { clearPredictionCache } = require('../../src/modules/ai/aiService');

jest.mock('../../src/modules/ai/routingClient', () => {
    const actual = jest.requireActual('../../src/modules/ai/routingClient');
    return {
        ...actual,
        fetchRealRoute: jest.fn().mockImplementation((params) => {
            return Promise.resolve(actual.generateFallbackRoute(params));
        })
    };
});

jest.mock('../../src/config/supabaseClient', () => {
    return {
        auth: {
            getUser: jest.fn()
        },
        from: jest.fn()
    };
});

jest.mock('../../src/modules/ai/groqClient', () => ({
    generateCognitivePrediction: jest.fn()
}));

describe('Integration: AI Routes (/api/v1/ai)', () => {
    const mockAuthUser = (role = 'cliente', id = 'usr-test-1', email = 'test@navrotas.com') => {
        supabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id,
                    email,
                    user_metadata: { role, name: 'Cliente Teste' }
                }
            },
            error: null
        });
    };

    const validPayload = {
        orderId: 101,
        station: {
            id: 1,
            nome: 'Posto Náutico Mar Azul',
            latitude: -23.550520,
            longitude: -46.633308,
            tempo_medio_preparo: 12
        },
        destination: {
            latitude: -23.518600,
            longitude: -46.625300,
            tipo_local: 'MARINA',
            ponto_referencia: 'Píer 2, Vaga 8'
        },
        pendingDeliveries: 1,
        customerName: 'Carlos Silva',
        setbackDescription: null
    };

    beforeEach(() => {
        clearPredictionCache();
        jest.clearAllMocks();

        // Mock padrão para perfis_usuarios e entregas
        supabase.from.mockImplementation((table) => {
            if (table === 'perfis_usuarios') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: { id: 'usr-test-1', email: 'test@navrotas.com', role: 'cliente', nome: 'Cliente Teste' },
                        error: null
                    })
                };
            }

            if (table === 'entregas') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockResolvedValue({
                        data: [{ id: 42, pedido_id: 101 }],
                        error: null
                    })
                };
            }

            if (table === 'previsoes_ia') {
                return {
                    insert: jest.fn().mockImplementation((payload) => ({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockImplementation(() => Promise.resolve({
                                data: {
                                    id: 1,
                                    ...payload,
                                    criado_em: new Date().toISOString()
                                },
                                error: null
                            }))
                        })
                    }))
                };
            }

            if (table === 'pedidos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    neq: jest.fn().mockReturnThis(),
                    lte: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    update: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                    })
                };
            }

            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
            };
        });
    });

    it('deve rejeitar com 401 se a requisição não contiver token de autenticação', async () => {
        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .send(validPayload);

        expect(res.status).toBe(401);
        expect(res.body.error).toContain('Token de autenticação não fornecido');
    });

    it('deve rejeitar com 400 se station ou destination forem omitidos e orderId não for fornecido', async () => {
        mockAuthUser();

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send({ pendingDeliveries: 1 });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Dados de posto e destino são obrigatórios');
    });

    it('deve permitir requisição de ETA apenas com orderId sem exigir station ou destination no body', async () => {
        mockAuthUser();

        supabase.from.mockImplementation((table) => {
            if (table === 'perfis_usuarios') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: { id: 'usr-test-1', email: 'test@navrotas.com', role: 'cliente' },
                        error: null
                    })
                };
            }
            if (table === 'pedidos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: {
                            id: 101,
                            posto_id: 5,
                            destino_latitude: -8.058800,
                            destino_longitude: -34.890600,
                            tipo_local: 'MARINA',
                            ponto_referencia: 'Cais 2',
                            posto: {
                                id: 5,
                                latitude: -8.072200,
                                longitude: -34.876700,
                                tempo_medio_preparo_minutos: 15
                            }
                        },
                        error: null
                    })
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
            };
        });

        generateCognitivePrediction.mockResolvedValueOnce({
            confianca: 92,
            risco_atraso: false,
            motivo_risco: null,
            mensagem: 'Chegada prevista em 24 min.'
        });

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send({ orderId: 101 });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('total_minutos');
    });

    it('deve calcular e persistir previsão de ETA com sucesso utilizando o motor cognitivo Groq LPU', async () => {
        mockAuthUser();

        generateCognitivePrediction.mockResolvedValueOnce({
            confianca: 95,
            risco_atraso: false,
            motivo_risco: null,
            mensagem: 'Olá, Carlos! Sua carga já está sendo acondicionada. Previsão de entrega pontual na Vaga 8.'
        });

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('eta_previsto');
        expect(res.body.data).toHaveProperty('horario_previsto_chegada');
        expect(res.body.data.confianca).toBe(95);
        expect(res.body.data.risco_atraso).toBe(false);
        expect(res.body.data.mensagem).toContain('Vaga 8');
    });

    it('deve ativar fallback determinístico caso o Groq apresente erro ou timeout', async () => {
        mockAuthUser();

        generateCognitivePrediction.mockRejectedValueOnce(new Error('Groq API Timeout'));

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('eta_previsto');
        expect(res.body.data).toHaveProperty('total_minutos');
    });

    it('deve retornar 201 com métricas calculadas mesmo se a persistência no Supabase falhar (PGRST204)', async () => {
        mockAuthUser();

        generateCognitivePrediction.mockResolvedValueOnce({
            confianca: 92,
            risco_atraso: false,
            motivo_risco: null,
            mensagem: 'Previsão calculada com sucesso.'
        });

        supabase.from.mockImplementation((table) => {
            if (table === 'perfis_usuarios') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: { id: 'usr-test-1', email: 'test@navrotas.com', role: 'cliente' },
                        error: null
                    })
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
            if (table === 'previsoes_ia') {
                return {
                    insert: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: {
                                    code: 'PGRST204',
                                    message: "Could not find the 'pedido_id' column of 'previsoes_ia' in the schema cache"
                                }
                            })
                        })
                    })
                };
            }
            return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
        });

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('tempo_formatado');
        expect(res.body.data.mensagem).toBe('Previsão calculada com sucesso.');
    });

    it('deve resolver coordenadas canônicas do posto a partir do pedido no banco de dados', async () => {
        mockAuthUser();

        // Simula pedido com posto e destino em Recife
        supabase.from.mockImplementation((table) => {
            if (table === 'perfis_usuarios') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: { id: 'usr-test-1', email: 'test@navrotas.com', role: 'cliente' },
                        error: null
                    })
                };
            }
            if (table === 'pedidos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: {
                            id: 101,
                            posto_id: 5,
                            destino_latitude: -8.058800,
                            destino_longitude: -34.890600,
                            tipo_local: 'MARINA',
                            ponto_referencia: 'Cais 2',
                            posto: {
                                id: 5,
                                latitude: -8.072200,
                                longitude: -34.876700,
                                tempo_medio_preparo_minutos: 15
                            }
                        },
                        error: null
                    })
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
            if (table === 'previsoes_ia') {
                return {
                    insert: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: null
                            })
                        })
                    })
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
            };
        });

        generateCognitivePrediction.mockResolvedValueOnce({
            confianca: 92,
            risco_atraso: false,
            motivo_risco: null,
            mensagem: 'Chegada prevista em 24 min.'
        });

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send({
                orderId: 101,
                station: { latitude: 0, longitude: 0 }, // Valores serão substituídos pelos canônicos de Recife
                destination: { latitude: 0, longitude: 0 }
            });

        expect(res.status).toBe(201);
        expect(res.body.data.distancia_linear_km).toBeCloseTo(2.14, 1);
        expect(res.body.data.total_minutos).toBe(24);
        expect(res.body.data.anomalia_distancia).toBe(false);
    });

    it('deve penalizar confiança para <= 25% e forçar risco_atraso quando houver anomalia de distância (> 100 km)', async () => {
        mockAuthUser();

        // Groq tenta retornar alta confiança mesmo com distância interestadual
        generateCognitivePrediction.mockResolvedValueOnce({
            confianca: 95,
            risco_atraso: false,
            motivo_risco: null,
            mensagem: 'Previsão de 143 horas com alta confiança.'
        });

        const interstatePayload = {
            orderId: 999,
            station: { latitude: -23.550520, longitude: -46.633308, tempo_medio_preparo: 15 }, // SP
            destination: { latitude: -8.058800, longitude: -34.890600, tipo_local: 'MARINA' } // Recife
        };

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send(interstatePayload);

        expect(res.status).toBe(201);
        expect(res.body.data.distancia_km).toBeGreaterThan(2000);
        expect(res.body.data.anomalia_distancia).toBe(true);
        expect(res.body.data.confianca).toBeLessThanOrEqual(25);
        expect(res.body.data.risco_atraso).toBe(true);
        expect(res.body.data.motivo_risco).toContain('100 km');
    });

    it('deve retornar tipo_fase = ACEITE e estimativa de aceite quando pedido estiver PENDENTE', async () => {
        mockAuthUser();

        supabase.from.mockImplementation((table) => {
            if (table === 'perfis_usuarios') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: { id: 'usr-test-1', email: 'test@navrotas.com', role: 'cliente' },
                        error: null
                    })
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
            if (table === 'pedidos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    neq: jest.fn().mockReturnThis(),
                    lte: jest.fn().mockReturnValue(Promise.resolve({ count: 2 })),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: {
                            id: 201,
                            posto_id: 10,
                            status: 'PENDENTE',
                            created_at: '2026-09-29T10:00:00.000Z',
                            destino_latitude: -23.518600,
                            destino_longitude: -46.625300,
                            tipo_local: 'MARINA',
                            posto: {
                                id: 10,
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
                                data: { id: 99, ...payload },
                                error: null
                            })
                        })
                    }))
                };
            }
            return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
        });

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send({
                orderId: 201,
                station: { latitude: -23.550520, longitude: -46.633308 },
                destination: { latitude: -23.518600, longitude: -46.625300 }
            });

        expect(res.status).toBe(201);
        expect(res.body.data.tipo_fase).toBe('ACEITE');
        expect(res.body.data.total_minutos).toBe(13); // 5 base + 2 * 4 min
        expect(res.body.data.tempo_formatado).toBe('13 min');
    });

    it('deve registrar baseline e retornar tipo_fase = ENTREGA quando pedido estiver CONFIRMADO_POSTO', async () => {
        mockAuthUser();

        const updateMock = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
        });

        supabase.from.mockImplementation((table) => {
            if (table === 'perfis_usuarios') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: { id: 'usr-test-1', email: 'test@navrotas.com', role: 'cliente' },
                        error: null
                    })
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
            if (table === 'pedidos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    neq: jest.fn().mockReturnValue(Promise.resolve({ count: 1 })),
                    update: updateMock,
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: {
                            id: 301,
                            posto_id: 10,
                            status: 'CONFIRMADO_POSTO',
                            horario_previsto_entrega: null, // sem baseline ainda
                            destino_latitude: -23.518600,
                            destino_longitude: -46.625300,
                            tipo_local: 'RESIDENCIA',
                            posto: {
                                id: 10,
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
                                data: { id: 100, ...payload },
                                error: null
                            })
                        })
                    }))
                };
            }
            return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
        });

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send({
                orderId: 301,
                station: { latitude: -23.550520, longitude: -46.633308 },
                destination: { latitude: -23.518600, longitude: -46.625300 }
            });

        expect(res.status).toBe(201);
        expect(res.body.data.tipo_fase).toBe('ENTREGA');
        expect(res.body.data).toHaveProperty('horario_baseline');
        expect(updateMock).toHaveBeenCalled();
    });

    it('deve realizar fallback de busca direta na tabela postos quando o join relacional não retornar coordenadas da base', async () => {
        mockAuthUser();

        supabase.from.mockImplementation((table) => {
            if (table === 'perfis_usuarios') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: { id: 'usr-test-1', email: 'test@navrotas.com', role: 'cliente' },
                        error: null
                    })
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
            if (table === 'pedidos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) }),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: {
                            id: 401,
                            posto_id: 8,
                            status: 'CONFIRMADO_POSTO',
                            destino_latitude: -8.058800,
                            destino_longitude: -34.890600,
                            tipo_local: 'MARINA',
                            posto: null // Simula falha/ausência de join relacional
                        },
                        error: null
                    })
                };
            }
            if (table === 'postos') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({
                        data: {
                            id: 8,
                            nome_fantasia: 'Posto Recife Bacia do Pina',
                            latitude: -8.072200,
                            longitude: -34.876700,
                            tempo_medio_preparo_minutos: 15
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
                                data: { id: 101, ...payload },
                                error: null
                            })
                        })
                    }))
                };
            }
            return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
        });

        const res = await request(app)
            .post('/api/v1/ai/predict-eta')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send({
                orderId: 401,
                station: { id: 8 }, // sem coordenadas para testar resolução canônica + fallback direto em postos
                destination: { tipo_local: 'MARINA' }
            });

        expect(res.status).toBe(201);
        expect(res.body.data.distancia_km).toBeCloseTo(2.88, 1);
        expect(res.body.data.total_minutos).toBe(24);
    });

    describe('Campos e Metadados Enriquecidos de Roteamento e Segurança', () => {
        it('deve retornar rota_geometria, fonte_roteamento, janela_entrega e recomendacoes_seguranca com OSRM', async () => {
            mockAuthUser();

            const mockOsrmGeometry = {
                type: 'LineString',
                coordinates: [
                    [-46.633308, -23.550520],
                    [-46.629000, -23.535000],
                    [-46.625300, -23.518600]
                ]
            };

            fetchRealRoute.mockResolvedValueOnce({
                distancia_km: 5.12,
                distancia_linear_km: 3.64,
                duracao_minutos: 13,
                geometria: mockOsrmGeometry,
                fonte: 'OSRM',
                anomalia_distancia: false
            });

            generateCognitivePrediction.mockResolvedValueOnce({
                confianca: 94,
                risco_atraso: false,
                motivo_risco: null,
                mensagem: 'Previsão calculada com precisão viária OSRM.'
            });

            const res = await request(app)
                .post('/api/v1/ai/predict-eta')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body.data.fonte_roteamento).toBe('OSRM');
            expect(res.body.data.rota_geometria).toEqual(mockOsrmGeometry);
            expect(res.body.data.distancia_km).toBe(5.12);

            // Janela de entrega
            expect(res.body.data).toHaveProperty('janela_entrega');
            expect(res.body.data.janela_entrega).toHaveProperty('inicio');
            expect(res.body.data.janela_entrega).toHaveProperty('fim');
            expect(res.body.data.janela_entrega.formato_amigavel).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);

            // Fatores de tempo
            expect(res.body.data).toHaveProperty('fatores_tempo');
            expect(res.body.data.fatores_tempo).toHaveProperty('fila_minutos');
            expect(res.body.data.fatores_tempo).toHaveProperty('preparo_minutos');
            expect(res.body.data.fatores_tempo).toHaveProperty('transito_minutos');
            expect(res.body.data.fatores_tempo).toHaveProperty('total_minutos');
            expect(res.body.data.fatores_tempo.explicacao).toBeDefined();

            // Diretrizes de segurança
            expect(res.body.data).toHaveProperty('recomendacoes_seguranca');
            expect(Array.isArray(res.body.data.recomendacoes_seguranca)).toBe(true);
            expect(res.body.data.recomendacoes_seguranca.length).toBeGreaterThanOrEqual(3);

            // Condições operacionais
            expect(res.body.data).toHaveProperty('condicoes_operacionais');
            expect(res.body.data.condicoes_operacionais).toHaveProperty('nivel_trafego');
            expect(res.body.data.condicoes_operacionais).toHaveProperty('complexidade_acesso');

            // Retrocompatibilidade total preservada
            expect(res.body.data).toHaveProperty('horario_previsto_chegada');
            expect(res.body.data).toHaveProperty('confianca');
            expect(res.body.data).toHaveProperty('mensagem');
        });

        it('deve rejeitar com 403 (Anti-BOLA) se cliente tentar consultar pedido pertencente a outro cliente', async () => {
            mockAuthUser('cliente', 'usr-hacker', 'hacker@test.com');

            supabase.from.mockImplementation((table) => {
                if (table === 'perfis_usuarios') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 'usr-hacker', email: 'hacker@test.com', role: 'cliente', nome: 'Hacker' },
                            error: null
                        })
                    };
                }
                if (table === 'clientes') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { id: 999, usuario_id: 'usr-hacker' },
                            error: null
                        })
                    };
                }
                if (table === 'pedidos') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: {
                                id: 101,
                                cliente_id: 1, // Pertence ao cliente id 1, não ao 999
                                posto_id: 1,
                                status: 'CONFIRMADO_POSTO',
                                destino_latitude: -23.5186,
                                destino_longitude: -46.6253,
                                posto: { latitude: -23.5505, longitude: -46.6333 }
                            },
                            error: null
                        })
                    };
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                };
            });

            const res = await request(app)
                .post('/api/v1/ai/predict-eta')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(validPayload);

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('você não possui autorização');
        });
    });

    describe('Idempotência e Cache em Memória das Predições de IA', () => {
        it('deve retornar predição do cache sem chamar Groq novamente para requisições repetidas do mesmo pedido', async () => {
            mockAuthUser();

            generateCognitivePrediction.mockResolvedValue({
                confianca: 96,
                risco_atraso: false,
                motivo_risco: null,
                mensagem: 'Previsão gerada pela IA Groq LPU'
            });

            // Primeira chamada: calcula e popula o cache
            const res1 = await request(app)
                .post('/api/v1/ai/predict-eta')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(validPayload);

            expect(res1.status).toBe(201);
            expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);
            expect(res1.body.data.confianca).toBe(96);

            // Segunda chamada com mesmo payload dentro do TTL de 30-60s
            const res2 = await request(app)
                .post('/api/v1/ai/predict-eta')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(validPayload);

            expect(res2.status).toBe(201);
            // Groq NÃO deve ser chamado novamente!
            expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);
            expect(res2.body.data.confianca).toBe(96);
            expect(res2.body.data.mensagem).toBe(res1.body.data.mensagem);
        });

        it('deve tratar requisições concorrentes simultâneas sem duplicar chamadas ao Groq', async () => {
            mockAuthUser();

            generateCognitivePrediction.mockImplementation(async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                return {
                    confianca: 94,
                    risco_atraso: false,
                    motivo_risco: null,
                    mensagem: 'Previsão concorrente processada com sucesso'
                };
            });

            // Dispara duas requisições paralelas concorrentes
            const [res1, res2] = await Promise.all([
                request(app)
                    .post('/api/v1/ai/predict-eta')
                    .set('Authorization', 'Bearer valid-jwt-token')
                    .send(validPayload),
                request(app)
                    .post('/api/v1/ai/predict-eta')
                    .set('Authorization', 'Bearer valid-jwt-token')
                    .send(validPayload)
            ]);

            expect(res1.status).toBe(201);
            expect(res2.status).toBe(201);
            expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);
            expect(res1.body.data.mensagem).toBe('Previsão concorrente processada com sucesso');
            expect(res2.body.data.mensagem).toBe('Previsão concorrente processada com sucesso');
        });

        it('deve gerar nova predição ao mudar o status do pedido mesmo dentro da janela de tempo', async () => {
            mockAuthUser();

            generateCognitivePrediction
                .mockResolvedValueOnce({
                    confianca: 90,
                    risco_atraso: false,
                    motivo_risco: null,
                    mensagem: 'Status PENDENTE'
                })
                .mockResolvedValueOnce({
                    confianca: 92,
                    risco_atraso: false,
                    motivo_risco: null,
                    mensagem: 'Status CONFIRMADO_POSTO'
                });

            // 1ª chamada: pedido PENDENTE
            supabase.from.mockImplementation((table) => {
                if (table === 'perfis_usuarios') {
                    return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'usr-test-1', role: 'cliente' }, error: null }) };
                }
                if (table === 'pedidos') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: {
                                id: 101,
                                status: 'PENDENTE',
                                cliente_id: 1,
                                posto_id: 1,
                                destino_latitude: -23.5186,
                                destino_longitude: -46.6253,
                                posto: { latitude: -23.5505, longitude: -46.6333, tempo_medio_preparo_minutos: 10 }
                            },
                            error: null
                        })
                    };
                }
                if (table === 'previsoes_ia') {
                    return {
                        insert: jest.fn().mockImplementation((payload) => ({
                            select: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ data: { id: 1, ...payload } })
                            })
                        }))
                    };
                }
                return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
            });

            const res1 = await request(app)
                .post('/api/v1/ai/predict-eta')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(validPayload);

            expect(res1.status).toBe(201);
            expect(generateCognitivePrediction).toHaveBeenCalledTimes(1);

            // 2ª chamada: pedido mudou para CONFIRMADO_POSTO
            supabase.from.mockImplementation((table) => {
                if (table === 'perfis_usuarios') {
                    return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'usr-test-1', role: 'cliente' }, error: null }) };
                }
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
                                destino_latitude: -23.5186,
                                destino_longitude: -46.6253,
                                posto: { latitude: -23.5505, longitude: -46.6333, tempo_medio_preparo_minutos: 10 }
                            },
                            error: null
                        })
                    };
                }
                if (table === 'previsoes_ia') {
                    return {
                        insert: jest.fn().mockImplementation((payload) => ({
                            select: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({ data: { id: 2, ...payload } })
                            })
                        }))
                    };
                }
                return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
            });

            const res2 = await request(app)
                .post('/api/v1/ai/predict-eta')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(validPayload);

            expect(res2.status).toBe(201);
            expect(generateCognitivePrediction).toHaveBeenCalledTimes(2);
            expect(res2.body.data.mensagem).toContain('CONFIRMADO_POSTO');
        });
    });

});
