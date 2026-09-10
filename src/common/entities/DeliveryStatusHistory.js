const { AuditOrigin } = require('../constants/enums');

class DeliveryStatusHistory {
    constructor({
        id = null,
        entrega_id,
        status_anterior = null,
        status_novo,
        descricao_motivo = null,
        origem_alteracao = AuditOrigin.ENTREGADOR_APP,
        latitude_momento = null,
        longitude_momento = null,
        criado_em = new Date()
    }) {
        this.id = id;
        this.entrega_id = entrega_id;
        this.status_anterior = status_anterior;
        this.status_novo = status_novo;
        this.descricao_motivo = descricao_motivo ? String(descricao_motivo).trim() : null;
        this.origem_alteracao = origem_alteracao || AuditOrigin.ENTREGADOR_APP;
        this.latitude_momento = latitude_momento !== null ? Number(latitude_momento) : null;
        this.longitude_momento = longitude_momento !== null ? Number(longitude_momento) : null;
        this.criado_em = criado_em instanceof Date ? criado_em : new Date(criado_em);
    }

    toJSON() {
        return {
            id: this.id,
            entrega_id: this.entrega_id,
            status_anterior: this.status_anterior,
            status_novo: this.status_novo,
            descricao_motivo: this.descricao_motivo,
            origem_alteracao: this.origem_alteracao,
            latitude_momento: this.latitude_momento,
            longitude_momento: this.longitude_momento,
            criado_em: this.criado_em
        };
    }
}

module.exports = DeliveryStatusHistory;
