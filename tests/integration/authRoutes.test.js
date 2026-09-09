const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');

jest.mock('../../src/config/supabaseClient', () => {
    return {
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            getUser: jest.fn(),
            admin: {
                createUser: jest.fn()
            }
        },
        from: jest.fn().mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
    };
});

describe('Integration: Auth Routes (/api/v1/auth)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/signup/customer', () => {
        const validPayload = {
            name: 'Carlos Cliente',
            email: 'carlos@cliente.com',
            password: 'secretPassword123',
            cpf: '52998224725',
            phone: '21999991111'
        };

        it('TC-API-01: deve registrar cliente civil com sucesso retornando status 201 e role "cliente"', async () => {
            supabase.auth.signUp.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'usr-carlos-123',
                        email: 'carlos@cliente.com',
                        user_metadata: {
                            role: 'cliente',
                            name: 'Carlos Cliente',
                            cpf: '52998224725',
                            phone: '21999991111'
                        }
                    },
                    session: {
                        access_token: 'fake-access-token',
                        refresh_token: 'fake-refresh-token'
                    }
                },
                error: null
            });

            const res = await request(app)
                .post('/api/v1/auth/signup/customer')
                .send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.role).toBe('cliente');
            expect(res.body.user.email).toBe('carlos@cliente.com');
            expect(res.body).toHaveProperty('message', 'Cliente cadastrado com sucesso.');
        });

        it('TC-API-02: deve retornar 409 quando o usuário/email já existir no Supabase', async () => {
            supabase.auth.signUp.mockResolvedValueOnce({
                data: { user: null, session: null },
                error: { message: 'User already registered', status: 422 }
            });

            const res = await request(app)
                .post('/api/v1/auth/signup/customer')
                .send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toMatch(/já cadastrado/i);
        });

        it('TC-API-03: deve retornar 400 se os dados de validação forem inválidos', async () => {
            const res = await request(app)
                .post('/api/v1/auth/signup/customer')
                .send({ email: 'invalido' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Erro de validação');
            expect(res.body).toHaveProperty('details');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('TC-API-04: deve autenticar com sucesso e retornar tokens e role', async () => {
            supabase.auth.signInWithPassword.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'usr-123',
                        email: 'usuario@teste.com',
                        user_metadata: {
                            role: 'cliente',
                            name: 'Usuario Teste'
                        }
                    },
                    session: {
                        access_token: 'jwt-access-token-123',
                        refresh_token: 'jwt-refresh-token-456'
                    }
                },
                error: null
            });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'usuario@teste.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken', 'jwt-access-token-123');
            expect(res.body).toHaveProperty('refreshToken', 'jwt-refresh-token-456');
            expect(res.body.user).toEqual({
                id: 'usr-123',
                email: 'usuario@teste.com',
                role: 'cliente',
                name: 'Usuario Teste'
            });
        });

        it('TC-API-05: deve retornar 401 quando as credenciais forem inválidas', async () => {
            supabase.auth.signInWithPassword.mockResolvedValueOnce({
                data: { user: null, session: null },
                error: { message: 'Invalid login credentials', status: 400 }
            });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'usuario@teste.com',
                    password: 'wrongPassword'
                });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Credenciais inválidas.');
        });
    });

    describe('GET /api/v1/auth/me', () => {
        it('TC-API-06: deve retornar os dados do perfil quando fornecido token Bearer válido', async () => {
            supabase.auth.getUser.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'usr-123',
                        email: 'posto@rede.com',
                        user_metadata: {
                            role: 'posto_admin',
                            name: 'Gerente Posto'
                        }
                    }
                },
                error: null
            });

            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', 'usr-123');
            expect(res.body).toHaveProperty('role', 'posto_admin');
            expect(res.body).toHaveProperty('email', 'posto@rede.com');
        });

        it('TC-API-07: deve retornar 401 quando requisição não possui token', async () => {
            const res = await request(app).get('/api/v1/auth/me');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /api/v1/auth/admin/create-courier', () => {
        const courierPayload = {
            name: 'Beto Entregador',
            email: 'beto@posto.com',
            password: 'password123',
            cpf: '52998224725',
            phone: '21988889999',
            vehicleDescription: 'Caminhonete com Tanque 1000L',
            licensePlate: 'XYZ9876'
        };

        it('TC-API-08: deve permitir que posto_admin crie entregador com sucesso', async () => {
            // Mock autenticação do posto_admin
            supabase.auth.getUser.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'admin-uuid-1',
                        email: 'admin@posto.com',
                        user_metadata: {
                            role: 'posto_admin'
                        }
                    }
                },
                error: null
            });

            // Mock criação do entregador
            supabase.auth.signUp.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'courier-uuid-9',
                        email: 'beto@posto.com',
                        user_metadata: {
                            role: 'entregador',
                            name: 'Beto Entregador'
                        }
                    }
                },
                error: null
            });

            const res = await request(app)
                .post('/api/v1/auth/admin/create-courier')
                .set('Authorization', 'Bearer token-do-posto')
                .send(courierPayload);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('courier');
            expect(res.body.courier.role).toBe('entregador');
            expect(res.body).toHaveProperty('message', 'Entregador cadastrado com sucesso.');
        });

        it('TC-API-09: deve bloquear com 403 se cliente tentar criar entregador', async () => {
            supabase.auth.getUser.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'cliente-uuid-2',
                        email: 'cliente@civil.com',
                        user_metadata: {
                            role: 'cliente'
                        }
                    }
                },
                error: null
            });

            const res = await request(app)
                .post('/api/v1/auth/admin/create-courier')
                .set('Authorization', 'Bearer token-do-cliente')
                .send(courierPayload);

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error', 'Acesso negado: seu perfil não possui permissão para acessar este recurso.');
        });

        it('TC-API-10: deve retornar 401 se não houver autenticação', async () => {
            const res = await request(app)
                .post('/api/v1/auth/admin/create-courier')
                .send(courierPayload);

            expect(res.status).toBe(401);
        });
    });
});
