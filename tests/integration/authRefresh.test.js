const request = require('supertest');
const app = require('../../src/app');
const supabase = require('../../src/config/supabaseClient');

jest.mock('../../src/config/supabaseClient', () => ({
    auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
        refreshSession: jest.fn(),
    },
    from: jest.fn()
}));

describe('Integration: Auth Refresh Token (/api/v1/auth/refresh)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('TC-REFRESH-01: deve retornar 400 se refreshToken não for informado', async () => {
        const res = await request(app)
            .post('/api/v1/auth/refresh')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('TC-REFRESH-02: deve renovar a sessão com sucesso para refresh token válido', async () => {
        supabase.auth.refreshSession.mockResolvedValueOnce({
            data: {
                user: {
                    id: 'usr-renew-1',
                    email: 'operador@posto.com',
                    user_metadata: { role: 'posto_admin', name: 'Operador Chefe' }
                },
                session: {
                    access_token: 'new-jwt-token-123',
                    refresh_token: 'new-refresh-token-456'
                }
            },
            error: null
        });

        const res = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: 'valid-refresh-token' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken', 'new-jwt-token-123');
        expect(res.body).toHaveProperty('refreshToken', 'new-refresh-token-456');
        expect(res.body.user).toHaveProperty('role', 'posto_admin');
    });

    it('TC-REFRESH-03: deve retornar 401 se refresh token estiver expirado ou for inválido', async () => {
        supabase.auth.refreshSession.mockResolvedValueOnce({
            data: { user: null, session: null },
            error: { message: 'Invalid Refresh Token: Already Used' }
        });

        const res = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: 'expired-token' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });
});
