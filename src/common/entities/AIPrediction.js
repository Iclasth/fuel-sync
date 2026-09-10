class AIPrediction {
    constructor({
        id = null,
        entrega_id,
        eta_previsto,
        tempo_espera_liberacao_minutos = 0,
        tempo_preparo_posto_minutos = 12,
        tempo_viagem_cliente_minutos = 0,
        confianca_score = 0.95,
        risco_atraso = false,
        fator_principal_risco = null,
        mensagem_humanizada,
        criado_em = new Date()
    }) {
        this.id = id;
        this.entrega_id = entrega_id;
        this.eta_previsto = eta_previsto instanceof Date ? eta_previsto : new Date(eta_previsto);
        this.tempo_espera_liberacao_minutos = Number(tempo_espera_liberacao_minutos) || 0;
        this.tempo_preparo_posto_minutos = Number(tempo_preparo_posto_minutos) || 12;
        this.tempo_viagem_cliente_minutos = Number(tempo_viagem_cliente_minutos) || 0;
        this.confianca_score = Number(confianca_score);
        this.risco_atraso = Boolean(risco_atraso);
        this.fator_principal_risco = fator_principal_risco ? String(fator_principal_risco).trim() : null;
        this.mensagem_humanizada = String(mensagem_humanizada || '').trim();
        this.criado_em = criado_em instanceof Date ? criado_em : new Date(criado_em);
    }

    toJSON() {
        return {
            id: this.id,
            entrega_id: this.entrega_id,
            eta_previsto: this.eta_previsto,
            tempo_espera_liberacao_minutos: this.tempo_espera_liberacao_minutos,
            tempo_preparo_posto_minutos: this.tempo_preparo_posto_minutos,
            tempo_viagem_cliente_minutos: this.tempo_viagem_cliente_minutos,
            confianca_score: this.confianca_score,
            risco_atraso: this.risco_atraso,
            fator_principal_risco: this.fator_principal_risco,
            mensagem_humanizada: this.mensagem_humanizada,
            criado_em: this.criado_em
        };
    }
}

module.exports = AIPrediction;
