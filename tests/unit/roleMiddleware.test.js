const authorizeRole = require('../../src/common/middlewares/roleMiddleware');

describe('Unit: roleMiddleware (RBAC)', () => {
    let req, res, next;

    beforeEach(() => {
        req = { user: undefined };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    it('TC-RBAC-01: deve permitir acesso (next) quando o papel do usuário é exatamente o permitido', () => {
        req.user = { id: '123', role: 'posto_admin' };
        const middleware = authorizeRole('posto_admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('TC-RBAC-02: deve bloquear com 403 quando o papel não possui permissão', () => {
        req.user = { id: '123', role: 'cliente' };
        const middleware = authorizeRole('posto_admin');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Acesso negado: seu perfil não possui permissão para acessar este recurso.'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('TC-RBAC-03: deve suportar múltiplos papéis autorizados', () => {
        req.user = { id: '456', role: 'entregador' };
        const middleware = authorizeRole('posto_admin', 'entregador');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('TC-RBAC-04: deve retornar 403 caso req.user não exista', () => {
        req.user = undefined;
        const middleware = authorizeRole('cliente');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: expect.stringMatching(/acesso negado/i)
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('TC-RBAC-05: deve conceder acesso a admin_geral em rotas destinadas a posto_admin', () => {
        req.user = { id: '789', role: 'admin_geral' };
        const middleware = authorizeRole('posto_admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('TC-RBAC-06: deve conceder acesso a admin_geral em rotas exclusivas de admin_geral', () => {
        req.user = { id: '789', role: 'admin_geral' };
        const middleware = authorizeRole('admin_geral');

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('TC-RBAC-07: deve bloquear admin_geral em rotas exclusivas de cliente', () => {
        req.user = { id: '789', role: 'admin_geral' };
        const middleware = authorizeRole('cliente');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
