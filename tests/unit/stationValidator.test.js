const { validateCreateStation, validateUpdateStation } = require('../../src/modules/stations/stationValidator');

describe('Unit: Station Validator (src/modules/stations/stationValidator)', () => {
    const validPayload = {
        nome_fantasia: 'Posto Base Marina Náutica',
        razao_social: 'Marina Náutica Combustíveis LTDA',
        cnpj: '11.222.333/0001-81',
        telefone: '21988887777',
        endereco: 'Av. das Américas, 1000 - Barra da Tijuca, RJ',
        latitude: -23.000371,
        longitude: -43.365894,
        tempo_medio_preparo_minutos: 15
    };

    it('TC-ST-VAL-01: deve aprovar payload válido de criação de posto', () => {
        expect(() => validateCreateStation(validPayload)).not.toThrow();
        const validated = validateCreateStation(validPayload);
        expect(validated.cnpj).toBe('11222333000181');
    });

    it('TC-ST-VAL-02: deve rejeitar payload sem campos obrigatórios', () => {
        expect(() => validateCreateStation({ ...validPayload, nome_fantasia: '' })).toThrow(/nome_fantasia.*obrigatório/i);
        expect(() => validateCreateStation({ ...validPayload, telefone: '' })).toThrow(/telefone.*obrigatório/i);
        expect(() => validateCreateStation({ ...validPayload, endereco: '' })).toThrow(/endereço.*obrigatório/i);
    });

    it('TC-ST-VAL-03: deve rejeitar CNPJ inválido', () => {
        expect(() => validateCreateStation({ ...validPayload, cnpj: '11.111.111/1111-11' })).toThrow(/CNPJ inválido/i);
    });

    it('TC-ST-VAL-04: deve rejeitar coordenadas fora dos limites', () => {
        expect(() => validateCreateStation({ ...validPayload, latitude: 100 })).toThrow(/latitude/i);
        expect(() => validateCreateStation({ ...validPayload, longitude: -200 })).toThrow(/longitude/i);
    });

    it('TC-ST-VAL-05: deve rejeitar tempo médio de preparo negativo', () => {
        expect(() => validateCreateStation({ ...validPayload, tempo_medio_preparo_minutos: -10 })).toThrow(/tempo.*preparo/i);
    });

    it('TC-ST-VAL-06: deve aprovar payload de atualização com campos parciais válidos', () => {
        expect(() => validateUpdateStation({ tempo_medio_preparo_minutos: 20 })).not.toThrow();
        expect(() => validateUpdateStation({ telefone: '21977776666' })).not.toThrow();
    });
});
