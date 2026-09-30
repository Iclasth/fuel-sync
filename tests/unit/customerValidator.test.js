const {
    isValidCPF,
    validateCreateCustomer,
    validateUpdateCustomer
} = require('../../src/modules/customers/customerValidator');

describe('Unit: customerValidator', () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('isValidCPF', () => {
        it('deve retornar true para CPF válido', () => {
            expect(isValidCPF('52998224725')).toBe(true);
            expect(isValidCPF('529.982.247-25')).toBe(true);
        });

        it('deve retornar false para CPF com dígitos verificadores incorretos', () => {
            expect(isValidCPF('12345678900')).toBe(false);
        });

        it('deve retornar false para CPF com todos os dígitos iguais', () => {
            expect(isValidCPF('11111111111')).toBe(false);
            expect(isValidCPF('00000000000')).toBe(false);
        });

        it('deve retornar false para strings vazias, nulas ou tamanho incorreto', () => {
            expect(isValidCPF('')).toBe(false);
            expect(isValidCPF(null)).toBe(false);
            expect(isValidCPF('123')).toBe(false);
        });
    });

    describe('validateCreateCustomer', () => {
        it('TC-CUST-VAL-01: deve aprovar criação com nome válido e CPF válido', () => {
            req.body = {
                name: '  João da Silva  ',
                cpf: '529.982.247-25'
            };

            validateCreateCustomer(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(req.body.name).toBe('João da Silva');
            expect(req.body.cpf).toBe('52998224725');
        });

        it('TC-CUST-VAL-02: deve rejeitar criação com nome menor que 2 caracteres ou ausente', () => {
            req.body = { name: 'A', cpf: '52998224725' };

            validateCreateCustomer(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Erro de validação',
                    details: expect.arrayContaining([expect.stringMatching(/name/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('TC-CUST-VAL-03: deve rejeitar criação com CPF inválido', () => {
            req.body = { name: 'João Silva', cpf: '11111111111' };

            validateCreateCustomer(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Erro de validação',
                    details: expect.arrayContaining([expect.stringMatching(/cpf/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateUpdateCustomer', () => {
        it('TC-CUST-VAL-04: deve aprovar atualização parcial com apenas o nome', () => {
            req.body = { name: '  Novo Nome  ' };

            validateUpdateCustomer(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(req.body.name).toBe('Novo Nome');
            expect(res.status).not.toHaveBeenCalled();
        });

        it('TC-CUST-VAL-05: deve aprovar atualização parcial com apenas o CPF', () => {
            req.body = { cpf: '529.982.247-25' };

            validateUpdateCustomer(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(req.body.cpf).toBe('52998224725');
            expect(res.status).not.toHaveBeenCalled();
        });

        it('TC-CUST-VAL-06: deve rejeitar atualização sem enviar nenhum campo', () => {
            req.body = {};

            validateUpdateCustomer(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Erro de validação',
                    details: expect.arrayContaining([expect.stringMatching(/ao menos um campo/i)])
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });
});
