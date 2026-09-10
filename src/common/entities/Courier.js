const AppError = require('../errors/AppError');
const { CourierStatus } = require('../constants/enums');
const { validateCoordinates } = require('./validations');
const { cleanCPF, validateCPF } = require('../utils/cpfValidator');

class Courier {
    constructor({
        id = null,
        usuario_id = null,
        posto_id,
        nome,
        cpf,
        telefone,
        veiculo_descricao,
        placa,
        status = CourierStatus.DISPONIVEL,
        ultima_latitude = null,
        ultima_longitude = null,
        ultima_posicao_em = null,
        created_at = new Date()
    }) {
        if (!nome || !String(nome).trim()) {
            throw new AppError('O campo nome é obrigatório.', 400);
        }

        if (cpf && !validateCPF(cpf)) {
            throw new AppError('CPF inválido.', 400);
        }

        if (status && !Object.values(CourierStatus).includes(status)) {
            throw new AppError(`Status inválido. Valores permitidos: ${Object.values(CourierStatus).join(', ')}.`, 400);
        }

        let lat = null;
        let lon = null;
        if (ultima_latitude !== null && ultima_latitude !== undefined &&
            ultima_longitude !== null && ultima_longitude !== undefined) {
            const coords = validateCoordinates({ latitude: ultima_latitude, longitude: ultima_longitude });
            lat = coords.latitude;
            lon = coords.longitude;
        }

        this.id = id;
        this.usuario_id = usuario_id;
        this.posto_id = posto_id;
        this.nome = String(nome).trim();
        this.cpf = cpf ? cleanCPF(cpf) : null;
        this.telefone = telefone ? String(telefone).trim() : null;
        this.veiculo_descricao = veiculo_descricao ? String(veiculo_descricao).trim() : null;
        this.placa = placa ? String(placa).trim().toUpperCase() : null;
        this.status = status || CourierStatus.DISPONIVEL;
        this.ultima_latitude = lat;
        this.ultima_longitude = lon;
        this.ultima_posicao_em = ultima_posicao_em ? (ultima_posicao_em instanceof Date ? ultima_posicao_em : new Date(ultima_posicao_em)) : null;
        this.created_at = created_at instanceof Date ? created_at : new Date(created_at);
    }

    updateLocation(latitude, longitude) {
        const coords = validateCoordinates({ latitude, longitude });
        this.ultima_latitude = coords.latitude;
        this.ultima_longitude = coords.longitude;
        this.ultima_posicao_em = new Date();
        return this;
    }

    setStatus(newStatus) {
        if (!newStatus || !Object.values(CourierStatus).includes(newStatus)) {
            throw new AppError(`Status inválido. Valores permitidos: ${Object.values(CourierStatus).join(', ')}.`, 400);
        }
        this.status = newStatus;
        return this;
    }

    isAvailable() {
        return this.status === CourierStatus.DISPONIVEL;
    }

    toJSON() {
        return {
            id: this.id,
            usuario_id: this.usuario_id,
            posto_id: this.posto_id,
            nome: this.nome,
            cpf: this.cpf,
            telefone: this.telefone,
            veiculo_descricao: this.veiculo_descricao,
            placa: this.placa,
            status: this.status,
            ultima_latitude: this.ultima_latitude,
            ultima_longitude: this.ultima_longitude,
            ultima_posicao_em: this.ultima_posicao_em,
            created_at: this.created_at
        };
    }
}

module.exports = Courier;
