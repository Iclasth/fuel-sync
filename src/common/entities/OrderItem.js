const { validatePositiveAmount } = require('./validations');

class OrderItem {
    constructor({
        id = null,
        pedido_id,
        combustivel_id,
        quantidade_litros,
        valor_unitario,
        subtotal = null
    }) {
        const qty = validatePositiveAmount(quantidade_litros, 'quantidade_litros');
        const unitVal = validatePositiveAmount(valor_unitario, 'valor_unitario');

        this.id = id;
        this.pedido_id = pedido_id;
        this.combustivel_id = combustivel_id;
        this.quantidade_litros = qty;
        this.valor_unitario = unitVal;
        this.subtotal = subtotal !== null ? Number(subtotal) : Number((qty * unitVal).toFixed(2));
    }

    toJSON() {
        return {
            id: this.id,
            pedido_id: this.pedido_id,
            combustivel_id: this.combustivel_id,
            quantidade_litros: this.quantidade_litros,
            valor_unitario: this.valor_unitario,
            subtotal: this.subtotal
        };
    }
}

module.exports = OrderItem;
