/**
 * Coeficiente de tortuosidade viária/náutica para aproximação de percurso real
 * sobre a distância geodésica em linha reta (padrão 1.35x).
 */
const DEFAULT_TORTUOSITY_FACTOR = 1.35;

/**
 * Raio operacional máximo plausível para entrega local de combustível (km).
 * Distâncias superiores a 100 km indicam inconsistência geográfica entre base e destino.
 */
const MAX_OPERATIONAL_RADIUS_KM = 100;

/**
 * Calcula a distância geodésica em KM entre dois pontos (Fórmula de Haversine)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Formata duração em minutos para representação legível em horas e minutos.
 * Ex: 45 -> "45 min", 75 -> "1h 15min", 120 -> "2h"
 */
function formatDurationHoursMinutes(minutes) {
    if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
        return '0 min';
    }
    const total = Math.round(minutes);
    const hours = Math.floor(total / 60);
    const remaining = total % 60;
    if (hours === 0) {
        return `${remaining} min`;
    }
    if (remaining === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remaining}min`;
}

/**
 * Calcula a janela de entrega estimada com margem de segurança operacional
 */
function calculateDeliveryWindow(horarioPrevistoChegada, totalMinutos = 20, orderStatus = null) {
    let baseTime = null;

    if (horarioPrevistoChegada) {
        const parsed = new Date(horarioPrevistoChegada);
        if (!isNaN(parsed.getTime())) {
            baseTime = parsed.getTime();
        }
    }

    if (!baseTime) {
        baseTime = Date.now() + Math.max(1, Number(totalMinutos) || 20) * 60000;
    }

    const duration = Math.max(1, Number(totalMinutos) || 20);
    let startOffsetMin = 5;
    let endOffsetMin = 15;

    if (orderStatus === 'PENDENTE') {
        startOffsetMin = 2;
        endOffsetMin = 8;
    } else if (duration > 60) {
        startOffsetMin = 10;
        endOffsetMin = 25;
    } else if (duration > 30) {
        startOffsetMin = 8;
        endOffsetMin = 20;
    }

    const startDate = new Date(baseTime - startOffsetMin * 60000);
    const endDate = new Date(baseTime + endOffsetMin * 60000);

    const formatTime = (d) =>
        d.toLocaleTimeString('pt-BR', {
            timeZone: process.env.APP_TIMEZONE || 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

    return {
        inicio: startDate.toISOString(),
        fim: endDate.toISOString(),
        formato_amigavel: `${formatTime(startDate)} - ${formatTime(endDate)}`
    };
}

/**
 * Retorna recomendações técnicas práticas de segurança baseadas na NR-20 e Normam-04/DPC
 */
function getSafetyGuidelines(locationType = 'MARINA', liters = 0) {
    const type = String(locationType || 'MARINA').toUpperCase();
    const guidelines = [];

    if (['MARINA', 'PONTÃO', 'PONTAO'].includes(type)) {
        guidelines.push('Desligar motores, geradores e circuitos elétricos da embarcação antes de iniciar o abastecimento (Normam-04/DPC).');
        guidelines.push('Conectar o cabo de equalização de potencial eletrostático antes da abertura do bocal do reservatório.');
        guidelines.push('Manter extintor de incêndio PQS ou CO2 desobstruído e pronto para uso imediato no píer.');
        guidelines.push('Proibir fumar ou acionar dispositivos não intrinsecamente seguros em um raio mínimo de 15 metros.');
        guidelines.push('Manter kit de mitigação com mantas absorventes a postos na linha d\'água para contenção preventiva de hidrocarbonetos.');
    } else if (['EMPRESA', 'GERADOR'].includes(type)) {
        guidelines.push('Isolar e sinalizar a área operacional com cones e fita zebrada conforme raio de segurança da NR-20.');
        guidelines.push('Fixar grampo de aterramento estático homologado no chassi/tanque antes de iniciar a vazão.');
        guidelines.push('Verificar capacidade volumétrica nominal e respiro do reservatório para evitar transbordamento ou pressurização.');
        guidelines.push('Dispor de extintor de pó químico com capacidade extintora mínima classe BC a barlavento da operação.');
    } else if (['CHACARA', 'RESIDENCIA'].includes(type)) {
        guidelines.push('Manter pessoas não autorizadas, crianças e animais domésticos afastados da zona de descarga.');
        guidelines.push('Garantir ventilação natural plena no local e verificar ausência de desníveis ou ralos próximos ao ponto de abastecimento.');
        guidelines.push('Utilizar exclusivamente recipientes certificados e homologados pelo INMETRO para combustível fracionado.');
        guidelines.push('Desligar equipamentos elétricos e não manusear celulares ou lanternas comuns na zona de risco.');
    } else {
        guidelines.push('Isolar o perímetro operacional e manter a área livre de qualquer fonte de calor ou ignição (NR-20).');
        guidelines.push('Efetuar equalização eletrostática obrigatória antes de qualquer transferência de combustível.');
        guidelines.push('Manter extintores de incêndio portáteis adequados ao alcance imediato do operador.');
    }

    const qty = Number(liters) || 0;
    if (qty >= 500) {
        guidelines.push(`Operação com volume expressivo (${qty}L): manter operador dedicado junto à válvula de fechamento rápido de emergência.`);
    }

    return guidelines;
}

/**
 * Calcula a estimativa de tempo para o posto aceitar o pedido quando em status PENDENTE.
 * Fila baseada exclusivamente em pedidos PENDENTES no mesmo posto.
 */
function calculateAcceptanceEta({ pendingQueueCount = 0 }) {
    const queue = Math.max(0, Number(pendingQueueCount) || 0);
    const baseMinutes = 5;
    const queueMinutes = queue * 4; // ~4 minutos por pedido pendente na fila do posto
    const totalMinutes = baseMinutes + queueMinutes;
    const estimatedArrival = new Date(Date.now() + totalMinutes * 60000);

    return {
        tipo_fase: 'ACEITE',
        fila_pendentes: queue,
        tempo_base_minutos: baseMinutes,
        tempo_fila_minutos: queueMinutes,
        total_minutos: totalMinutes,
        tempo_formatado: formatDurationHoursMinutes(totalMinutes),
        horario_previsto_aceite: estimatedArrival.toISOString()
    };
}

/**
 * Decompõe os tempos necessários para a entrega considerando o estado atual do pedido,
 * rota real ou distância geodésica, velocidade por tipo de local e comparação com o baseline inicial.
 */
function calculateBreakdownTimes({
    originLat, originLon,
    destLat, destLon,
    prepTimeStation = 15,
    pendingDeliveries = 0,
    locationType = 'RESIDENCIA',
    orderStatus = null,
    baselineEta = null,
    queueOrdersCount = null,
    routeMetrics = null,
    liters = 0
}) {
    const tortuosityFactor = parseFloat(process.env.ROUTING_TORTUOSITY_FACTOR) || DEFAULT_TORTUOSITY_FACTOR;
    const linearDistanceKm = routeMetrics?.distancia_linear_km !== undefined
        ? Number(routeMetrics.distancia_linear_km)
        : calculateHaversineDistance(originLat, originLon, destLat, destLon);

    let routeDistanceKm;
    let travelMinutes;
    let rotaGeometria;
    let fonteRoteamento;
    let anomaliaDistancia;

    if (routeMetrics && typeof routeMetrics.distancia_km === 'number') {
        routeDistanceKm = Number(routeMetrics.distancia_km);
        travelMinutes = Number(routeMetrics.duracao_minutos) || 5;
        rotaGeometria = routeMetrics.geometria || {
            type: 'LineString',
            coordinates: [[originLon, originLat], [destLon, destLat]]
        };
        fonteRoteamento = routeMetrics.fonte || 'OSRM';
        anomaliaDistancia = routeMetrics.anomalia_distancia ?? (routeDistanceKm > MAX_OPERATIONAL_RADIUS_KM);
    } else {
        routeDistanceKm = linearDistanceKm * tortuosityFactor;

        // Velocidade média ajustada pelo tipo de local
        let avgSpeedKmH = 30;
        const normalizedType = String(locationType || 'RESIDENCIA').toUpperCase();
        if (['MARINA', 'CHACARA', 'PONTÃO', 'PONTAO'].includes(normalizedType)) {
            avgSpeedKmH = 20; 
        }

        travelMinutes = Math.max(Math.ceil((routeDistanceKm / avgSpeedKmH) * 60), 5);
        rotaGeometria = {
            type: 'LineString',
            coordinates: [[originLon, originLat], [destLon, destLat]]
        };
        fonteRoteamento = 'HAVERSINE_FALLBACK';
        anomaliaDistancia = routeDistanceKm > MAX_OPERATIONAL_RADIUS_KM;
    }
    
    const queueCount = queueOrdersCount !== null && queueOrdersCount !== undefined
        ? Number(queueOrdersCount) || 0
        : Number(pendingDeliveries) || 0;

    let tipoFase = 'ENTREGA';
    let tempoPreparo = Number(prepTimeStation) || 15;
    let tempoEspera = queueCount * 12;
    let tempoViagem = travelMinutes;
    let totalMinutes = 0;
    let estimatedArrival;
    let deltaAtrasoMinutos = 0;
    let temAtrasoBaseline = false;

    if (orderStatus === 'PENDENTE') {
        tipoFase = 'ACEITE';
        const acceptance = calculateAcceptanceEta({ pendingQueueCount: queueCount });
        tempoPreparo = 0;
        tempoEspera = acceptance.tempo_fila_minutos;
        tempoViagem = 0;
        totalMinutes = acceptance.total_minutos;
        estimatedArrival = new Date(acceptance.horario_previsto_aceite);
    } else if (orderStatus === 'CONFIRMADO_POSTO') {
        tipoFase = 'ENTREGA';
        tempoEspera = queueCount * 12;
        tempoPreparo = Number(prepTimeStation) || 15;
        tempoViagem = travelMinutes;
        totalMinutes = tempoEspera + tempoPreparo + tempoViagem;
        estimatedArrival = new Date(Date.now() + totalMinutes * 60000);
    } else if (orderStatus === 'EM_PREPARACAO') {
        tipoFase = 'ENTREGA';
        tempoEspera = 0; // Fila prévia de confirmação superada
        tempoPreparo = Number(prepTimeStation) || 15; // Preparo residual do posto
        tempoViagem = travelMinutes;
        totalMinutes = tempoPreparo + tempoViagem;
        estimatedArrival = new Date(Date.now() + totalMinutes * 60000);
    } else if (orderStatus === 'EM_TRANSPORTE') {
        tipoFase = 'ENTREGA';
        tempoEspera = 0;
        tempoPreparo = 0; // Preparação concluída
        tempoViagem = travelMinutes;
        totalMinutes = travelMinutes;
        estimatedArrival = new Date(Date.now() + totalMinutes * 60000);
    } else {
        // Modo retrocompatível / status nulo
        tipoFase = 'ENTREGA';
        tempoEspera = queueCount * 12;
        tempoPreparo = Number(prepTimeStation) || 15;
        tempoViagem = travelMinutes;
        totalMinutes = tempoEspera + tempoPreparo + tempoViagem;
        estimatedArrival = new Date(Date.now() + totalMinutes * 60000);
    }

    if (orderStatus !== 'PENDENTE' && baselineEta && estimatedArrival) {
        const baselineTime = new Date(baselineEta).getTime();
        if (!isNaN(baselineTime)) {
            const diffMin = Math.round((estimatedArrival.getTime() - baselineTime) / 60000);
            deltaAtrasoMinutos = Math.max(0, diffMin);
            temAtrasoBaseline = diffMin > 5;
        }
    }

    const janelaEntrega = calculateDeliveryWindow(estimatedArrival, totalMinutes, orderStatus);
    const recomendacoesSeguranca = getSafetyGuidelines(locationType, liters);

    return {
        distanceKm: parseFloat(routeDistanceKm.toFixed(2)),
        distancia_linear_km: parseFloat(linearDistanceKm.toFixed(2)),
        fator_tortuosidade: tortuosityFactor,
        anomalia_distancia: anomaliaDistancia,
        tipo_fase: tipoFase,
        fila_pedidos: queueCount,
        tempo_preparo: tempoPreparo,
        tempo_espera: tempoEspera,
        tempo_viagem: tempoViagem,
        total_minutos: totalMinutes,
        tempo_formatado: formatDurationHoursMinutes(totalMinutes),
        horario_previsto_chegada: estimatedArrival.toISOString(),
        baseline_eta: (() => {
            if (!baselineEta) return null;
            const d = new Date(baselineEta);
            return !isNaN(d.getTime()) ? d.toISOString() : null;
        })(),
        delta_atraso_minutos: deltaAtrasoMinutos,
        tem_atraso_baseline: temAtrasoBaseline,
        rota_geometria: rotaGeometria,
        fonte_roteamento: fonteRoteamento,
        janela_entrega: janelaEntrega,
        recomendacoes_seguranca: recomendacoesSeguranca
    };
}

module.exports = {
    DEFAULT_TORTUOSITY_FACTOR,
    MAX_OPERATIONAL_RADIUS_KM,
    calculateHaversineDistance,
    calculateAcceptanceEta,
    calculateBreakdownTimes,
    formatDurationHoursMinutes,
    calculateDeliveryWindow,
    getSafetyGuidelines
};
