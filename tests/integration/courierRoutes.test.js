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

describe('Integration: Courier Routes (/api/v1/couriers)', () => {
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

    describe('GET /api/v1/couriers', () => {
        it('TC-CR-API-01: deve rejeitar com 401 sem autenticação', async () => {
            const res = await request(app).get('/api/v1/couriers');
            expect(res.status).toBe(401);
        });

        it('TC-CR-API-02: deve rejeitar com 403 se usuário for cliente', async () => {
            mockAuthUser('cliente');
            const res = await request(app)
                .get('/api/v1/couriers')
                .set('Authorization', 'Bearer valid-customer-token');

            expect(res.status).toBe(403);
        });

        it('TC-CR-API-03: deve listar entregadores com status 200 para posto_admin', async () => {
            mockAuthUser('posto_admin');

            const mockCouriers = [
                { id: 1, nome: 'Carlos Entregador', status: 'DISPONIVEL', posto_id: 1 }
            ];
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: mockCouriers, error: null })
                })
            });

            const res = await request(app)
                .get('/api/v1/couriers?posto_id=1')
                .set('Authorization', 'Bearer valid-admin-token');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0]).toHaveProperty('nome', 'Carlos Entregador');
        });
    });

    describe('GET /api/v1/couriers/:id', () => {
        it('TC-CR-API-04: deve retornar detalhes do entregador com status 200', async () => {
            mockAuthUser('entregador');

            const mockCourier = { id: 1, nome: 'Carlos Entregador', status: 'DISPONIVEL' };
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockCourier, error: null })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/couriers/1')
                .set('Authorization', 'Bearer valid-courier-token');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', 1);
        });

        it('TC-CR-API-05: deve retornar 404 quando o entregador não existir', async () => {
            mockAuthUser('posto_admin');

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/couriers/999')
                .set('Authorization', 'Bearer valid-admin-token');

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/v1/couriers/:id/status', () => {
        it('TC-CR-API-06: deve atualizar status operacional com status 200', async () => {
            mockAuthUser('entregador');

            const mockUpdated = { id: 1, status: 'EM_ROTA' };
            supabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: [mockUpdated], error: null })
                    })
                })
            });

            const res = await request(app)
                .patch('/api/v1/couriers/1/status')
                .set('Authorization', 'Bearer valid-courier-token')
                .send({ status: 'EM_ROTA' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', 'EM_ROTA');
        });

        it('TC-CR-API-07: deve rejeitar com 400 se o status for inválido', async () => {
            mockAuthUser('entregador');

            const res = await request(app)
                .patch('/api/v1/couriers/1/status')
                .set('Authorization', 'Bearer valid-courier-token')
                .send({ status: 'STATUS_INVALIDO' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('PATCH /api/v1/couriers/:id/location', () => {
        it('TC-CR-API-08: deve rejeitar com 403 se um cliente tentar atualizar coordenadas', async () => {
            mockAuthUser('cliente');

            const res = await request(app)
                .patch('/api/v1/couriers/1/location')
                .set('Authorization', 'Bearer valid-customer-token')
                .send({ latitude: -22.9068, longitude: -43.1729 });

            expect(res.status).toBe(403);
        });

        it('TC-CR-API-09: deve atualizar coordenadas com status 200 quando for entregador', async () => {
            mockAuthUser('entregador');

            const mockUpdated = {
                id: 1,
                ultima_latitude: -22.9068,
                ultima_longitude: -43.1729,
                ultima_posicao_em: '2026-09-10T12:00:00Z'
            };
            supabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: [mockUpdated], error: null })
                    })
                })
            });

            const res = await request(app)
                .patch('/api/v1/couriers/1/location')
                .set('Authorization', 'Bearer valid-courier-token')
                .send({ latitude: -22.9068, longitude: -43.1729 });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('ultima_latitude', -22.9068);
            expect(res.body).toHaveProperty('ultima_longitude', -43.1729);
        });

        it('TC-CR-API-10: deve rejeitar com 400 se as coordenadas forem inválidas', async () => {
            mockAuthUser('entregador');

            const res = await request(app)
                .patch('/api/v1/couriers/1/location')
                .set('Authorization', 'Bearer valid-courier-token')
                .send({ latitude: 100, longitude: 0 });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });
});
