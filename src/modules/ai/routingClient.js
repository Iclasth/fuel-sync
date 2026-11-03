const AppError = require('../../common/errors/AppError');
const {
    DEFAULT_TORTUOSITY_FACTOR,
    MAX_OPERATIONAL_RADIUS_KM,
    calculateHaversineDistance
} = require('./etaCalculator');

const DEFAULT_OSRM_BASE_URL = 'https://router.project-osrm.org';
const DEFAULT_OSRM_TIMEOUT_MS = 5000;

/**
 * Valida se as coordenadas são números válidos dentro dos limites do globo terrestre
 */
function validateCoordinates(originLat, originLon, destLat, destLon) {
    const isValidCoord = (num, min, max) =>
        typeof num === 'number' && Number.isFinite(num) && num >= min && num <= max;

    if (
        !isValidCoord(originLat, -90, 90) ||
        !isValidCoord(destLat, -90, 90) ||
        !isValidCoord(originLon, -180, 180) ||
        !isValidCoord(destLon, -180, 180)
    ) {
        throw new AppError('Coordenadas de origem ou destino inválidas.', 400);
    }
}

/**
 * Gera rota de fallback determinístico baseado na distância de Haversine e fator de tortuosidade
 */
function generateFallbackRoute({
    originLat,
    originLon,
    destLat,
    destLon,
    locationType = 'RESIDENCIA',
    linearDistanceKm = null,
    isAnomaly = false
}) {
    const tortuosityFactor = parseFloat(process.env.ROUTING_TORTUOSITY_FACTOR) || DEFAULT_TORTUOSITY_FACTOR;
    const linear = linearDistanceKm !== null
        ? linearDistanceKm
        : calculateHaversineDistance(originLat, originLon, destLat, destLon);
    
    const routeDistanceKm = linear * tortuosityFactor;

    // Velocidade média ajustada por tipo de local
    let avgSpeedKmH = 30;
    const normalizedType = String(locationType || 'RESIDENCIA').toUpperCase();
    if (['MARINA', 'CHACARA', 'PONTÃO', 'PONTAO'].includes(normalizedType)) {
        avgSpeedKmH = 20;
    }

    const durationMinutes = Math.max(Math.ceil((routeDistanceKm / avgSpeedKmH) * 60), 5);
    const hasAnomaly = isAnomaly || linear > MAX_OPERATIONAL_RADIUS_KM || routeDistanceKm > MAX_OPERATIONAL_RADIUS_KM;

    return {
        distancia_km: parseFloat(routeDistanceKm.toFixed(2)),
        distancia_linear_km: parseFloat(linear.toFixed(2)),
        duracao_minutos: durationMinutes,
        geometria: {
            type: 'LineString',
            coordinates: [
                [originLon, originLat],
                [destLon, destLat]
            ]
        },
        fonte: 'HAVERSINE_FALLBACK',
        anomalia_distancia: hasAnomaly
    };
}

/**
 * Consulta a rota real de condução utilizando o serviço OSRM ou fallback determinístico
 */
async function fetchRealRoute({
    originLat,
    originLon,
    destLat,
    destLon,
    locationType = 'RESIDENCIA'
}) {
    // 1. Validação estrita de coordenadas
    validateCoordinates(originLat, originLon, destLat, destLon);

    // 2. Cálculo prévio de distância linear (Haversine)
    const linearDistanceKm = calculateHaversineDistance(originLat, originLon, destLat, destLon);

    // 3. Verificação de anomalia geográfica (> 100 km): abortar chamada externa imediatamente
    if (linearDistanceKm > MAX_OPERATIONAL_RADIUS_KM) {
        return generateFallbackRoute({
            originLat,
            originLon,
            destLat,
            destLon,
            locationType,
            linearDistanceKm,
            isAnomaly: true
        });
    }

    // 4. Consulta externa ao OSRM com timeout via AbortController
    const baseUrl = process.env.OSRM_BASE_URL || DEFAULT_OSRM_BASE_URL;
    const timeoutMs = parseInt(process.env.OSRM_TIMEOUT_MS || String(DEFAULT_OSRM_TIMEOUT_MS), 10);

    try {
        const parsedBaseUrl = new URL(baseUrl);
        if (!['http:', 'https:'].includes(parsedBaseUrl.protocol) || parsedBaseUrl.hostname === '169.254.169.254') {
            return generateFallbackRoute({
                originLat,
                originLon,
                destLat,
                destLon,
                locationType,
                linearDistanceKm
            });
        }
    } catch (_) {
        return generateFallbackRoute({
            originLat,
            originLon,
            destLat,
            destLon,
            locationType,
            linearDistanceKm
        });
    }

    // Atenção: OSRM utiliza a ordem longitude,latitude na URL
    const url = `${baseUrl}/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            redirect: 'error',
            signal: controller.signal
        });

        if (!response.ok) {
            console.warn(`OSRM respondeu com status ${response.status}. Ativando fallback determinístico.`);
            return generateFallbackRoute({
                originLat,
                originLon,
                destLat,
                destLon,
                locationType,
                linearDistanceKm
            });
        }

        const data = await response.json();

        if (data && data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceKm = parseFloat((route.distance / 1000).toFixed(2));
            const durationMinutes = Math.max(Math.ceil(route.duration / 60), 1);

            return {
                distancia_km: distanceKm,
                distancia_linear_km: parseFloat(linearDistanceKm.toFixed(2)),
                duracao_minutos: durationMinutes,
                geometria: route.geometry,
                fonte: 'OSRM',
                anomalia_distancia: distanceKm > MAX_OPERATIONAL_RADIUS_KM
            };
        }

        console.warn(`OSRM retornou code '${data?.code}' sem rotas válidas. Ativando fallback.`);
        return generateFallbackRoute({
            originLat,
            originLon,
            destLat,
            destLon,
            locationType,
            linearDistanceKm
        });
    } catch (err) {
        const reason = err.name === 'AbortError' ? `Timeout (${timeoutMs}ms)` : err.message;
        console.warn(`Falha na consulta ao OSRM (${reason}). Ativando fallback determinístico.`);
        return generateFallbackRoute({
            originLat,
            originLon,
            destLat,
            destLon,
            locationType,
            linearDistanceKm
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = {
    fetchRealRoute,
    generateFallbackRoute,
    validateCoordinates,
    DEFAULT_OSRM_BASE_URL,
    DEFAULT_OSRM_TIMEOUT_MS
};
