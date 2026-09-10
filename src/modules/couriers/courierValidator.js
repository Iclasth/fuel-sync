const AppError = require('../../common/errors/AppError');
const { CourierStatus } = require('../../common/constants/enums');
const { validateCoordinates } = require('../../common/entities/validations');

function validateCourierStatus(status) {
    if (!status || !String(status).trim()) {
        throw new AppError('O campo status é obrigatório.', 400);
    }

    const trimmed = String(status).trim().toUpperCase();
    if (!Object.values(CourierStatus).includes(trimmed)) {
        throw new AppError(
            `Status operacional inválido. Valores aceitos: ${Object.values(CourierStatus).join(', ')}.`,
            400
        );
    }

    return trimmed;
}

function validateCourierLocation(payload = {}) {
    const { latitude, longitude } = payload;
    return validateCoordinates({ latitude, longitude });
}

module.exports = {
    validateCourierStatus,
    validateCourierLocation
};
