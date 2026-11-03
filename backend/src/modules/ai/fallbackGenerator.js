const {
    formatDurationHoursMinutes,
    calculateDeliveryWindow,
    getSafetyGuidelines
} = require('./etaCalculator');

function generateFallbackPrediction(metrics, setbackDescription = null, orderStatus = null) {
    const status = orderStatus || metrics.orderStatus;
    const isAnomalia = Boolean(metrics.anomalia_distancia || (metrics.distanceKm && metrics.distanceKm > 100));
    const temFilaCritica = metrics.tempo_espera > 25;
    const temAtrasoBaseline = Boolean(metrics.tem_atraso_baseline);
    const temRisco = isAnomalia || Boolean(setbackDescription) || temFilaCritica || temAtrasoBaseline;
    const tempoStr = metrics.tempo_formatado || formatDurationHoursMinutes(metrics.total_minutos);
    
    let motivoRisco = null;
    let confianca = 90;

    if (isAnomalia) {
        confianca = 20;
        motivoRisco = `Distância geográfica excessiva entre a base e o ponto de entrega (${metrics.distanceKm} km > 100 km)`;
    } else if (setbackDescription) {
        confianca = 75;
        motivoRisco = setbackDescription;
    } else if (temAtrasoBaseline) {
        confianca = 70;
        motivoRisco = `Variação operacional: atraso de ~${metrics.delta_atraso_minutos || 0} min em relação ao baseline`;
    } else if (temFilaCritica) {
        confianca = 75;
        motivoRisco = 'Fila de espera elevada no posto';
    }

    let horaPrevista = null;
    if (metrics.horario_previsto_chegada) {
        try {
            const parsedDate = new Date(metrics.horario_previsto_chegada);
            if (!isNaN(parsedDate.getTime())) {
                horaPrevista = parsedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }
        } catch {
            horaPrevista = null;
        }
    }

    let mensagem = `Seu pedido está em processamento. Previsão estimada de entrega em aproximadamente ${tempoStr}.`;

    if (isAnomalia) {
        mensagem = `Atenção: A distância entre o posto e o destino (${metrics.distanceKm} km) excede o raio operacional padrão. Previsão preliminar em ${tempoStr}.`;
    } else if (setbackDescription) {
        mensagem = `Atenção: Ocorreu um evento durante a rota (${setbackDescription}). Nova previsão de chegada em ${tempoStr}.`;
    } else if (status === 'PENDENTE' || metrics.tipo_fase === 'ACEITE') {
        const fila = metrics.fila_pedidos !== undefined ? metrics.fila_pedidos : (metrics.fila_pendentes || 0);
        if (fila > 0) {
            mensagem = `Seu pedido aguarda confirmação do posto. Há ${fila} pedido(s) pendente(s) na fila de análise da base. Estimativa de aceite pelo posto: em aproximadamente ${tempoStr}.`;
        } else {
            mensagem = `Seu pedido aguarda confirmação do posto. Análise prioritária na base. Estimativa de aceite pelo posto: em aproximadamente ${tempoStr}.`;
        }
    } else if (status === 'CONFIRMADO_POSTO') {
        const fila = metrics.fila_pedidos || 0;
        const horaRef = horaPrevista ? `às ${horaPrevista} (~${tempoStr})` : `em ~${tempoStr}`;
        mensagem = `Pedido confirmado pelo posto. Fila de separação: ${fila} pedido(s). Previsão estimada de entrega para ${horaRef}.`;
    } else if (status === 'EM_PREPARACAO') {
        const horaRef = horaPrevista ? `às ${horaPrevista}` : `em ~${tempoStr}`;
        if (temAtrasoBaseline) {
            mensagem = `Carga em preparação no posto. Devido ao fluxo operacional, a previsão atualizada de entrega é ${horaRef} (atraso de ~${metrics.delta_atraso_minutos} min vs. previsão inicial).`;
        } else {
            mensagem = `Carga em abastecimento no posto. Preparação dentro do cronograma previsto para entrega ${horaRef}.`;
        }
    } else if (status === 'EM_TRANSPORTE') {
        const horaRef = horaPrevista ? `às ${horaPrevista}` : `em ~${tempoStr}`;
        if (temAtrasoBaseline) {
            mensagem = `Entregador em rota. Nova previsão de chegada ${horaRef} (atraso de ~${metrics.delta_atraso_minutos} min vs. horário acordado).`;
        } else {
            mensagem = `Entregador em deslocamento direto para o local indicado. Previsão de chegada pontual ${horaRef}.`;
        }
    }

    const janelaEntrega = metrics.janela_entrega || calculateDeliveryWindow(
        metrics.horario_previsto_chegada,
        metrics.total_minutos,
        status
    );

    const fatoresTempo = {
        fila_minutos: Number(metrics.tempo_espera) || 0,
        preparo_minutos: Number(metrics.tempo_preparo) || 0,
        transito_minutos: Number(metrics.tempo_viagem) || 0,
        total_minutos: Number(metrics.total_minutos) || 0,
        explicacao: `Fila no posto: ${Number(metrics.tempo_espera) || 0} min | Preparo da carga: ${Number(metrics.tempo_preparo) || 0} min | Deslocamento em rota: ${Number(metrics.tempo_viagem) || 0} min`
    };

    const locationType = metrics.locationType || 'MARINA';
    const recomendacoesSeguranca = Array.isArray(metrics.recomendacoes_seguranca) && metrics.recomendacoes_seguranca.length > 0
        ? metrics.recomendacoes_seguranca
        : getSafetyGuidelines(locationType, metrics.litros || 0);

    const condicoesOperacionais = {
        nivel_trafego: setbackDescription
            ? 'CONGESTIONADO_OU_ADVERSO'
            : (metrics.tempo_viagem > 30 ? 'MODERADO' : 'FLUIDO'),
        complexidade_acesso: ['MARINA', 'CHACARA', 'PONTÃO', 'PONTAO'].includes(String(locationType).toUpperCase())
            ? 'ALTA'
            : 'PADRAO',
        notas: setbackDescription || (isAnomalia
            ? 'Alerta de distância geográfica excessiva (> 100 km)'
            : 'Operação em conformidade com os parâmetros normais')
    };

    return {
        confianca,
        risco_atraso: temRisco,
        motivo_risco: motivoRisco,
        mensagem,
        janela_entrega: janelaEntrega,
        fatores_tempo: fatoresTempo,
        recomendacoes_seguranca: recomendacoesSeguranca,
        condicoes_operacionais: condicoesOperacionais
    };
}

module.exports = { generateFallbackPrediction };
