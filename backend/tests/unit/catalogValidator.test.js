const { validateFuelPayload } = require('../../src/modules/catalog/catalogValidator');

describe('Unit: Catalog Validator (src/modules/catalog/catalogValidator)', () => {
    it('TC-CAT-VAL-01: deve aprovar combustível válido', () => {
        const payload = { nome: 'Gasolina Podium', unidade_medida: 'LITROS' };
        const validated = validateFuelPayload(payload);
        expect(validated.nome).toBe('Gasolina Podium');
        expect(validated.unidade_medida).toBe('LITROS');
    });

    it('TC-CAT-VAL-02: deve definir "LITROS" por padrão se unidade não for informada', () => {
        const payload = { nome: 'Diesel Náutico S10' };
        const validated = validateFuelPayload(payload);
        expect(validated.unidade_medida).toBe('LITROS');
    });

    it('TC-CAT-VAL-03: deve rejeitar combustível sem nome', () => {
        expect(() => validateFuelPayload({ nome: '' })).toThrow(/nome.*obrigatório/i);
        expect(() => validateFuelPayload({})).toThrow(/nome.*obrigatório/i);
    });
});
