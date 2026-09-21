const { validateCreateOrder, validateUpdateOrderStatus } = require('../../src/modules/orders/orderValidator');
const { OrderStatus, LocationType } = require('../../src/common/constants/enums');

describe('Unit: Order Validator (src/modules/orders/orderValidator)', () => {
    const validOrderPayload = {
        posto_id: 1,
        endereco_entrega: 'Av. Infante Dom Henrique, s/n - Marina da Glória',
        ponto_referencia: 'Píer B, Vaga 14 - Lancha Marlin',
        tipo_local: LocationType.MARINA,
        instrucoes_adicionais: 'Acesso pela guarita náutica 2',
        destino_latitude: -22.920800,
        destino_longitude: -43.172900,
        itens: [
            {
                combustivel_id: 1,
                quantidade_litros: 100,
                valor_unitario: 6.50
            },
            {
                combustivel_id: 3,
                quantidade_litros: 50,
                valor_unitario: 7.20
            }
        ]
    };

    describe('validateCreateOrder', () => {
        it('TC-ORD-VAL-01: deve aprovar payload válido e normalizar campos e subtotais', () => {
            const validated = validateCreateOrder(validOrderPayload, { id: 'usr-cliente-1', role: 'cliente' });
            expect(validated.posto_id).toBe(1);
            expect(validated.tipo_local).toBe(LocationType.MARINA);
            expect(validated.itens.length).toBe(2);
            expect(validated.itens[0].subtotal).toBe(650.00);
            expect(validated.itens[1].subtotal).toBe(360.00);
            expect(validated.valor_total).toBe(1010.00);
        });

        it('TC-ORD-VAL-02: deve rejeitar pedido sem itens ou com lista vazia', () => {
            expect(() => validateCreateOrder({ ...validOrderPayload, itens: [] })).toThrow(/itens.*obrigatório/i);
            expect(() => validateCreateOrder({ ...validOrderPayload, itens: null })).toThrow(/itens.*obrigatório/i);
        });

        it('TC-ORD-VAL-03: deve rejeitar item com quantidade zero ou negativa', () => {
            const invalidItems = [{ combustivel_id: 1, quantidade_litros: 0, valor_unitario: 6.50 }];
            expect(() => validateCreateOrder({ ...validOrderPayload, itens: invalidItems })).toThrow(/quantidade_litros.*maior que zero/i);
        });

        it('TC-ORD-VAL-04: deve rejeitar item com valor unitário zero ou negativo', () => {
            const invalidItems = [{ combustivel_id: 1, quantidade_litros: 50, valor_unitario: -1 }];
            expect(() => validateCreateOrder({ ...validOrderPayload, itens: invalidItems })).toThrow(/valor_unitario.*maior que zero/i);
        });

        it('TC-ORD-VAL-05: deve rejeitar coordenadas fora dos limites geodésicos', () => {
            expect(() => validateCreateOrder({ ...validOrderPayload, destino_latitude: 95 })).toThrow(/latitude/i);
            expect(() => validateCreateOrder({ ...validOrderPayload, destino_longitude: -200 })).toThrow(/longitude/i);
        });

        it('TC-ORD-VAL-06: deve rejeitar tipo_local inválido', () => {
            expect(() => validateCreateOrder({ ...validOrderPayload, tipo_local: 'AEROPORTO' })).toThrow(/tipo_local.*inválido/i);
        });

        it('TC-ORD-VAL-07: deve rejeitar payload sem posto_id ou sem endereco_entrega', () => {
            expect(() => validateCreateOrder({ ...validOrderPayload, posto_id: null })).toThrow(/posto_id.*obrigatório/i);
            expect(() => validateCreateOrder({ ...validOrderPayload, endereco_entrega: '' })).toThrow(/endereco_entrega.*obrigatório/i);
        });
    });

    describe('validateUpdateOrderStatus', () => {
        it('TC-ORD-VAL-08: deve aprovar status válidos do OrderStatus', () => {
            expect(validateUpdateOrderStatus({ status: 'CONFIRMADO_POSTO' })).toBe(OrderStatus.CONFIRMADO_POSTO);
            expect(validateUpdateOrderStatus({ status: 'EM_TRANSPORTE' })).toBe(OrderStatus.EM_TRANSPORTE);
            expect(validateUpdateOrderStatus({ status: 'CANCELADO' })).toBe(OrderStatus.CANCELADO);
        });

        it('TC-ORD-VAL-09: deve rejeitar status desconhecido', () => {
            expect(() => validateUpdateOrderStatus({ status: 'ENTREGANDO_AGORA' })).toThrow(/status.*inválido/i);
            expect(() => validateUpdateOrderStatus({})).toThrow(/status.*obrigatório/i);
        });
    });
});
