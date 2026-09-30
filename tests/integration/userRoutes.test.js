const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');

jest.mock('../../src/config/supabaseClient', () => ({
    auth: {
        getUser: jest.fn(),
        admin: {
            updateUserById: jest.fn().mockResolvedValue({ data: {}, error: null })
        }
    },
    from: jest.fn()
}));

describe('Integration: User Management & RBAC Roles Routes (/api/v1/users)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockAuthUser = (role = 'admin_geral', id = 'usr-admin-1') => {
        supabase.auth.getUser.mockResolvedValue({
            data: {
                user: {
                    id,
                    email: `${role}@fuelsync.com`,
                    user_metadata: { role, name: 'Admin Master' }
                }
            },
            error: null
        });
    };

    const sampleUsers = [
        {
            id: 'usr-1',
            email: 'cliente@teste.com',
            nome: 'Carlos Cliente',
            role: 'cliente',
            created_at: '2026-09-01T10:00:00Z'
        },
        {
            id: 'usr-2',
            email: 'gestor@posto.com',
            nome: 'Fernanda Gestora',
            role: 'posto_admin',
            created_at: '2026-09-02T10:00:00Z'
        },
        {
            id: 'usr-3',
            email: 'entregador@navrotas.com',
            nome: 'Marcos Entregador',
            role: 'entregador',
            created_at: '2026-09-03T10:00:00Z'
        }
    ];

    describe('GET /api/v1/users', () => {
        it('deve listar todos os usuários com status 200 quando for admin_geral', async () => {
            mockAuthUser('admin_geral');

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({ data: sampleUsers, error: null })
                })
            });

            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(3);
            expect(res.body[0].email).toBe('cliente@teste.com');
        });

        it('deve retornar 403 Forbidden para perfis não autorizados (cliente, posto_admin, entregador)', async () => {
            for (const unauthorizedRole of ['cliente', 'posto_admin', 'entregador']) {
                mockAuthUser(unauthorizedRole);

                const res = await request(app)
                    .get('/api/v1/users')
                    .set('Authorization', 'Bearer valid-token');

                expect(res.status).toBe(403);
            }
        });

        it('deve aplicar filtro por role e retornar somente usuários com o papel correspondente', async () => {
            mockAuthUser('admin_geral');
            const gestoresOnly = [sampleUsers[1]];

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: gestoresOnly, error: null })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/users?role=posto_admin')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].role).toBe('posto_admin');
        });
    });

    describe('GET /api/v1/users/:id', () => {
        it('deve retornar detalhes de um usuário específico existente com status 200', async () => {
            mockAuthUser('admin_geral');
            const targetUser = sampleUsers[0];

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({ data: targetUser, error: null })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/users/usr-1')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('usr-1');
            expect(res.body.nome).toBe('Carlos Cliente');
        });

        it('deve retornar 404 se o usuário não for encontrado', async () => {
            mockAuthUser('admin_geral');

            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                    })
                })
            });

            const res = await request(app)
                .get('/api/v1/users/usr-inexistente')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/não encontrado/i);
        });
    });

    describe('PATCH /api/v1/users/:id/role', () => {
        it('deve atualizar o papel do usuário com sucesso para admin_geral', async () => {
            mockAuthUser('admin_geral', 'usr-admin-master');
            const targetUser = { ...sampleUsers[0] };
            const updatedUser = { ...targetUser, role: 'posto_admin' };

            // 1. getUserById check
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({ data: targetUser, error: null })
                    })
                })
            });

            // 2. update check
            supabase.from.mockReturnValueOnce({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({ data: [updatedUser], error: null })
                    })
                })
            });

            const res = await request(app)
                .patch('/api/v1/users/usr-1/role')
                .set('Authorization', 'Bearer valid-token')
                .send({ role: 'posto_admin' });

            expect(res.status).toBe(200);
            expect(res.body.role).toBe('posto_admin');
        });

        it('deve rejeitar com 400 se o campo role for omitido', async () => {
            mockAuthUser('admin_geral');

            const res = await request(app)
                .patch('/api/v1/users/usr-1/role')
                .set('Authorization', 'Bearer valid-token')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/role é obrigatório/i);
        });

        it('deve rejeitar com 400 se for informado um papel inexistente', async () => {
            mockAuthUser('admin_geral');

            const res = await request(app)
                .patch('/api/v1/users/usr-1/role')
                .set('Authorization', 'Bearer valid-token')
                .send({ role: 'super_hacker' });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/papel inválido/i);
        });

        it('deve rejeitar com 400 tentativa de auto-rebaixamento pelo próprio admin_geral logado', async () => {
            const adminId = 'usr-admin-1';
            mockAuthUser('admin_geral', adminId);

            const res = await request(app)
                .patch(`/api/v1/users/${adminId}/role`)
                .set('Authorization', 'Bearer valid-token')
                .send({ role: 'cliente' });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/próprio papel de administrador geral/i);
        });

        it('deve retornar 403 se um usuário não-admin tentar atualizar a role de alguém', async () => {
            mockAuthUser('posto_admin', 'usr-posto-1');

            const res = await request(app)
                .patch('/api/v1/users/usr-1/role')
                .set('Authorization', 'Bearer valid-token')
                .send({ role: 'admin_geral' });

            expect(res.status).toBe(403);
        });
    });
});
