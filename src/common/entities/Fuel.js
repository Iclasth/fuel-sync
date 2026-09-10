const AppError = require('../errors/AppError');

class Fuel {
    constructor({ id = null, nome, unidade_medida = 'LITROS' }) {
        if (!nome || !String(nome).trim()) {
            throw new AppError('O campo nome é obrigatório.', 400);
        }

        this.id = id;
        this.nome = String(nome).trim();
        this.unidade_medida = unidade_medida ? String(unidade_medida).trim().toUpperCase() : 'LITROS';
    }

    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            unidade_medida: this.unidade_medida
        };
    }
}

module.exports = Fuel;
