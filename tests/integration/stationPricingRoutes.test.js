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
});
