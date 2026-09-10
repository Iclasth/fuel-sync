const authMiddleware = require('../../src/common/middlewares/authMiddleware');
const supabase = require('../../src/config/supabaseClient');

jest.mock('../../src/config/supabaseClient', () => ({
    auth: {
        getUser: jest.fn()
    }
}));

describe('Unit: authMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    it('TC-SEC-01: deve retornar 401 se o header Authorization não for enviado', async () => {
        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Token de autenticação não fornecido.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('TC-SEC-02: deve retornar 401 se o header Authorization não iniciar com "Bearer "', async () => {
        req.headers.authorization = 'Basic dXNlcjpwYXNz';

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Token de autenticação com formato inválido. Use: Bearer <token>'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('TC-SEC-03: deve retornar 401 se o token for inválido ou expirado', async () => {
        req.headers.authorization = 'Bearer token-invalido';
        supabase.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Invalid JWT token' }
        });

        await authMiddleware(req, res, next);

        expect(supabase.auth.getUser).toHaveBeenCalledWith('token-invalido');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Token inválido ou expirado.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('TC-SEC-04: deve anexar req.user e chamar next() quando o token for válido', async () => {
        req.headers.authorization = 'Bearer token-valido';
        supabase.auth.getUser.mockResolvedValueOnce({
            data: {
                user: {
                    id: 'usr-uuid-1234',
                    email: 'cliente@teste.com',
                    user_metadata: {
                        role: 'cliente',
                        nome: 'João Silva',
                        cpf: '52998224725'
                    }
                }
            },
            error: null
        });

        await authMiddleware(req, res, next);

        expect(supabase.auth.getUser).toHaveBeenCalledWith('token-valido');
        expect(req.user).toEqual({
            id: 'usr-uuid-1234',
            email: 'cliente@teste.com',
            role: 'cliente',
            metadata: {
                role: 'cliente',
                nome: 'João Silva',
                cpf: '52998224725'
            }
        });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
