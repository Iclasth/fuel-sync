const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');
const { LocationType, OrderStatus } = require('../../src/common/constants/enums');

jest.mock('../../src/config/supabaseClient', () => {
    return {
        auth: {
            getUser: jest.fn()
        },
        from: jest.fn()
    };
});

describe('Integration: Order Routes (/api/v1/orders)', () => {
    const mockAuthUser = (role = 'cliente', id = 'usr-cliente-1', email = 'cliente@teste.com') => {
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

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const validPayload = {
        posto_id: 1,
        endereco_entrega: 'Marina da Glória, Píer B',
        ponto_referencia: 'Vaga 14 - Lancha Marlin',
        tipo_local: LocationType.MARINA,
        destino_latitude: -22.920800,
        destino_longitude: -43.172900,
        itens: [
            {
                combustivel_id: 1,
                quantidade_litros: 100,
                valor_unitario: 6.50
            },
            {
                combustivel_id: 2,
                quantidade_litros: 50,
                valor_unitario: 7.20
            }
        ]
    };

    describe('POST /api/v1/orders', () => {
        it('TC-ORD-API-01: deve rejeitar requisição sem autenticação com status 401', async () => {
            const res = await request(app).post('/api/v1/orders').send(validPayload);
            expect(res.status).toBe(401);
        });

        it('TC-ORD-API-02: deve criar pedido com sucesso retornando 201 e valor_total calculado', async () => {
            mockAuthUser('cliente', 'usr-cliente-1');

            // 1. Mock de busca do cliente vinculado ao usuario_id
            const mockCustomer = { id: 10, usuario_id: 'usr-cliente-1', nome: 'Cliente Teste' };
            const mockOrder = {
                id: 100,
                cliente_id: 10,
                posto_id: 1,
                status: OrderStatus.PENDENTE,
                valor_total: 1010.00,
                endereco_entrega: validPayload.endereco_entrega,
                ponto_referencia: validPayload.ponto_referencia,
                tipo_local: validPayload.tipo_local,
                destino_latitude: validPayload.destino_latitude,
                destino_longitude: validPayload.destino_longitude
            };
            const mockItems = [
                { id: 1, pedido_id: 100, combustivel_id: 1, quantidade_litros: 100, valor_unitario: 6.50, subtotal: 650.00 },
                { id: 2, pedido_id: 100, combustivel_id: 2, quantidade_litros: 50, valor_unitario: 7.20, subtotal: 360.00 }
            ];

            // Implementação sequencial do mock do supabase.from
            supabase.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockCustomer, error: null })
                        })
                    })
                }) // Busca cliente
                .mockReturnValueOnce({
                    insert: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: [mockOrder], error: null })
                    })
                }) // Insere pedido
                .mockReturnValueOnce({
                    insert: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: mockItems, error: null })
                    })
                }); // Insere itens

            const res = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', 'Bearer valid-customer-token')
                .send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id', 100);
            expect(res.body).toHaveProperty('valor_total', 1010.00);
            expect(res.body.itens.length).toBe(2);
        });

        it('TC-ORD-API-03: deve rejeitar com 400 se itens estiverem vazios', async () => {
            mockAuthUser('cliente');

            const res = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', 'Bearer valid-token')
                .send({ ...validPayload, itens: [] });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('GET /api/v1/orders', () => {
        it('TC-ORD-API-04: deve rejeitar sem autenticação com status 401', async () => {
            const res = await request(app).get('/api/v1/orders');
            expect(res.status).toBe(401);
        });

        it('TC-ORD-API-05: deve listar pedidos do cliente autenticado com status 200', async () => {
            mockAuthUser('cliente', 'usr-cliente-1');

            const mockCustomer = { id: 10, usuario_id: 'usr-cliente-1' };
            const mockOrders = [
                { id: 100, cliente_id: 10, valor_total: 1010.00, status: OrderStatus.PENDENTE }
            ];

            supabase.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockCustomer, error: null })
                        })
                    })
                }) // Busca cliente
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: mockOrders, error: null })
                    })
                }); // Busca pedidos

            const res = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('id', 100);
        });

        it('TC-ORD-API-06: deve permitir que posto_admin liste pedidos do posto com status 200', async () => {
            mockAuthUser('posto_admin', 'usr-admin-1');

            const mockOrders = [
                { id: 100, posto_id: 1, valor_total: 1010.00, status: OrderStatus.PENDENTE }
            ];

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: mockOrders, error: null })
                })
            });

            const res = await request(app)
                .get('/api/v1/orders?posto_id=1')
                .set('Authorization', 'Bearer valid-admin-token');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0]).toHaveProperty('posto_id', 1);
        });
    });

    describe('GET /api/v1/orders/:id', () => {
        it('TC-ORD-API-07: deve detalhar pedido com seus itens com status 200', async () => {
            mockAuthUser('cliente', 'usr-cliente-1');

            const mockCustomer = { id: 10, usuario_id: 'usr-cliente-1' };
            const mockOrder = {
                id: 100,
                cliente_id: 10,
                valor_total: 1010.00,
                status: OrderStatus.PENDENTE,
                itens_pedido: [
                    { id: 1, combustivel_id: 1, quantidade_litros: 100, subtotal: 650.00 }
                ]
            };

            supabase.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockCustomer, error: null })
                        })
                    })
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockOrder, error: null })
                        })
                    })
                });

            const res = await request(app)
                .get('/api/v1/orders/100')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', 100);
            expect(res.body).toHaveProperty('itens_pedido');
        });

        it('TC-ORD-API-08: deve retornar 404 se o pedido não existir', async () => {
            mockAuthUser('posto_admin');

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/orders/999')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(404);
        });

        it('TC-ORD-API-09: deve retornar 403 se cliente tentar acessar pedido de outro cliente', async () => {
            mockAuthUser('cliente', 'usr-cliente-1');

            const mockCustomer = { id: 10, usuario_id: 'usr-cliente-1' };
            const mockOtherOrder = { id: 200, cliente_id: 99, status: OrderStatus.PENDENTE };

            supabase.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockCustomer, error: null })
                        })
                    })
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockOtherOrder, error: null })
                        })
                    })
                });

            const res = await request(app)
                .get('/api/v1/orders/200')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('PATCH /api/v1/orders/:id/status', () => {
        it('TC-ORD-API-10: deve atualizar status do pedido para posto_admin com status 200', async () => {
            mockAuthUser('posto_admin');

            const mockUpdated = { id: 100, status: OrderStatus.CONFIRMADO_POSTO };
            supabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: [mockUpdated], error: null })
                    })
                })
            });

            const res = await request(app)
                .patch('/api/v1/orders/100/status')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: OrderStatus.CONFIRMADO_POSTO });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', OrderStatus.CONFIRMADO_POSTO);
        });

        it('TC-ORD-API-11: deve rejeitar com 403 se usuário cliente tentar atualizar status', async () => {
            mockAuthUser('cliente');

            const res = await request(app)
                .patch('/api/v1/orders/100/status')
                .set('Authorization', 'Bearer valid-token')
                .send({ status: OrderStatus.CONFIRMADO_POSTO });

            expect(res.status).toBe(403);
        });

        it('TC-ORD-API-12: deve rejeitar com 400 se o status for inválido', async () => {
            mockAuthUser('posto_admin');

            const res = await request(app)
                .patch('/api/v1/orders/100/status')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ status: 'STATUS_INVALIDO' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/v1/orders/:id/cancel', () => {
        it('TC-ORD-API-13: deve permitir cancelamento pelo cliente quando status for PENDENTE com status 200', async () => {
            mockAuthUser('cliente', 'usr-cliente-1');

            const mockCustomer = { id: 10, usuario_id: 'usr-cliente-1' };
            const mockOrder = { id: 100, cliente_id: 10, status: OrderStatus.PENDENTE };
            const mockCanceled = { id: 100, cliente_id: 10, status: OrderStatus.CANCELADO };

            supabase.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockCustomer, error: null })
                        })
                    })
                }) // Busca cliente
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockOrder, error: null })
                        })
                    })
                }) // Busca pedido
                .mockReturnValueOnce({
                    update: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({ data: [mockCanceled], error: null })
                        })
                    })
                }); // Atualiza para CANCELADO

            const res = await request(app)
                .post('/api/v1/orders/100/cancel')
                .set('Authorization', 'Bearer valid-token')
                .send({ motivo: 'Mudança de planos na marina' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', OrderStatus.CANCELADO);
        });

        it('TC-ORD-API-14: deve rejeitar cancelamento pelo cliente se pedido já estiver EM_TRANSPORTE', async () => {
            mockAuthUser('cliente', 'usr-cliente-1');

            const mockCustomer = { id: 10, usuario_id: 'usr-cliente-1' };
            const mockOrder = { id: 100, cliente_id: 10, status: OrderStatus.EM_TRANSPORTE };

            supabase.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockCustomer, error: null })
                        })
                    })
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockOrder, error: null })
                        })
                    })
                });

            const res = await request(app)
                .post('/api/v1/orders/100/cancel')
                .set('Authorization', 'Bearer valid-token')
                .send({ motivo: 'Tarde demais' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', expect.stringMatching(/não pode ser cancelado/i));
        });
    });
});
