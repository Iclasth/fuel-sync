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
 * distância geodésica, velocidade por tipo de local e comparação com o baseline inicial.
 */
function calculateBreakdownTimes({
    originLat, originLon,
    destLat, destLon,
    prepTimeStation = 15,
    pendingDeliveries = 0,
    locationType = 'RESIDENCIA',
    orderStatus = null,
    baselineEta = null,
    queueOrdersCount = null
}) {
    const tortuosityFactor = parseFloat(process.env.ROUTING_TORTUOSITY_FACTOR) || DEFAULT_TORTUOSITY_FACTOR;
    const linearDistanceKm = calculateHaversineDistance(originLat, originLon, destLat, destLon);
    const routeDistanceKm = linearDistanceKm * tortuosityFactor;
    
    // Velocidade média ajustada pelo tipo de local (ex: Marinas/Chácaras exigem deslocamento mais lento)
    let avgSpeedKmH = 30;
    const normalizedType = String(locationType || 'RESIDENCIA').toUpperCase();
    if (['MARINA', 'CHACARA', 'PONTÃO', 'PONTAO'].includes(normalizedType)) {
        avgSpeedKmH = 20; 
    }

    const travelMinutes = Math.max(Math.ceil((routeDistanceKm / avgSpeedKmH) * 60), 5);
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

        if (baselineEta) {
            const baselineTime = new Date(baselineEta).getTime();
            if (!isNaN(baselineTime)) {
                const diffMin = Math.round((estimatedArrival.getTime() - baselineTime) / 60000);
                deltaAtrasoMinutos = Math.max(0, diffMin);
                temAtrasoBaseline = diffMin > 5;
            }
        }
    } else if (orderStatus === 'EM_PREPARACAO') {
        tipoFase = 'ENTREGA';
        tempoEspera = 0; // Fila prévia de confirmação superada
        tempoPreparo = Number(prepTimeStation) || 15; // Preparo residual do posto
        tempoViagem = travelMinutes;
        totalMinutes = tempoPreparo + tempoViagem;
        estimatedArrival = new Date(Date.now() + totalMinutes * 60000);

        if (baselineEta) {
            const baselineTime = new Date(baselineEta).getTime();
            if (!isNaN(baselineTime)) {
                const diffMin = Math.round((estimatedArrival.getTime() - baselineTime) / 60000);
                deltaAtrasoMinutos = Math.max(0, diffMin);
                temAtrasoBaseline = diffMin > 5;
            }
        }
    } else if (orderStatus === 'EM_TRANSPORTE') {
        tipoFase = 'ENTREGA';
        tempoEspera = 0;
        tempoPreparo = 0; // Preparação concluída
        tempoViagem = travelMinutes;
        totalMinutes = travelMinutes;
        estimatedArrival = new Date(Date.now() + totalMinutes * 60000);

        if (baselineEta) {
            const baselineTime = new Date(baselineEta).getTime();
            if (!isNaN(baselineTime)) {
                const diffMin = Math.round((estimatedArrival.getTime() - baselineTime) / 60000);
                deltaAtrasoMinutos = Math.max(0, diffMin);
                temAtrasoBaseline = diffMin > 5;
            }
        }
    } else {
        // Modo retrocompatível / status nulo
        tipoFase = 'ENTREGA';
        tempoEspera = queueCount * 12;
        tempoPreparo = Number(prepTimeStation) || 15;
        tempoViagem = travelMinutes;
        totalMinutes = tempoEspera + tempoPreparo + tempoViagem;
        estimatedArrival = new Date(Date.now() + totalMinutes * 60000);
    }

    return {
        distanceKm: parseFloat(routeDistanceKm.toFixed(2)),
        distancia_linear_km: parseFloat(linearDistanceKm.toFixed(2)),
        fator_tortuosidade: tortuosityFactor,
        anomalia_distancia: routeDistanceKm > MAX_OPERATIONAL_RADIUS_KM,
        tipo_fase: tipoFase,
        fila_pedidos: queueCount,
        tempo_preparo: tempoPreparo,
        tempo_espera: tempoEspera,
        tempo_viagem: tempoViagem,
        total_minutos: totalMinutes,
        tempo_formatado: formatDurationHoursMinutes(totalMinutes),
        horario_previsto_chegada: estimatedArrival.toISOString(),
        baseline_eta: baselineEta ? new Date(baselineEta).toISOString() : null,
        delta_atraso_minutos: deltaAtrasoMinutos,
        tem_atraso_baseline: temAtrasoBaseline
    };
}

module.exports = {
    DEFAULT_TORTUOSITY_FACTOR,
    MAX_OPERATIONAL_RADIUS_KM,
    calculateHaversineDistance,
    calculateAcceptanceEta,
    calculateBreakdownTimes,
    formatDurationHoursMinutes
};