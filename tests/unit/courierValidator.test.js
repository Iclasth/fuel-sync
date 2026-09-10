const { validateCourierStatus, validateCourierLocation } = require('../../src/modules/couriers/courierValidator');
const { CourierStatus } = require('../../src/common/constants/enums');

describe('Unit: Courier Validator (src/modules/couriers/courierValidator)', () => {
    describe('validateCourierStatus', () => {
        it('TC-CR-VAL-01: deve aprovar status válidos do entregador', () => {
            expect(validateCourierStatus('DISPONIVEL')).toBe(CourierStatus.DISPONIVEL);
            expect(validateCourierStatus('EM_ROTA')).toBe(CourierStatus.EM_ROTA);
            expect(validateCourierStatus('INDISPONIVEL')).toBe(CourierStatus.INDISPONIVEL);
        });

        it('TC-CR-VAL-02: deve rejeitar status desconhecido', () => {
            expect(() => validateCourierStatus('ONLINE')).toThrow(/status.*inválido/i);
            expect(() => validateCourierStatus('')).toThrow(/status.*obrigatório/i);
        });
    });

    describe('validateCourierLocation', () => {
        it('TC-CR-VAL-03: deve aprovar coordenadas válidas para atualização de posição', () => {
            const loc = validateCourierLocation({ latitude: -22.9068, longitude: -43.1729 });
            expect(loc.latitude).toBe(-22.9068);
            expect(loc.longitude).toBe(-43.1729);
        });

        it('TC-CR-VAL-04: deve rejeitar coordenadas fora do intervalo geográfico', () => {
            expect(() => validateCourierLocation({ latitude: 95, longitude: 0 })).toThrow(/latitude/i);
            expect(() => validateCourierLocation({ latitude: 0, longitude: -185 })).toThrow(/longitude/i);
        });
    });
});
