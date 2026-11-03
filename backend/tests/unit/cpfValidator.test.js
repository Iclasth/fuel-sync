const { isValidCPF, cleanCPF } = require('../../src/common/utils/cpfValidator');

describe('Unit: cpfValidator', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('deve validar CPF matematicamente correto', () => {
        expect(isValidCPF('52998224725')).toBe(true);
        expect(isValidCPF('529.982.247-25')).toBe(true);
    });

    it('deve rejeitar CPF inválido em ambiente de teste padrão sem bypass', () => {
        delete process.env.SKIP_CPF_VALIDATION;
        expect(isValidCPF('11111111111')).toBe(false);
        expect(isValidCPF('12345678900')).toBe(false);
    });

    it('deve permitir bypass se SKIP_CPF_VALIDATION=true E NODE_ENV=test', () => {
        process.env.SKIP_CPF_VALIDATION = 'true';
        process.env.NODE_ENV = 'test';
        expect(isValidCPF('invalid-cpf')).toBe(true);
    });

    it('NÃO deve permitir bypass se SKIP_CPF_VALIDATION=true mas NODE_ENV!==test (ex: production)', () => {
        process.env.SKIP_CPF_VALIDATION = 'true';
        process.env.NODE_ENV = 'production';
        expect(isValidCPF('invalid-cpf')).toBe(false);
        expect(isValidCPF('11111111111')).toBe(false);
    });

    it('cleanCPF deve remover pontuação e manter apenas números', () => {
        expect(cleanCPF('123.456.789-01')).toBe('12345678901');
        expect(cleanCPF(null)).toBe('');
    });
});
