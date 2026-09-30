const {
    validateCustomerSignup,
    validateLogin,
    validateCreateCourier
} = require('../../src/modules/auth/authValidator');

describe('Unit: authValidator', () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('validateCustomerSignup', () => {
        const validPayload = {
            name: 'Maria Silva',
            email: 'maria@example.com',
            password: 'password123',
            cpf: '52998224725',
            phone: '21999998888'
        };

        it('TC-VAL-01: deve aprovar payload de cadastro válido e normalizar campos', () => {
            req.body = { ...validPayload, name: '  Maria Silva  ' };

            validateCustomerSignup(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(req.body.name).toBe('Maria Silva');
            expect(req.body.cpf).toBe('52998224725');
        });

        it('TC-VAL-02: deve rejeitar cadastro sem email ou com formato inválido', () => {
            req.body = { ...validPayload, email: 'not-an-email' };

            validateCustomerSignup(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Erro de validação',
                    details: expect.arrayContaining([expect.stringMatching(/email/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('TC-VAL-03: deve rejeitar cadastro com senha menor que 6 caracteres', () => {
            req.body = { ...validPayload, password: '123' };

            validateCustomerSignup(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([expect.stringMatching(/senha.*6 caracteres/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('TC-VAL-04: deve rejeitar cadastro com CPF inválido (dígitos verificadores incorretos)', () => {
            req.body = { ...validPayload, cpf: '12345678900' };

            validateCustomerSignup(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([expect.stringMatching(/cpf/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('TC-VAL-05: deve rejeitar cadastro com CPF de dígitos repetidos', () => {
            req.body = { ...validPayload, cpf: '111.111.111-11' };

            validateCustomerSignup(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([expect.stringMatching(/cpf/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('TC-VAL-06: deve rejeitar cadastro com nome muito curto ou ausente', () => {
            req.body = { ...validPayload, name: 'A' };

            validateCustomerSignup(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([expect.stringMatching(/nome/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('TC-VAL-07: deve rejeitar cadastro sem telefone', () => {
            req.body = { ...validPayload, phone: '' };

            validateCustomerSignup(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([expect.stringMatching(/telefone/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateLogin', () => {
        it('TC-VAL-08: deve aprovar login com email e senha válidos', () => {
            req.body = {
                email: 'usuario@example.com',
                password: 'secretPassword'
            };

            validateLogin(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('TC-VAL-09: deve rejeitar login sem email', () => {
            req.body = { password: 'secretPassword' };

            validateLogin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Erro de validação',
                    details: expect.arrayContaining([expect.stringMatching(/email/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('TC-VAL-10: deve rejeitar login sem senha', () => {
            req.body = { email: 'usuario@example.com' };

            validateLogin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Erro de validação',
                    details: expect.arrayContaining([expect.stringMatching(/senha/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateCreateCourier', () => {
        const validCourier = {
            name: 'Carlos Entregador',
            email: 'carlos@posto.com',
            password: 'strongPassword123',
            cpf: '52998224725',
            phone: '21988887777',
            vehicleDescription: 'Furgão Utilitário',
            licensePlate: 'ABC1D23'
        };

        it('TC-VAL-11: deve aprovar dados válidos de entregador', () => {
            req.body = { ...validCourier };

            validateCreateCourier(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('TC-VAL-12: deve rejeitar entregador sem veículo ou placa', () => {
            req.body = { ...validCourier, vehicleDescription: '', licensePlate: '' };

            validateCreateCourier(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Erro de validação'
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });
});
