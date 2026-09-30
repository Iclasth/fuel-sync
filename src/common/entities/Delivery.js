const { DeliveryStatus } = require('../constants/enums');
const { validateDeliveryTransition } = require('./validations');

class Delivery {
    constructor({
        id = null,
        pedido_id,
        entregador_id,
        ordem_na_fila = 1,
        status_entrega = DeliveryStatus.AGENDADO,
        data_inicio_preparo = null,
        data_saida_posto = null,
        data_chegada_local = null,
        data_inicio_retorno = null,
        data_retorno_posto = null,
        tempo_estimado_atendimento_min = 20
    }) {
        this.id = id;
        this.pedido_id = pedido_id;
        this.entregador_id = entregador_id;
        this.ordem_na_fila = Number(ordem_na_fila) || 1;
        this.status_entrega = status_entrega || DeliveryStatus.AGENDADO;
        this.data_inicio_preparo = data_inicio_preparo ? new Date(data_inicio_preparo) : null;
        this.data_saida_posto = data_saida_posto ? new Date(data_saida_posto) : null;
        this.data_chegada_local = data_chegada_local ? new Date(data_chegada_local) : null;
        this.data_inicio_retorno = data_inicio_retorno ? new Date(data_inicio_retorno) : null;
        this.data_retorno_posto = data_retorno_posto ? new Date(data_retorno_posto) : null;
        this.tempo_estimado_atendimento_min = Number(tempo_estimado_atendimento_min) || 20;
    }

    transitionTo(nextStatus) {
        validateDeliveryTransition(this.status_entrega, nextStatus);

        const now = new Date();
        switch (nextStatus) {
            case DeliveryStatus.PREPARANDO_POSTO:
                this.data_inicio_preparo = now;
                break;
            case DeliveryStatus.A_CAMINHO:
                this.data_saida_posto = now;
                break;
            case DeliveryStatus.NO_LOCAL_ABASTECENDO:
                this.data_chegada_local = now;
                break;
            case DeliveryStatus.RETORNANDO_AO_POSTO:
                this.data_inicio_retorno = now;
                break;
            case DeliveryStatus.CONCLUIDO:
                this.data_retorno_posto = now;
                break;
            default:
                break;
        }

        this.status_entrega = nextStatus;
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            pedido_id: this.pedido_id,
            entregador_id: this.entregador_id,
            ordem_na_fila: this.ordem_na_fila,
            status_entrega: this.status_entrega,
            data_inicio_preparo: this.data_inicio_preparo,
            data_saida_posto: this.data_saida_posto,
            data_chegada_local: this.data_chegada_local,
            data_inicio_retorno: this.data_inicio_retorno,
            data_retorno_posto: this.data_retorno_posto,
            tempo_estimado_atendimento_min: this.tempo_estimado_atendimento_min
        };
    }
}

module.exports = Delivery;
