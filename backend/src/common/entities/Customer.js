const AppError = require('../errors/AppError');
const { validateCoordinates } = require('./validations');
const { cleanCPF, validateCPF } = require('../utils/cpfValidator');

class Customer {
    constructor({
        id = null,
        usuario_id = null,
        nome,
        cpf,
        email,
        telefone,
        endereco_padrao = null,
        ponto_referencia_padrao = null,
        latitude = null,
        longitude = null,
        created_at = new Date()
    }) {
        if (!nome || !String(nome).trim()) {
            throw new AppError('O campo nome é obrigatório.', 400);
        }

        if (!validateCPF(cpf)) {
            throw new AppError('CPF inválido.', 400);
        }

        if (!email || !String(email).trim()) {
            throw new AppError('O campo e-mail é obrigatório.', 400);
        }

        if (!telefone || !String(telefone).trim()) {
            throw new AppError('O campo telefone é obrigatório.', 400);
        }

        let lat = null;
        let lon = null;
        if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
            const coords = validateCoordinates({ latitude, longitude });
            lat = coords.latitude;
            lon = coords.longitude;
        }

        this.id = id;
        this.usuario_id = usuario_id;
        this.nome = String(nome).trim();
        this.cpf = cleanCPF(cpf);
        this.email = String(email).trim().toLowerCase();
        this.telefone = String(telefone).trim();
        this.endereco_padrao = endereco_padrao ? String(endereco_padrao).trim() : null;
        this.ponto_referencia_padrao = ponto_referencia_padrao ? String(ponto_referencia_padrao).trim() : null;
        this.latitude = lat;
        this.longitude = lon;
        this.created_at = created_at instanceof Date ? created_at : new Date(created_at);
    }

    toJSON() {
        return {
            id: this.id,
            usuario_id: this.usuario_id,
            nome: this.nome,
            cpf: this.cpf,
            email: this.email,
            telefone: this.telefone,
            endereco_padrao: this.endereco_padrao,
            ponto_referencia_padrao: this.ponto_referencia_padrao,
            latitude: this.latitude,
            longitude: this.longitude,
            created_at: this.created_at
        };
    }
}

module.exports = Customer;
