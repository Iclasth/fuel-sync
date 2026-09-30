const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');

jest.mock('../../src/config/supabaseClient', () => ({
    auth: {
        getUser: jest.fn()
    },
    from: jest.fn()
}));

describe('Integration: Station Pricing & Admin Assignment Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUser = (role = 'admin_geral', id = 'usr-admin-1') => {
        supabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id,
                    email: `${role}@fuelsync.com`,
                    user_metadata: { role, name: 'Admin User' }
                }
            },
            error: null
        });
    };

    it('POST /api/v1/stations/:stationId/admins: deve vincular administrador com sucesso quando for admin_geral', async () => {
        mockUser('admin_geral');
        const mockLink = { id: 'link-uuid', posto_id: 1, user_id: 'usr-posto-admin-1' };

        supabase.from.mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ data: [mockLink], error: null })
            })
        });

        const res = await request(app)
            .post('/api/v1/stations/1/admins')
            .set('Authorization', 'Bearer valid-token')
            .send({ user_id: 'usr-posto-admin-1' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(mockLink);
    });

    it('POST /api/v1/stations/:stationId/admins: deve retornar 403 se usuário for cliente', async () => {
        mockUser('cliente');

        const res = await request(app)
            .post('/api/v1/stations/1/admins')
            .set('Authorization', 'Bearer valid-token')
            .send({ user_id: 'usr-posto-admin-1' });

        expect(res.status).toBe(403);
    });

    it('GET /api/v1/stations/:stationId/admins: deve listar administradores vinculados', async () => {
        mockUser('posto_admin');
        const mockLinks = [{ id: 'link-1', posto_id: 1, user_id: 'usr-posto-admin-1' }];

        supabase.from.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: mockLinks, error: null })
            })
        });

        const res = await request(app)
            .get('/api/v1/stations/1/admins')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockLinks);
    });

    describe('GET /api/v1/stations/audit/price-history', () => {
        it('deve retornar lista de histórico de auditoria de preços com status 200 para admin_geral', async () => {
            mockUser('admin_geral');
            const mockAuditRecords = [
                {
                    id: 'audit-uuid-1',
                    posto_id: 1,
                    combustivel_id: 2,
                    preco_anterior: '5.89',
                    preco_novo: '6.15',
                    alterado_em: '2026-09-30T10:00:00Z',
                    alterado_por: 'user-uuid-1',
                    posto: { id: 1, nome_fantasia: 'Posto Marina', cnpj: '12345678000199' },
                    combustivel: { id: 2, nome: 'Gasolina Marítima', unidade_medida: 'LITRO' }
                }
            ];

            const mockUsers = [
                { id: 'user-uuid-1', nome: 'Gestor Posto', email: 'gestor@posto.com', role: 'posto_admin' }
            ];

            // 1ª chamada: historico_precos_combustivel
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({ data: mockAuditRecords, error: null })
                })
            });

            // 2ª chamada: perfis_usuarios para enriquecimento
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({ data: mockUsers, error: null })
                })
            });

            const res = await request(app)
                .get('/api/v1/stations/audit/price-history')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].preco_novo).toBe('6.15');
            expect(res.body[0].usuario.nome).toBe('Gestor Posto');
        });

        it('deve aplicar filtros de stationId e combustivelId na consulta de auditoria', async () => {
            mockUser('admin_geral');

            const orderMock = jest.fn();
            const eqCombustivelMock = jest.fn().mockReturnValue({ order: orderMock });
            const eqStationMock = jest.fn().mockReturnValue({ eq: eqCombustivelMock });

            orderMock.mockResolvedValue({ data: [], error: null });

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    order: jest.fn(),
                    eq: eqStationMock
                })
            });

            const res = await request(app)
                .get('/api/v1/stations/audit/price-history?stationId=1&combustivelId=2')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('deve retornar 403 se usuário for cliente comum', async () => {
            mockUser('cliente');

            const res = await request(app)
                .get('/api/v1/stations/audit/price-history')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/v1/stations/:stationId/fuels (Isolamento de Posto)', () => {
        it('deve permitir listar combustíveis quando posto_admin for vinculado ao posto', async () => {
            mockUser('posto_admin', 'usr-posto-1');
            const mockFuels = [
                { id: 10, posto_id: 1, combustivel_id: 2, preco_litro: 5.89, combustiveis: { nome: 'Gasolina' } }
            ];

            // 1ª chamada: validação de acesso em posto_administradores
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { id: 'admin-link-1', user_id: 'usr-posto-1', posto_id: 1 },
                                error: null
                            })
                        })
                    })
                })
            });

            // 2ª chamada: consulta em posto_combustiveis
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

        it('deve bloquear posto_admin com 403 se tentar consultar combustíveis de outro posto', async () => {
            mockUser('posto_admin', 'usr-posto-1');

            // Validação de acesso falha (posto_administradores)
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
                .get('/api/v1/stations/99/fuels')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(403);
            expect(res.body.error).toMatch(/perfil n.*administra este posto/i);
        });
    });

    describe('DELETE /api/v1/stations/:stationId/fuels/:combustivelId (Remoção do Catálogo do Posto)', () => {
        it('deve remover combustível do posto com sucesso quando posto_admin for vinculado', async () => {
            mockUser('posto_admin', 'usr-posto-1');
            const mockDeleted = { id: 10, posto_id: 1, combustivel_id: 2, preco_litro: 5.89 };

            // 1ª chamada: validação de acesso em posto_administradores
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { id: 'admin-link-1', user_id: 'usr-posto-1', posto_id: 1 },
                                error: null
                            })
                        })
                    })
                })
            });

            // 2ª chamada: deleção em posto_combustiveis
            supabase.from.mockReturnValueOnce({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({ data: [mockDeleted], error: null })
                        })
                    })
                })
            });

            const res = await request(app)
                .delete('/api/v1/stations/1/fuels/2')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDeleted);
        });

        it('deve bloquear com 403 se posto_admin tentar remover combustível de outro posto', async () => {
            mockUser('posto_admin', 'usr-posto-1');

            // Validação de acesso rejeita
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
                .delete('/api/v1/stations/99/fuels/2')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(403);
        });

        it('deve permitir admin_geral remover combustível de qualquer posto', async () => {
            mockUser('admin_geral', 'usr-admin-geral');
            const mockDeleted = { id: 10, posto_id: 99, combustivel_id: 2 };

            // admin_geral não consulta posto_administradores
            supabase.from.mockReturnValueOnce({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({ data: [mockDeleted], error: null })
                        })
                    })
                })
            });

            const res = await request(app)
                .delete('/api/v1/stations/99/fuels/2')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDeleted);
        });
    });
});
