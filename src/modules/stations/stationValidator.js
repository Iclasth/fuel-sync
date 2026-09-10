const AppError = require('../../common/errors/AppError');
const { validateCNPJ, cleanCNPJ } = require('../../common/utils/cnpjValidator');
const { validateCoordinates } = require('../../common/entities/validations');

function validateCreateStation(payload = {}) {
    const {
        nome_fantasia,
        razao_social,
        cnpj,
        telefone,
        endereco,
        latitude,
        longitude,
        tempo_medio_preparo_minutos = 12
    } = payload;

    if (!nome_fantasia || !String(nome_fantasia).trim()) {
        throw new AppError('O campo nome_fantasia é obrigatório.', 400);
    }

    if (!cnpj || !validateCNPJ(cnpj)) {
        throw new AppError('CNPJ inválido.', 400);
    }

    if (!telefone || !String(telefone).trim()) {
        throw new AppError('O campo telefone é obrigatório.', 400);
    }

    if (!endereco || !String(endereco).trim()) {
        throw new AppError('O campo endereço é obrigatório.', 400);
    }

    const coords = validateCoordinates({ latitude, longitude });

    const prepTime = Number(tempo_medio_preparo_minutos);
    if (isNaN(prepTime) || prepTime < 0) {
        throw new AppError('O campo tempo_medio_preparo_minutos deve ser maior ou igual a zero.', 400);
    }

    return {
        nome_fantasia: String(nome_fantasia).trim(),
        razao_social: razao_social ? String(razao_social).trim() : null,
        cnpj: cleanCNPJ(cnpj),
        telefone: String(telefone).trim(),
        endereco: String(endereco).trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        tempo_medio_preparo_minutos: prepTime
    };
}

function validateUpdateStation(payload = {}) {
    const updateData = {};

    if (payload.nome_fantasia !== undefined) {
        if (!payload.nome_fantasia || !String(payload.nome_fantasia).trim()) {
            throw new AppError('O campo nome_fantasia não pode ser vazio.', 400);
        }
        updateData.nome_fantasia = String(payload.nome_fantasia).trim();
    }

    if (payload.razao_social !== undefined) {
        updateData.razao_social = payload.razao_social ? String(payload.razao_social).trim() : null;
    }

    if (payload.cnpj !== undefined) {
        if (!validateCNPJ(payload.cnpj)) {
            throw new AppError('CNPJ inválido.', 400);
        }
        updateData.cnpj = cleanCNPJ(payload.cnpj);
    }

    if (payload.telefone !== undefined) {
        if (!payload.telefone || !String(payload.telefone).trim()) {
            throw new AppError('O campo telefone não pode ser vazio.', 400);
        }
        updateData.telefone = String(payload.telefone).trim();
    }

    if (payload.endereco !== undefined) {
        if (!payload.endereco || !String(payload.endereco).trim()) {
            throw new AppError('O campo endereço não pode ser vazio.', 400);
        }
        updateData.endereco = String(payload.endereco).trim();
    }

    if (payload.latitude !== undefined || payload.longitude !== undefined) {
        const coords = validateCoordinates({
            latitude: payload.latitude,
            longitude: payload.longitude
        });
        updateData.latitude = coords.latitude;
        updateData.longitude = coords.longitude;
    }

    if (payload.tempo_medio_preparo_minutos !== undefined) {
        const prepTime = Number(payload.tempo_medio_preparo_minutos);
        if (isNaN(prepTime) || prepTime < 0) {
            throw new AppError('O campo tempo_medio_preparo_minutos deve ser maior ou igual a zero.', 400);
        }
        updateData.tempo_medio_preparo_minutos = prepTime;
    }

    if (payload.ativo !== undefined) {
        updateData.ativo = Boolean(payload.ativo);
    }

    return updateData;
}

module.exports = {
    validateCreateStation,
    validateUpdateStation
};
