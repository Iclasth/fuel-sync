const {
    validateCoordinates,
    validatePositiveAmount,
    validateDeliveryTransition,
    validateLocationType
} = require('../../src/common/entities');
const { DeliveryStatus, LocationType } = require('../../src/common/constants/enums');

describe('Unit: Entity Validations (src/common/entities)', () => {
    describe('validateCoordinates', () => {
        it('TC-ENT-01: deve aprovar coordenadas válidas', () => {
            expect(() => validateCoordinates({ latitude: -22.9068, longitude: -43.1729 })).not.toThrow();
            expect(() => validateCoordinates({ latitude: 0, longitude: 0 })).not.toThrow();
            expect(() => validateCoordinates({ latitude: 90, longitude: 180 })).not.toThrow();
            expect(() => validateCoordinates({ latitude: -90, longitude: -180 })).not.toThrow();
        });

        it('TC-ENT-02: deve rejeitar latitudes fora do intervalo [-90, 90]', () => {
            expect(() => validateCoordinates({ latitude: 90.0001, longitude: 0 })).toThrow(/latitude.*[-90.*90]/i);
            expect(() => validateCoordinates({ latitude: -91, longitude: 0 })).toThrow(/latitude.*[-90.*90]/i);
        });

        it('TC-ENT-03: deve rejeitar longitudes fora do intervalo [-180, 180]', () => {
            expect(() => validateCoordinates({ latitude: 0, longitude: 180.0001 })).toThrow(/longitude.*[-180.*180]/i);
            expect(() => validateCoordinates({ latitude: 0, longitude: -181 })).toThrow(/longitude.*[-180.*180]/i);
        });

        it('TC-ENT-04: deve rejeitar valores não numéricos', () => {
            expect(() => validateCoordinates({ latitude: 'invalido', longitude: 0 })).toThrow(/coordenadas.*números/i);
        });
    });

    describe('validatePositiveAmount', () => {
        it('TC-ENT-05: deve aprovar valores estritamente positivos', () => {
            expect(validatePositiveAmount(10.5, 'quantidade_litros')).toBe(10.5);
            expect(validatePositiveAmount(100, 'valor_total')).toBe(100);
        });

        it('TC-ENT-06: deve rejeitar valores zero ou negativos', () => {
            expect(() => validatePositiveAmount(0, 'quantidade_litros')).toThrow(/quantidade_litros.*maior que zero/i);
            expect(() => validatePositiveAmount(-5, 'valor_unitario')).toThrow(/valor_unitario.*maior que zero/i);
        });
    });

    describe('validateLocationType', () => {
        it('TC-ENT-07: deve aprovar tipos de locais válidos', () => {
            expect(validateLocationType('MARINA')).toBe(LocationType.MARINA);
            expect(validateLocationType('CONDOMINIO')).toBe(LocationType.CONDOMINIO);
        });

        it('TC-ENT-08: deve rejeitar tipos de locais desconhecidos', () => {
            expect(() => validateLocationType('AEROPORTO_INTERNACIONAL')).toThrow(/tipo_local.*inválido/i);
        });
    });

    describe('validateDeliveryTransition (Máquina de Estados Hub-and-Spoke)', () => {
        it('TC-ENT-09: deve permitir transições lineares válidas do ciclo', () => {
            expect(validateDeliveryTransition(DeliveryStatus.AGENDADO, DeliveryStatus.PREPARANDO_POSTO)).toBe(true);
            expect(validateDeliveryTransition(DeliveryStatus.EM_OUTRA_ENTREGA, DeliveryStatus.PREPARANDO_POSTO)).toBe(true);
            expect(validateDeliveryTransition(DeliveryStatus.PREPARANDO_POSTO, DeliveryStatus.A_CAMINHO)).toBe(true);
            expect(validateDeliveryTransition(DeliveryStatus.A_CAMINHO, DeliveryStatus.NO_LOCAL_ABASTECENDO)).toBe(true);
            expect(validateDeliveryTransition(DeliveryStatus.NO_LOCAL_ABASTECENDO, DeliveryStatus.RETORNANDO_AO_POSTO)).toBe(true);
            expect(validateDeliveryTransition(DeliveryStatus.RETORNANDO_AO_POSTO, DeliveryStatus.CONCLUIDO)).toBe(true);
        });

        it('TC-ENT-10: deve permitir cancelamento ou falha a partir de estados ativos', () => {
            expect(validateDeliveryTransition(DeliveryStatus.PREPARANDO_POSTO, DeliveryStatus.FALHA_CANCELADO)).toBe(true);
            expect(validateDeliveryTransition(DeliveryStatus.A_CAMINHO, DeliveryStatus.FALHA_CANCELADO)).toBe(true);
            expect(validateDeliveryTransition(DeliveryStatus.NO_LOCAL_ABASTECENDO, DeliveryStatus.FALHA_CANCELADO)).toBe(true);
        });

        it('TC-ENT-11: deve rejeitar saltos de etapas inválidos no ciclo', () => {
            expect(() => validateDeliveryTransition(DeliveryStatus.AGENDADO, DeliveryStatus.NO_LOCAL_ABASTECENDO))
                .toThrow(/transição de status inválida/i);
            expect(() => validateDeliveryTransition(DeliveryStatus.PREPARANDO_POSTO, DeliveryStatus.CONCLUIDO))
                .toThrow(/transição de status inválida/i);
            expect(() => validateDeliveryTransition(DeliveryStatus.CONCLUIDO, DeliveryStatus.A_CAMINHO))
                .toThrow(/transição de status inválida/i);
        });
    });
});
