const AppError = require('../../common/errors/AppError');
const { OrderStatus } = require('../../common/constants/enums');
const {
    validateCoordinates,
    validatePositiveAmount,
    validateLocationType
} = require('../../common/entities/validations');

function validateCreateOrder(payload = {}, user = {}) {
    const {
        posto_id,
        endereco_entrega,
        ponto_referencia,
        tipo_local,
        instrucoes_adicionais,
        destino_latitude,
        destino_longitude,
        itens
    } = payload;

    const postoIdNum = Number(posto_id);
    if (!posto_id || isNaN(postoIdNum) || postoIdNum <= 0) {
        throw new AppError('O campo posto_id é obrigatório e deve ser um número válido.', 400);
    }

    if (!endereco_entrega || !String(endereco_entrega).trim()) {
        throw new AppError('O campo endereco_entrega é obrigatório.', 400);
    }

    const validLocationType = validateLocationType(tipo_local);
    const coords = validateCoordinates({
        latitude: destino_latitude,
        longitude: destino_longitude
    });

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
        throw new AppError('O pedido deve conter pelo menos um item (itens é obrigatório).', 400);
    }

    let valorTotal = 0;
    const validatedItems = itens.map((item, index) => {
        const combustivelIdNum = Number(item.combustivel_id);
        if (!item.combustivel_id || isNaN(combustivelIdNum) || combustivelIdNum <= 0) {
            throw new AppError(`Item #${index + 1}: combustivel_id é obrigatório e deve ser um número válido.`, 400);
        }

        const qtd = validatePositiveAmount(item.quantidade_litros, `quantidade_litros do item #${index + 1}`);
        const unitVal = validatePositiveAmount(item.valor_unitario, `valor_unitario do item #${index + 1}`);
        const subtotal = Number((qtd * unitVal).toFixed(2));
        valorTotal += subtotal;

        return {
            combustivel_id: combustivelIdNum,
            quantidade_litros: qtd,
            valor_unitario: unitVal,
            subtotal
        };
    });

    return {
        posto_id: postoIdNum,
        endereco_entrega: String(endereco_entrega).trim(),
        ponto_referencia: ponto_referencia ? String(ponto_referencia).trim() : null,
        tipo_local: validLocationType,
        instrucoes_adicionais: instrucoes_adicionais ? String(instrucoes_adicionais).trim() : null,
        destino_latitude: coords.latitude,
        destino_longitude: coords.longitude,
        itens: validatedItems,
        valor_total: Number(valorTotal.toFixed(2))
    };
}

function validateUpdateOrderStatus(payload = {}) {
    const { status } = payload;

    if (!status || !String(status).trim()) {
        throw new AppError('O campo status é obrigatório.', 400);
    }

    const trimmed = String(status).trim().toUpperCase();
    if (!Object.values(OrderStatus).includes(trimmed)) {
        throw new AppError(
            `Status de pedido inválido. Valores permitidos: ${Object.values(OrderStatus).join(', ')}.`,
            400
        );
    }

    return trimmed;
}

module.exports = {
    validateCreateOrder,
    validateUpdateOrderStatus
};
