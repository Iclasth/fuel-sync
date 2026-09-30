const AppError = require('../errors/AppError');
const { DeliveryStatus, LocationType } = require('../constants/enums');

/**
 * Valida se as coordenadas geográficas estão no intervalo válido da Terra.
 */
function validateCoordinates({ latitude, longitude }) {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
        throw new AppError('As coordenadas geográficas devem ser números válidos.', 400);
    }

    if (lat < -90 || lat > 90) {
        throw new AppError('A latitude deve estar entre -90 e 90 graus.', 400);
    }

    if (lon < -180 || lon > 180) {
        throw new AppError('A longitude deve estar entre -180 e 180 graus.', 400);
    }

    return { latitude: lat, longitude: lon };
}

/**
 * Valida se valores monetários ou de volume são estritamente positivos.
 */
function validatePositiveAmount(value, fieldName = 'valor') {
    const num = Number(value);

    if (isNaN(num) || num <= 0) {
        throw new AppError(`O campo "${fieldName}" deve ser um número maior que zero.`, 400);
    }

    return num;
}

/**
 * Valida se o tipo de local de entrega civil é suportado.
 */
function validateLocationType(type) {
    if (!type || !LocationType[type]) {
        throw new AppError(`Tipo_local "${type}" inválido. Valores aceitos: ${Object.values(LocationType).join(', ')}.`, 400);
    }

    return LocationType[type];
}

/**
 * Máquina de estados do ciclo logístico Posto -> Cliente -> Posto.
 */
const allowedTransitions = {
    [DeliveryStatus.AGENDADO]: [
        DeliveryStatus.EM_OUTRA_ENTREGA,
        DeliveryStatus.PREPARANDO_POSTO,
        DeliveryStatus.FALHA_CANCELADO
    ],
    [DeliveryStatus.EM_OUTRA_ENTREGA]: [
        DeliveryStatus.PREPARANDO_POSTO,
        DeliveryStatus.FALHA_CANCELADO
    ],
    [DeliveryStatus.PREPARANDO_POSTO]: [
        DeliveryStatus.A_CAMINHO,
        DeliveryStatus.FALHA_CANCELADO
    ],
    [DeliveryStatus.A_CAMINHO]: [
        DeliveryStatus.NO_LOCAL_ABASTECENDO,
        DeliveryStatus.FALHA_CANCELADO
    ],
    [DeliveryStatus.NO_LOCAL_ABASTECENDO]: [
        DeliveryStatus.RETORNANDO_AO_POSTO,
        DeliveryStatus.FALHA_CANCELADO
    ],
    [DeliveryStatus.RETORNANDO_AO_POSTO]: [
        DeliveryStatus.CONCLUIDO,
        DeliveryStatus.FALHA_CANCELADO
    ],
    [DeliveryStatus.CONCLUIDO]: [],
    [DeliveryStatus.FALHA_CANCELADO]: []
};

/**
 * Valida se a transição entre etapas da entrega é permitida pela máquina de estados.
 */
function validateDeliveryTransition(currentStatus, nextStatus) {
    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
        throw new AppError(
            `Transição de status inválida de "${currentStatus}" para "${nextStatus}". Transições permitidas: ${allowed.join(', ') || 'Nenhuma (estado terminal)'}.`,
            400
        );
    }

    return true;
}

module.exports = {
    validateCoordinates,
    validatePositiveAmount,
    validateLocationType,
    allowedTransitions,
    validateDeliveryTransition
};
