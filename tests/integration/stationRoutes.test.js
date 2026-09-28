const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');

jest.mock('../../src/config/supabaseClient', () => {
    return {
        auth: {
            getUser: jest.fn()
        },
        from: jest.fn()
    };
});

describe('Integration: Station Routes (/api/v1/stations)', () => {
    const mockAuthUser = (role = 'posto_admin', id = 'usr-admin-1') => {
        supabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id,
                    email: 'admin@posto.com',
                    user_metadata: { role }
                }
            },
            error: null
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const validPayload = {
        nome_fantasia: 'Posto Base Marina Náutica',
        razao_social: 'Marina Náutica Combustíveis LTDA',
        cnpj: '11.222.333/0001-81',
        telefone: '21988887777',
        endereco: 'Av. das Américas, 1000',
        latitude: -23.000371,
        longitude: -43.365894,
        tempo_medio_preparo_minutos: 15
    };

    describe('POST /api/v1/stations', () => {
        it('TC-ST-API-01: deve rejeitar sem autenticação com status 401', async () => {
            const res = await request(app).post('/api/v1/stations').send(validPayload);
            expect(res.status).toBe(401);
        });

        it('TC-ST-API-02: deve rejeitar com 403 se o usuário for cliente civil', async () => {
            mockAuthUser('cliente');
            const res = await request(app)
                .post('/api/v1/stations')
                .set('Authorization', 'Bearer valid-customer-token')
                .send(validPayload);

            expect(res.status).toBe(403);
        });

        it('TC-ST-API-03: deve rejeitar com 400 se o CNPJ for inválido', async () => {
            mockAuthUser('posto_admin');
            const res = await request(app)
                .post('/api/v1/stations')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ ...validPayload, cnpj: '00000000000000' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('TC-ST-API-04: deve criar posto com status 201 quando usuário for posto_admin', async () => {
            mockAuthUser('posto_admin');

            const mockCreated = { id: 1, ...validPayload, cnpj: '11222333000181', ativo: true };
            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({ data: [mockCreated], error: null })
                })
            });

            const res = await request(app)
                .post('/api/v1/stations')
                .set('Authorization', 'Bearer valid-admin-token')
                .send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id', 1);
            expect(res.body).toHaveProperty('nome_fantasia', validPayload.nome_fantasia);
        });

        it('TC-ST-API-05: deve retornar 409 quando o CNPJ já estiver cadastrado', async () => {
            mockAuthUser('posto_admin');

            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: '23505', message: 'duplicate key value violates unique constraint' }
                    })
                })
            });

            const res = await request(app)
                .post('/api/v1/stations')
                .set('Authorization', 'Bearer valid-admin-token')
                .send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Já existe um posto cadastrado com este CNPJ.');
        });
    });

    describe('GET /api/v1/stations', () => {
        it('TC-ST-API-06: deve retornar lista de postos ativos com status 200', async () => {
            mockAuthUser('cliente');

            const mockList = [{ id: 1, nome_fantasia: 'Posto Base Marina Náutica', ativo: true }];
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: mockList, error: null })
                })
            });

            const res = await request(app)
                .get('/api/v1/stations')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0]).toHaveProperty('nome_fantasia', 'Posto Base Marina Náutica');
        });
    });

    describe('GET /api/v1/stations/:id', () => {
        it('TC-ST-API-07: deve retornar detalhes do posto com status 200', async () => {
            mockAuthUser('cliente');

            const mockStation = { id: 1, nome_fantasia: 'Posto Marina', cnpj: '11222333000181' };
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockStation, error: null })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/stations/1')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', 1);
        });

        it('TC-ST-API-08: deve retornar 404 se o posto não existir', async () => {
            mockAuthUser('cliente');

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/stations/999')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/v1/stations/:id', () => {
        it('TC-ST-API-09: deve rejeitar com 403 se usuário for cliente', async () => {
            mockAuthUser('cliente');

            const res = await request(app)
                .put('/api/v1/stations/1')
                .set('Authorization', 'Bearer valid-token')
                .send({ tempo_medio_preparo_minutos: 20 });

            expect(res.status).toBe(403);
        });

        it('TC-ST-API-10: deve atualizar posto com status 200 quando for posto_admin', async () => {
            mockAuthUser('posto_admin');

            const mockUpdated = { id: 1, nome_fantasia: 'Posto Marina', tempo_medio_preparo_minutos: 20 };
            supabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: [mockUpdated], error: null })
                    })
                })
            });

            const res = await request(app)
                .put('/api/v1/stations/1')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ tempo_medio_preparo_minutos: 20 });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('tempo_medio_preparo_minutos', 20);
        });
    });

    describe('Station Fuels and Pricing (/api/v1/stations/:stationId/fuels)', () => {
        it('TC-ST-FUEL-01: deve listar os combustíveis do posto com status 200', async () => {
            mockAuthUser('cliente');
            const mockFuels = [
                { id: 'uuid-1', posto_id: 1, combustivel_id: 1, preco_litro: 5.89, disponivel: true }
            ];
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: mockFuels, error: null })
                })
            });

            const res = await request(app)
                .get('/api/v1/stations/1/fuels')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockFuels);
        });

        it('TC-ST-FUEL-02: deve rejeitar cadastro de combustível se posto_admin não for do posto (403)', async () => {
            mockAuthUser('posto_admin', 'usr-unauthorized');
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                        })
                    })
                })
            });

            const res = await request(app)
                .post('/api/v1/stations/1/fuels')
                .set('Authorization', 'Bearer admin-token')
                .send({ combustivel_id: 1, preco_litro: 6.50 });

            expect(res.status).toBe(403);
            expect(res.body.error).toMatch(/não administra este posto/i);
        });

        it('TC-ST-FUEL-03: deve permitir cadastro de combustível para admin_geral sem checar posto_administradores', async () => {
            mockAuthUser('admin_geral', 'usr-general-admin');
            const mockCreated = { id: 'uuid-2', posto_id: 1, combustivel_id: 1, preco_litro: 6.50 };
            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({ data: [mockCreated], error: null })
                })
            });

            const res = await request(app)
                .post('/api/v1/stations/1/fuels')
                .set('Authorization', 'Bearer general-token')
                .send({ combustivel_id: 1, preco_litro: 6.50 });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockCreated);
        });

        it('TC-ST-FUEL-04: deve atualizar preço de combustível com status 200', async () => {
            mockAuthUser('admin_geral');
            const mockUpdated = { id: 'uuid-1', posto_id: 1, combustivel_id: 1, preco_litro: 7.10 };
            supabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({ data: [mockUpdated], error: null })
                        })
                    })
                })
            });

            const res = await request(app)
                .put('/api/v1/stations/1/fuels/1')
                .set('Authorization', 'Bearer token')
                .send({ preco_litro: 7.10 });

            expect(res.status).toBe(200);
            expect(res.body.preco_litro).toBe(7.10);
        });

        it('TC-ST-FUEL-05: deve consultar histórico auditado de preços com status 200', async () => {
            mockAuthUser('cliente');
            const mockHistory = [
                { id: 'h-1', preco_anterior: 6.50, preco_novo: 7.10, alterado_em: '2026-09-28T10:00:00Z' }
            ];
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
                        })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/stations/1/fuels/1/history')
                .set('Authorization', 'Bearer token');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockHistory);
        });
    });
});
