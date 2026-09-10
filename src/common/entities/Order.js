const AppError = require('../errors/AppError');
const { OrderStatus } = require('../constants/enums');
const { validateCoordinates, validateLocationType } = require('./validations');

class Order {
    constructor({
        id = null,
        cliente_id,
        posto_id,
        status = OrderStatus.PENDENTE,
        valor_total = 0.00,
        endereco_entrega,
        ponto_referencia = null,
        tipo_local,
        instrucoes_adicionais = null,
        destino_latitude,
        destino_longitude,
        data_pedido = new Date()
    }) {
        if (!endereco_entrega || !String(endereco_entrega).trim()) {
            throw new AppError('O campo endereco_entrega é obrigatório.', 400);
        }

        const validLocationType = validateLocationType(tipo_local);
        const coords = validateCoordinates({ latitude: destino_latitude, longitude: destino_longitude });

        this.id = id;
        this.cliente_id = cliente_id;
        this.posto_id = posto_id;
        this.status = status || OrderStatus.PENDENTE;
        this.valor_total = Number(valor_total) || 0.00;
        this.endereco_entrega = String(endereco_entrega).trim();
        this.ponto_referencia = ponto_referencia ? String(ponto_referencia).trim() : null;
        this.tipo_local = validLocationType;
        this.instrucoes_adicionais = instrucoes_adicionais ? String(instrucoes_adicionais).trim() : null;
        this.destino_latitude = coords.latitude;
        this.destino_longitude = coords.longitude;
        this.data_pedido = data_pedido instanceof Date ? data_pedido : new Date(data_pedido);
    }

    toJSON() {
        return {
            id: this.id,
            cliente_id: this.cliente_id,
            posto_id: this.posto_id,
            status: this.status,
            valor_total: this.valor_total,
            endereco_entrega: this.endereco_entrega,
            ponto_referencia: this.ponto_referencia,
            tipo_local: this.tipo_local,
            instrucoes_adicionais: this.instrucoes_adicionais,
            destino_latitude: this.destino_latitude,
            destino_longitude: this.destino_longitude,
            data_pedido: this.data_pedido
        };
    }
}

module.exports = Order;
