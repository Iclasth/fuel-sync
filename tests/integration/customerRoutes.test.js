const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');

jest.mock('../../src/config/supabaseClient', () => {
    const mockFrom = jest.fn();
    return {
        auth: {
            getUser: jest.fn()
        },
        from: mockFrom
    };
});

describe('Integration: Customer Routes (/customers - Authenticated)', () => {
    const validToken = 'valid-customer-jwt-token';
    const mockAuthSuccess = () => {
        supabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id: 'usr-cliente-1',
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

    describe('Autenticação Obrigatória nas Rotas', () => {
        it('TC-CUST-AUTH-01: deve rejeitar com 401 qualquer rota de /customers sem token', async () => {
            const resPost = await request(app).post('/customers').send({ name: 'Teste', cpf: '52998224725' });
            const resGet = await request(app).get('/customers');
            const resPut = await request(app).put('/customers/1').send({ name: 'Novo Nome' });
            const resDelete = await request(app).delete('/customers/1');

            expect(resPost.status).toBe(401);
            expect(resGet.status).toBe(401);
            expect(resPut.status).toBe(401);
            expect(resDelete.status).toBe(401);
        });

        it('TC-CUST-AUTH-02: deve rejeitar com 401 quando o token for inválido', async () => {
            supabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Invalid token' }
            });

            const res = await request(app)
                .get('/customers')
                .set('Authorization', 'Bearer token-invalido');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Token inválido ou expirado.');
        });
    });

    describe('POST /customers', () => {
        const validPayload = {
            name: 'Maria Gasolina da Silva',
            cpf: '52998224725'
        };

        it('TC-CUST-API-01: deve cadastrar cliente com sucesso retornando 201', async () => {
            mockAuthSuccess();

            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValueOnce({
                    select: jest.fn().mockResolvedValueOnce({
                        data: [{ id: 1, name: 'Maria Gasolina da Silva', cpf: '52998224725' }],
                        error: null
                    })
                })
            });

            const res = await request(app)
                .post('/customers')
                .set('Authorization', `Bearer ${validToken}`)
                .send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id', 1);
            expect(res.body).toHaveProperty('name', 'Maria Gasolina da Silva');
            expect(res.body).toHaveProperty('cpf', '52998224725');
        });

        it('TC-CUST-API-02: deve retornar 409 quando o CPF já estiver cadastrado', async () => {
            mockAuthSuccess();

            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValueOnce({
                    select: jest.fn().mockResolvedValueOnce({
                        data: null,
                        error: { code: '23505', message: 'duplicate key value violates unique constraint' }
                    })
                })
            });

            const res = await request(app)
                .post('/customers')
                .set('Authorization', `Bearer ${validToken}`)
                .send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Já existe um cliente cadastrado com este CPF.');
        });

        it('TC-CUST-API-03: deve retornar 400 se os dados forem inválidos', async () => {
            mockAuthSuccess();

            const res = await request(app)
                .post('/customers')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'A', cpf: '123' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Erro de validação');
            expect(res.body).toHaveProperty('details');
        });
    });

    describe('GET /customers', () => {
        it('TC-CUST-API-04: deve retornar lista de clientes com status 200', async () => {
            mockAuthSuccess();

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    data: [
                        { id: 1, name: 'Cliente 1', cpf: '52998224725' },
                        { id: 2, name: 'Cliente 2', cpf: '73784860086' }
                    ],
                    error: null
                })
            });

            const res = await request(app)
                .get('/customers')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
        });
    });

    describe('PUT /customers/:id', () => {
        it('TC-CUST-API-05: deve atualizar cliente com sucesso retornando 200', async () => {
            mockAuthSuccess();

            supabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        select: jest.fn().mockResolvedValueOnce({
                            data: [{ id: 1, name: 'Nome Atualizado', cpf: '52998224725' }],
                            error: null
                        })
                    })
                })
            });

            const res = await request(app)
                .put('/customers/1')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Nome Atualizado' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Nome Atualizado');
        });

        it('TC-CUST-API-06: deve retornar 404 quando cliente não for encontrado', async () => {
            mockAuthSuccess();

            supabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        select: jest.fn().mockResolvedValueOnce({
                            data: [],
                            error: null
                        })
                    })
                })
            });

            const res = await request(app)
                .put('/customers/999')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Nome Inexistente' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Cliente não encontrado.');
        });
    });

    describe('DELETE /customers/:id', () => {
        it('TC-CUST-API-07: deve deletar cliente com sucesso retornando 204', async () => {
            mockAuthSuccess();

            supabase.from.mockReturnValueOnce({
                delete: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        select: jest.fn().mockResolvedValueOnce({
                            data: [{ id: 1 }],
                            error: null
                        })
                    })
                })
            });

            const res = await request(app)
                .delete('/customers/1')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(204);
        });

        it('TC-CUST-API-08: deve retornar 404 ao tentar deletar cliente inexistente', async () => {
            mockAuthSuccess();

            supabase.from.mockReturnValueOnce({
                delete: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        select: jest.fn().mockResolvedValueOnce({
                            data: [],
                            error: null
                        })
                    })
                })
            });

            const res = await request(app)
                .delete('/customers/999')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Cliente não encontrado.');
        });
    });
});
