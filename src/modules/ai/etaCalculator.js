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
 * Decompõe os tempos necessários para a entrega
 */
function calculateBreakdownTimes({
    originLat, originLon,
    destLat, destLon,
    prepTimeStation = 15,
    pendingDeliveries = 0,
    locationType = 'RESIDENCIA'
}) {
    const distanceKm = calculateHaversineDistance(originLat, originLon, destLat, destLon);
    
    // Velocidade média ajustada pelo tipo de local (ex: Marinas/Chácaras exigem deslocamento mais lento)
    let avgSpeedKmH = 30;
    if (['MARINA', 'CHACARA', 'PONTÃO'].includes(locationType.toUpperCase())) {
        avgSpeedKmH = 20; 
    }

    const travelMinutes = Math.max(Math.ceil((distanceKm / avgSpeedKmH) * 60), 5);
    const queueMinutes = pendingDeliveries * 12; // Média de 12 min por entrega pendente
    const prepMinutes = Number(prepTimeStation) || 15;

    const totalMinutes = travelMinutes + queueMinutes + prepMinutes;
    const estimatedArrival = new Date(Date.now() + totalMinutes * 60000);

    return {
        distanceKm: parseFloat(distanceKm.toFixed(2)),
        tempo_preparo: prepMinutes,
        tempo_espera: queueMinutes,
        tempo_viagem: travelMinutes,
        total_minutos: totalMinutes,
        horario_previsto_chegada: estimatedArrival.toISOString()
    };
}

module.exports = {
    calculateHaversineDistance,
    calculateBreakdownTimes
};