const { validateCNPJ, cleanCNPJ } = require('../../src/common/utils/cnpjValidator');

describe('Unit: CNPJ Validator (src/common/utils/cnpjValidator)', () => {
    describe('cleanCNPJ', () => {
        it('TC-CNPJ-01: deve remover pontuação e caracteres não numéricos', () => {
            expect(cleanCNPJ('12.345.678/0001-95')).toBe('12345678000195');
            expect(cleanCNPJ('  12345678000195  ')).toBe('12345678000195');
        });
    });

    describe('validateCNPJ', () => {
        it('TC-CNPJ-02: deve aceitar CNPJs válidos formatados e não formatados', () => {
            expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
            expect(validateCNPJ('11222333000181')).toBe(true);
            expect(validateCNPJ('04.252.011/0001-10')).toBe(true);
            expect(validateCNPJ('04252011000110')).toBe(true);
        });

        it('TC-CNPJ-03: deve rejeitar CNPJs com tamanho incorreto', () => {
            expect(validateCNPJ('1234567800019')).toBe(false);
            expect(validateCNPJ('123456780001955')).toBe(false);
            expect(validateCNPJ('')).toBe(false);
            expect(validateCNPJ(null)).toBe(false);
        });

        it('TC-CNPJ-04: deve rejeitar sequências de dígitos idênticos repetidos', () => {
            expect(validateCNPJ('00000000000000')).toBe(false);
            expect(validateCNPJ('11111111111111')).toBe(false);
            expect(validateCNPJ('99999999999999')).toBe(false);
        });

        it('TC-CNPJ-05: deve rejeitar CNPJs com dígitos verificadores matematicamente incorretos', () => {
            expect(validateCNPJ('11.222.333/0001-82')).toBe(false);
            expect(validateCNPJ('04.252.011/0001-11')).toBe(false);
        });
    });
});
