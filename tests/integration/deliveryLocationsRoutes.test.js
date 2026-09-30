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

describe('Integration: Customer Delivery Locations Routes (/api/v1/customers/locations)', () => {
    const mockAuthUser = (id = 'usr-cli-1') => {
        supabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id,
                    email: 'cliente@teste.com',
                    user_metadata: { role: 'cliente' }
                }
            },
            error: null
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/customers/locations', () => {
        it('deve rejeitar sem token com status 401', async () => {
            const res = await request(app).get('/api/v1/customers/locations');
            expect(res.status).toBe(401);
        });

        it('deve listar locais com status 200 para usuário autenticado', async () => {
            mockAuthUser('usr-cli-1');

            // 1. Mock getClienteIdByUserId
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
            });

            // 2. Mock listLocations
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn()
            };
            queryChain.order
                .mockReturnValueOnce(queryChain)
                .mockResolvedValueOnce({
                    data: [
                        { id: 10, apelido: 'Pier Sul', tipo_local: 'MARINA', endereco: 'Av. Portuaria, 1' }
                    ],
                    error: null
                });

            supabase.from.mockReturnValueOnce(queryChain);

            const res = await request(app)
                .get('/api/v1/customers/locations')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0].apelido).toBe('Pier Sul');
        });
    });

    describe('POST /api/v1/customers/locations', () => {
        it('deve cadastrar novo local com status 201', async () => {
            mockAuthUser('usr-cli-1');

            // 1. Mock getClienteIdByUserId
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
            });

            // 2. Mock insert into locais_entrega_cliente
            const createdLocation = {
                id: 101,
                cliente_id: 1,
                apelido: 'Minha Poita',
                tipo_local: 'MARINA',
                endereco: 'Marina da Glória',
                latitude: -22.92,
                longitude: -43.17,
                padrao: false
            };
            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: createdLocation, error: null })
                    })
                })
            });

            const res = await request(app)
                .post('/api/v1/customers/locations')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    apelido: 'Minha Poita',
                    tipo_local: 'MARINA',
                    endereco: 'Marina da Glória',
                    latitude: -22.92,
                    longitude: -43.17
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id', 101);
            expect(res.body.apelido).toBe('Minha Poita');
        });

        it('deve rejeitar se faltar endereco com status 400', async () => {
            mockAuthUser('usr-cli-1');

            const res = await request(app)
                .post('/api/v1/customers/locations')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    apelido: 'Sem Endereço',
                    tipo_local: 'MARINA',
                    latitude: -22.92,
                    longitude: -43.17
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('DELETE /api/v1/customers/locations/:id', () => {
        it('deve remover local com status 204', async () => {
            mockAuthUser('usr-cli-1');

            // 1. Mock getClienteIdByUserId
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
            });

            // 2. Mock find existing
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 101 }, error: null })
                    })
                })
            });

            // 3. Mock delete
            supabase.from.mockReturnValueOnce({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ error: null })
                    })
                })
            });

            const res = await request(app)
                .delete('/api/v1/customers/locations/101')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(204);
        });

        it('deve retornar 404 se local não existir ou pertencer a outro cliente', async () => {
            mockAuthUser('usr-cli-1');

            // 1. Mock getClienteIdByUserId
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
            });

            // 2. Mock find existing -> null
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                    })
                })
            });

            const res = await request(app)
                .delete('/api/v1/customers/locations/999')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(404);
            expect(res.body.error).toContain('não encontrado');
        });
    });
});
