const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');

const createQueryBuilder = () => {
    const qb = {};
    qb.insert = jest.fn().mockReturnValue(qb);
    qb.select = jest.fn().mockReturnValue(qb);
    qb.update = jest.fn().mockReturnValue(qb);
    qb.delete = jest.fn().mockReturnValue(qb);
    qb.upsert = jest.fn().mockReturnValue(qb);
    qb.eq = jest.fn().mockReturnValue(qb);
    qb.or = jest.fn().mockReturnValue(qb);
    qb.order = jest.fn().mockReturnValue(qb);
    qb.limit = jest.fn().mockReturnValue(qb);
    qb.single = jest.fn().mockResolvedValue({ data: null, error: null });
    qb.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    return qb;
};

jest.mock('../../src/config/supabaseClient', () => {
    return {
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            getUser: jest.fn(),
            refreshSession: jest.fn(),
            admin: {
                createUser: jest.fn()
            }
        },
        from: jest.fn(() => createQueryBuilder())
    };
});

describe('Integration: Auth Routes (/api/v1/auth)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        supabase.from.mockImplementation(() => createQueryBuilder());
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

        it('TC-API-01-A: deve persistir registro na tabela clientes e perfis_usuarios ao registrar cliente civil', async () => {
            const upsertSpy = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({ data: { id: 99 }, error: null })
                })
            });

            supabase.from.mockImplementation((table) => {
                const qb = createQueryBuilder();
                if (table === 'perfis_usuarios') {
                    qb.upsert = upsertSpy;
                }
                if (table === 'clientes') {
                    qb.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
                    qb.upsert = upsertSpy;
                }
                return qb;
            });

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
            expect(supabase.from).toHaveBeenCalledWith('perfis_usuarios');
            expect(supabase.from).toHaveBeenCalledWith('clientes');
            expect(upsertSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    usuario_id: 'usr-carlos-123',
                    cpf: '52998224725',
                    email: 'carlos@cliente.com',
                    telefone: '21999991111'
                }),
                { onConflict: 'usuario_id' }
            );
        });

        it('TC-API-01-B: deve rejeitar com 409 quando o CPF já estiver cadastrado na tabela clientes (pré-validação)', async () => {
            supabase.from.mockImplementation((table) => {
                const qb = createQueryBuilder();
                if (table === 'clientes') {
                    qb.maybeSingle = jest.fn().mockResolvedValue({
                        data: { id: 1, cpf: '52998224725', email: 'outro@cliente.com' },
                        error: null
                    });
                }
                return qb;
            });

            const res = await request(app)
                .post('/api/v1/auth/signup/customer')
                .send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'O CPF informado já está cadastrado no sistema.');
            expect(supabase.auth.signUp).not.toHaveBeenCalled();
        });

        it('TC-API-01-C: deve rejeitar com 409 quando o email já estiver cadastrado na tabela clientes (pré-validação)', async () => {
            supabase.from.mockImplementation((table) => {
                const qb = createQueryBuilder();
                if (table === 'clientes') {
                    qb.maybeSingle = jest.fn().mockResolvedValue({
                        data: { id: 2, cpf: '11144477735', email: 'carlos@cliente.com' },
                        error: null
                    });
                }
                return qb;
            });

            const res = await request(app)
                .post('/api/v1/auth/signup/customer')
                .send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'O e-mail informado já está cadastrado no sistema.');
            expect(supabase.auth.signUp).not.toHaveBeenCalled();
        });

        it('TC-API-01-D: deve retornar 409 se a persistência em clientes falhar por violação de unicidade', async () => {
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

            supabase.from.mockImplementation((table) => {
                const qb = createQueryBuilder();
                if (table === 'clientes') {
                    qb.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
                    qb.upsert = jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            maybeSingle: jest.fn().mockResolvedValue({
                                data: null,
                                error: { code: '23505', message: 'duplicate key value violates unique constraint' }
                            })
                        })
                    });
                }
                return qb;
            });

            const res = await request(app)
                .post('/api/v1/auth/signup/customer')
                .send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body.error).toMatch(/já está cadastrado/i);
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
            expect(res.body.error).toMatch(/já.*cadastrado/i);
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

        it('TC-API-04-A: deve retornar role atualizada da tabela perfis_usuarios no login quando for modificada no banco', async () => {
            supabase.auth.signInWithPassword.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'usr-promovido-456',
                        email: 'admin@posto.com',
                        user_metadata: {
                            role: 'cliente', // No Auth ainda está cliente
                            name: 'Admin Posto'
                        }
                    },
                    session: {
                        access_token: 'jwt-admin-token',
                        refresh_token: 'jwt-refresh-token'
                    }
                },
                error: null
            });

            // No banco perfis_usuarios, o usuário foi alterado para 'posto_admin'
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({
                    data: { role: 'posto_admin', nome: 'Admin Posto Promovido' },
                    error: null
                })
            });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'admin@posto.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body.user.role).toBe('posto_admin');
            expect(res.body.user.name).toBe('Admin Posto Promovido');
        });

        it('TC-API-04-B: deve realizar auto-recuperação (self-healing) e provisionar na tabela clientes se cliente logar sem registro prévio', async () => {
            supabase.auth.signInWithPassword.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'usr-cliente-sem-tabela',
                        email: 'semtabela@cliente.com',
                        user_metadata: {
                            role: 'cliente',
                            name: 'Cliente Sem Tabela',
                            cpf: '52998224725',
                            phone: '21988887777'
                        }
                    },
                    session: {
                        access_token: 'jwt-access-token',
                        refresh_token: 'jwt-refresh-token'
                    }
                },
                error: null
            });

            const upsertSpy = jest.fn().mockReturnThis();
            supabase.from.mockImplementation((table) => {
                const qb = createQueryBuilder();
                if (table === 'perfis_usuarios') {
                    qb.maybeSingle = jest.fn().mockResolvedValue({
                        data: { role: 'cliente', nome: 'Cliente Sem Tabela' },
                        error: null
                    });
                }
                if (table === 'clientes') {
                    qb.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
                    qb.upsert = upsertSpy;
                }
                return qb;
            });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'semtabela@cliente.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(upsertSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    usuario_id: 'usr-cliente-sem-tabela',
                    cpf: '52998224725',
                    email: 'semtabela@cliente.com'
                }),
                { onConflict: 'usuario_id' }
            );
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

    describe('POST /api/v1/auth/refresh', () => {
        it('TC-API-REFRESH-01: deve renovar a sessão com sucesso retornando novo accessToken e refreshToken', async () => {
            supabase.auth.refreshSession.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'usr-123',
                        email: 'usuario@teste.com',
                        user_metadata: { role: 'cliente', name: 'Usuario Teste' }
                    },
                    session: {
                        access_token: 'new-access-token-999',
                        refresh_token: 'new-refresh-token-888'
                    }
                },
                error: null
            });

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'valid-refresh-token' });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                accessToken: 'new-access-token-999',
                refreshToken: 'new-refresh-token-888',
                user: {
                    id: 'usr-123',
                    email: 'usuario@teste.com',
                    role: 'cliente',
                    name: 'Usuario Teste'
                }
            });
        });

        it('TC-API-REFRESH-02: deve retornar 400 se refreshToken não for enviado', async () => {
            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Erro de validação');
            expect(res.body.details).toContain('O campo "refreshToken" é obrigatório.');
        });

        it('TC-API-REFRESH-03: deve retornar 401 se refreshSession falhar no Supabase', async () => {
            supabase.auth.refreshSession.mockResolvedValueOnce({
                data: { user: null, session: null },
                error: { message: 'Invalid Refresh Token: Refresh Token Not Found', status: 401 }
            });

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'expired-or-revoked-token' });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Sessão expirada ou refresh token inválido.');
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

        it('TC-API-08-A: deve persistir entregador na tabela entregadores associado ao posto', async () => {
            supabase.auth.getUser.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'admin-uuid-1',
                        email: 'admin@posto.com',
                        user_metadata: { role: 'posto_admin' }
                    }
                },
                error: null
            });

            supabase.auth.signUp.mockResolvedValueOnce({
                data: {
                    user: {
                        id: 'courier-uuid-10',
                        email: 'novo@entregador.com',
                        user_metadata: { role: 'entregador', name: 'Novo Entregador' }
                    }
                },
                error: null
            });

            // 1. Busca posto_administradores
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { posto_id: 2 },
                            error: null
                        })
                    })
                })
            });

            // 2. Insert perfis_usuarios
            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockResolvedValue({ data: null, error: null })
            });

            // 3. Insert entregadores
            const mockCourierRow = {
                id: 5,
                usuario_id: 'courier-uuid-10',
                posto_id: 2,
                nome: 'Novo Entregador',
                status: 'DISPONIVEL'
            };
            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                        data: [mockCourierRow],
                        error: null
                    })
                })
            });

            const res = await request(app)
                .post('/api/v1/auth/admin/create-courier')
                .set('Authorization', 'Bearer token-do-posto')
                .send({ ...courierPayload, email: 'novo@entregador.com' });

            expect(res.status).toBe(201);
            expect(res.body.courier).toHaveProperty('entregador_id', 5);
            expect(res.body.courier).toHaveProperty('posto_id', 2);
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
