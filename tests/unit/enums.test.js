const {
    UserRoles,
    DeliveryStatus,
    OrderStatus,
    LocationType,
    CourierStatus,
    AuditOrigin
} = require('../../src/common/constants/enums');

describe('Unit: Domain Enums (src/common/constants/enums)', () => {
    describe('UserRoles', () => {
        it('TC-ENUM-01: deve conter os papéis do sistema e ser imutável', () => {
            expect(Object.isFrozen(UserRoles)).toBe(true);
            expect(UserRoles).toEqual({
                CLIENTE: 'cliente',
                POSTO_ADMIN: 'posto_admin',
                ENTREGADOR: 'entregador'
            });
        });
    });

    describe('DeliveryStatus', () => {
        it('TC-ENUM-02: deve conter todos os status do ciclo Posto-Cliente-Posto e ser imutável', () => {
            expect(Object.isFrozen(DeliveryStatus)).toBe(true);
            expect(DeliveryStatus).toEqual({
                AGENDADO: 'AGENDADO',
                EM_OUTRA_ENTREGA: 'EM_OUTRA_ENTREGA',
                PREPARANDO_POSTO: 'PREPARANDO_POSTO',
                A_CAMINHO: 'A_CAMINHO',
                NO_LOCAL_ABASTECENDO: 'NO_LOCAL_ABASTECENDO',
                RETORNANDO_AO_POSTO: 'RETORNANDO_AO_POSTO',
                CONCLUIDO: 'CONCLUIDO',
                FALHA_CANCELADO: 'FALHA_CANCELADO'
            });
        });
    });

    describe('OrderStatus', () => {
        it('TC-ENUM-03: deve conter os status de pedidos civis e ser imutável', () => {
            expect(Object.isFrozen(OrderStatus)).toBe(true);
            expect(OrderStatus).toEqual({
                PENDENTE: 'PENDENTE',
                CONFIRMADO_POSTO: 'CONFIRMADO_POSTO',
                EM_PREPARACAO: 'EM_PREPARACAO',
                EM_TRANSPORTE: 'EM_TRANSPORTE',
                CONCLUIDO: 'CONCLUIDO',
                CANCELADO: 'CANCELADO'
            });
        });
    });

    describe('LocationType', () => {
        it('TC-ENUM-04: deve conter os tipos de locais de entrega B2C e ser imutável', () => {
            expect(Object.isFrozen(LocationType)).toBe(true);
            expect(LocationType).toEqual({
                MARINA: 'MARINA',
                CONDOMINIO: 'CONDOMINIO',
                CHACARA: 'CHACARA',
                RODOVIA: 'RODOVIA',
                RESIDENCIA: 'RESIDENCIA',
                OUTRO: 'OUTRO'
            });
        });
    });

    describe('CourierStatus', () => {
        it('TC-ENUM-05: deve conter os status de disponibilidade do entregador', () => {
            expect(Object.isFrozen(CourierStatus)).toBe(true);
            expect(CourierStatus).toEqual({
                DISPONIVEL: 'DISPONIVEL',
                EM_ROTA: 'EM_ROTA',
                INDISPONIVEL: 'INDISPONIVEL'
            });
        });
    });

    describe('AuditOrigin', () => {
        it('TC-ENUM-06: deve conter as origens de alteração de status para auditoria', () => {
            expect(Object.isFrozen(AuditOrigin)).toBe(true);
            expect(AuditOrigin).toEqual({
                ENTREGADOR_APP: 'ENTREGADOR_APP',
                POSTO_WEB: 'POSTO_WEB',
                SISTEMA_IA: 'SISTEMA_IA',
                CLIENTE_APP: 'CLIENTE_APP'
            });
        });
    });
});
