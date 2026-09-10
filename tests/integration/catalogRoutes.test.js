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

describe('Integration: Catalog Routes (/api/v1/catalog)', () => {
    const mockAuthUser = (role = 'posto_admin', id = 'usr-admin-1') => {
        supabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id,
                    email: `${role}@fuel.com`,
                    user_metadata: { role }
                }
            },
            error: null
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/catalog/fuels', () => {
        it('TC-CAT-API-01: deve rejeitar sem autenticação com status 401', async () => {
            const res = await request(app).get('/api/v1/catalog/fuels');
            expect(res.status).toBe(401);
        });

        it('TC-CAT-API-02: deve retornar lista de combustíveis disponíveis com status 200', async () => {
            mockAuthUser('cliente');

            const mockFuels = [
                { id: 1, nome: 'Gasolina Comum', unidade_medida: 'LITROS' },
                { id: 2, nome: 'Diesel Náutico S10', unidade_medida: 'LITROS' }
            ];
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockResolvedValue({ data: mockFuels, error: null })
            });

            const res = await request(app)
                .get('/api/v1/catalog/fuels')
                .set('Authorization', 'Bearer valid-customer-token');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0]).toHaveProperty('nome', 'Gasolina Comum');
        });
    });

    describe('GET /api/v1/catalog/fuels/:id', () => {
        it('TC-CAT-API-03: deve retornar combustível por id com status 200', async () => {
            mockAuthUser('cliente');

            const mockFuel = { id: 1, nome: 'Gasolina Comum', unidade_medida: 'LITROS' };
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockFuel, error: null })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/catalog/fuels/1')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', 1);
        });

        it('TC-CAT-API-04: deve retornar 404 se o combustível não existir', async () => {
            mockAuthUser('cliente');

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/catalog/fuels/999')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/v1/catalog/fuels', () => {
        const fuelPayload = { nome: 'Gasolina Podium', unidade_medida: 'LITROS' };

        it('TC-CAT-API-05: deve rejeitar com 403 se usuário for cliente', async () => {
            mockAuthUser('cliente');

            const res = await request(app)
                .post('/api/v1/catalog/fuels')
                .set('Authorization', 'Bearer valid-customer-token')
                .send(fuelPayload);

            expect(res.status).toBe(403);
        });

        it('TC-CAT-API-06: deve cadastrar novo combustível com status 201 quando for posto_admin', async () => {
            mockAuthUser('posto_admin');

            const mockCreated = { id: 3, nome: 'Gasolina Podium', unidade_medida: 'LITROS' };
            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({ data: [mockCreated], error: null })
                })
            });

            const res = await request(app)
                .post('/api/v1/catalog/fuels')
                .set('Authorization', 'Bearer valid-admin-token')
                .send(fuelPayload);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id', 3);
            expect(res.body).toHaveProperty('nome', 'Gasolina Podium');
        });

        it('TC-CAT-API-07: deve rejeitar com 400 se nome for vazio', async () => {
            mockAuthUser('posto_admin');

            const res = await request(app)
                .post('/api/v1/catalog/fuels')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ nome: '' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it('TC-CAT-API-08: deve retornar 409 se combustível já existir', async () => {
            mockAuthUser('posto_admin');

            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                        data: null,
                        error: { code: '23505', message: 'duplicate key' }
                    })
                })
            });

            const res = await request(app)
                .post('/api/v1/catalog/fuels')
                .set('Authorization', 'Bearer valid-admin-token')
                .send(fuelPayload);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Já existe um combustível cadastrado com este nome.');
        });
    });
});
