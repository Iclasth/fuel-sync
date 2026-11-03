const AppError = require('../errors/AppError');
const { validateCoordinates } = require('./validations');
const { validateCNPJ, cleanCNPJ } = require('../utils/cnpjValidator');

class Station {
    constructor({
        id = null,
        nome_fantasia,
        razao_social = null,
        cnpj,
        telefone,
        endereco,
        latitude,
        longitude,
        tempo_medio_preparo_minutos = 12,
        ativo = true,
        created_at = new Date()
    }) {
        if (!nome_fantasia || !String(nome_fantasia).trim()) {
            throw new AppError('O campo nome_fantasia é obrigatório.', 400);
        }

        if (!validateCNPJ(cnpj)) {
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

        this.id = id;
        this.nome_fantasia = String(nome_fantasia).trim();
        this.razao_social = razao_social ? String(razao_social).trim() : null;
        this.cnpj = cleanCNPJ(cnpj);
        this.telefone = String(telefone).trim();
        this.endereco = String(endereco).trim();
        this.latitude = coords.latitude;
        this.longitude = coords.longitude;
        this.tempo_medio_preparo_minutos = prepTime;
        this.ativo = Boolean(ativo);
        this.created_at = created_at instanceof Date ? created_at : new Date(created_at);
    }

    toJSON() {
        return {
            id: this.id,
            nome_fantasia: this.nome_fantasia,
            razao_social: this.razao_social,
            cnpj: this.cnpj,
            telefone: this.telefone,
            endereco: this.endereco,
            latitude: this.latitude,
            longitude: this.longitude,
            tempo_medio_preparo_minutos: this.tempo_medio_preparo_minutos,
            ativo: this.ativo,
            created_at: this.created_at
        };
    }
}

module.exports = Station;
