const AppError = require('../../common/errors/AppError');

function validateFuelPayload(payload = {}) {
    const { nome, unidade_medida = 'LITROS' } = payload;

    if (!nome || !String(nome).trim()) {
        throw new AppError('O campo nome é obrigatório.', 400);
    }

    return {
        nome: String(nome).trim(),
        unidade_medida: unidade_medida ? String(unidade_medida).trim().toUpperCase() : 'LITROS'
    };
}

module.exports = {
    validateFuelPayload
};
