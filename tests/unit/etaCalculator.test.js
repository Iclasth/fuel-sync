const {
    DEFAULT_TORTUOSITY_FACTOR,
    MAX_OPERATIONAL_RADIUS_KM,
    calculateHaversineDistance,
    calculateAcceptanceEta,
    calculateBreakdownTimes,
    formatDurationHoursMinutes
} = require('../../src/modules/ai/etaCalculator');

describe('Unit: AI Module - ETA Calculator', () => {
    // Coordenadas reais de teste: Posto Base (-23.550520, -46.633308) até Marina Tietê (-23.518600, -46.625300)
    const baseStation = {
        latitude: -23.550520,
        longitude: -46.633308,
        tempo_medio_preparo: 15
    };

    const marinaDest = {
        latitude: -23.518600,
        longitude: -46.625300,
        tipo_local: 'MARINA'
    };

    const condoDest = {
        latitude: -23.518600,
        longitude: -46.625300,
        tipo_local: 'RESIDENCIA'
    };

    it('deve calcular a distância geodésica em linha reta via Haversine', () => {
        const linearDist = calculateHaversineDistance(
            baseStation.latitude,
            baseStation.longitude,
            marinaDest.latitude,
            marinaDest.longitude
        );

        // Distância linear conhecida em torno de ~3.64 km
        expect(linearDist).toBeGreaterThan(3.0);
        expect(linearDist).toBeLessThan(4.5);
    });

    it('deve aplicar o fator de tortuosidade viária/náutica sobre a distância linear', () => {
        const result = calculateBreakdownTimes({
            originLat: baseStation.latitude,
            originLon: baseStation.longitude,
            destLat: marinaDest.latitude,
            destLon: marinaDest.longitude,
            prepTimeStation: 15,
            pendingDeliveries: 0,
            locationType: 'MARINA'
        });

        expect(result.fator_tortuosidade).toBe(DEFAULT_TORTUOSITY_FACTOR);
        expect(result.distanceKm).toBeGreaterThan(result.distancia_linear_km);
        expect(result.distanceKm).toBeCloseTo(result.distancia_linear_km * DEFAULT_TORTUOSITY_FACTOR, 1);
    });

    it('deve adotar velocidade média reduzida (20 km/h) para locais náuticos (MARINA, CHACARA, PONTAO)', () => {
        const marinaResult = calculateBreakdownTimes({
            originLat: baseStation.latitude,
            originLon: baseStation.longitude,
            destLat: marinaDest.latitude,
            destLon: marinaDest.longitude,
            prepTimeStation: 10,
            pendingDeliveries: 0,
            locationType: 'MARINA'
        });

        const condoResult = calculateBreakdownTimes({
            originLat: baseStation.latitude,
            originLon: baseStation.longitude,
            destLat: condoDest.latitude,
            destLon: condoDest.longitude,
            prepTimeStation: 10,
            pendingDeliveries: 0,
            locationType: 'RESIDENCIA'
        });

        // Marina (20 km/h) deve levar tempo de viagem maior que residência urbana (30 km/h)
        expect(marinaResult.tempo_viagem).toBeGreaterThanOrEqual(condoResult.tempo_viagem);
    });

    it('deve decompor corretamente tempo de preparo, tempo de fila e somatório total', () => {
        const pending = 2; // 2 * 12 min = 24 min
        const prep = 18;
        const result = calculateBreakdownTimes({
            originLat: baseStation.latitude,
            originLon: baseStation.longitude,
            destLat: marinaDest.latitude,
            destLon: marinaDest.longitude,
            prepTimeStation: prep,
            pendingDeliveries: pending,
            locationType: 'MARINA'
        });

        expect(result.tempo_preparo).toBe(prep);
        expect(result.tempo_espera).toBe(24);
        expect(result.total_minutos).toBe(result.tempo_viagem + 24 + prep);
        expect(result).toHaveProperty('tempo_formatado');
        expect(typeof result.tempo_formatado).toBe('string');
        expect(result.anomalia_distancia).toBe(false);
        expect(new Date(result.horario_previsto_chegada).getTime()).toBeGreaterThan(Date.now());
    });

    it('deve calcular corretamente trajeto local em Recife (-8.0722, -34.8767 até -8.0588, -34.8906) em cerca de 24 min', () => {
        const recifeStation = { latitude: -8.072200, longitude: -34.876700 };
        const recifeDestination = { latitude: -8.058800, longitude: -34.890600 };

        const linearDist = calculateHaversineDistance(
            recifeStation.latitude,
            recifeStation.longitude,
            recifeDestination.latitude,
            recifeDestination.longitude
        );

        // Distância linear conhecida de ~2.14 km
        expect(linearDist).toBeCloseTo(2.14, 1);

        const result = calculateBreakdownTimes({
            originLat: recifeStation.latitude,
            originLon: recifeStation.longitude,
            destLat: recifeDestination.latitude,
            destLon: recifeDestination.longitude,
            prepTimeStation: 15,
            pendingDeliveries: 0,
            locationType: 'MARINA'
        });

        // Rota de ~2.88 km a 20 km/h = 9 min de viagem + 15 min de preparo = 24 min
        expect(result.distanceKm).toBeCloseTo(2.88, 1);
        expect(result.tempo_viagem).toBe(9);
        expect(result.total_minutos).toBe(24);
        expect(result.tempo_formatado).toBe('24 min');
        expect(result.anomalia_distancia).toBe(false);
    });

    it('deve sinalizar anomalia_distancia = true para trajetos interestaduais superiores a 100 km (ex: SP até Recife)', () => {
        const spStation = { latitude: -23.550520, longitude: -46.633308 };
        const recifeDestination = { latitude: -8.058800, longitude: -34.890600 };

        const result = calculateBreakdownTimes({
            originLat: spStation.latitude,
            originLon: spStation.longitude,
            destLat: recifeDestination.latitude,
            destLon: recifeDestination.longitude,
            prepTimeStation: 15,
            pendingDeliveries: 0,
            locationType: 'MARINA'
        });

        expect(result.distanceKm).toBeGreaterThan(2000);
        expect(result.anomalia_distancia).toBe(true);
        expect(result.distanceKm).toBeGreaterThan(MAX_OPERATIONAL_RADIUS_KM);
    });

    describe('formatDurationHoursMinutes', () => {
        it('deve formatar minutos inferiores a 60 min corretamente', () => {
            expect(formatDurationHoursMinutes(45)).toBe('45 min');
            expect(formatDurationHoursMinutes(5)).toBe('5 min');
        });

        it('deve formatar horas exatas sem minutos restantes', () => {
            expect(formatDurationHoursMinutes(60)).toBe('1h');
            expect(formatDurationHoursMinutes(120)).toBe('2h');
        });

        it('deve formatar horas combinadas com minutos', () => {
            expect(formatDurationHoursMinutes(75)).toBe('1h 15min');
            expect(formatDurationHoursMinutes(90)).toBe('1h 30min');
            expect(formatDurationHoursMinutes(145)).toBe('2h 25min');
        });

        it('deve tratar valores zerados ou inválidos retornando 0 min', () => {
            expect(formatDurationHoursMinutes(0)).toBe('0 min');
            expect(formatDurationHoursMinutes(null)).toBe('0 min');
            expect(formatDurationHoursMinutes(-10)).toBe('0 min');
        });
    });

    describe('calculateAcceptanceEta', () => {
        it('deve calcular estimativa de aceite com fila zerada (5 min)', () => {
            const result = calculateAcceptanceEta({ pendingQueueCount: 0 });
            expect(result.tipo_fase).toBe('ACEITE');
            expect(result.fila_pendentes).toBe(0);
            expect(result.tempo_base_minutos).toBe(5);
            expect(result.tempo_fila_minutos).toBe(0);
            expect(result.total_minutos).toBe(5);
            expect(result.tempo_formatado).toBe('5 min');
            expect(new Date(result.horario_previsto_aceite).getTime()).toBeGreaterThan(Date.now());
        });

        it('deve somar 4 min por pedido pendente na fila do posto (ex: 3 pedidos = 17 min)', () => {
            const result = calculateAcceptanceEta({ pendingQueueCount: 3 });
            expect(result.tipo_fase).toBe('ACEITE');
            expect(result.fila_pendentes).toBe(3);
            expect(result.tempo_fila_minutos).toBe(12);
            expect(result.total_minutos).toBe(17);
            expect(result.tempo_formatado).toBe('17 min');
        });
    });

    describe('calculateBreakdownTimes por Estado Operacional', () => {
        it('deve calcular estimativa de aceite para status PENDENTE', () => {
            const result = calculateBreakdownTimes({
                originLat: baseStation.latitude,
                originLon: baseStation.longitude,
                destLat: condoDest.latitude,
                destLon: condoDest.longitude,
                prepTimeStation: 15,
                queueOrdersCount: 2,
                orderStatus: 'PENDENTE'
            });

            expect(result.tipo_fase).toBe('ACEITE');
            expect(result.tempo_preparo).toBe(0);
            expect(result.tempo_viagem).toBe(0);
            expect(result.tempo_espera).toBe(8); // 2 * 4 min
            expect(result.total_minutos).toBe(13); // 5 base + 8 fila
            expect(result.tempo_formatado).toBe('13 min');
            expect(result.tem_atraso_baseline).toBe(false);
        });

        it('deve calcular baseline completo para status CONFIRMADO_POSTO somando fila + preparo + viagem', () => {
            const result = calculateBreakdownTimes({
                originLat: baseStation.latitude,
                originLon: baseStation.longitude,
                destLat: condoDest.latitude,
                destLon: condoDest.longitude,
                prepTimeStation: 15,
                queueOrdersCount: 2, // 2 * 12 min = 24 min
                locationType: 'RESIDENCIA',
                orderStatus: 'CONFIRMADO_POSTO'
            });

            expect(result.tipo_fase).toBe('ENTREGA');
            expect(result.tempo_espera).toBe(24);
            expect(result.tempo_preparo).toBe(15);
            expect(result.total_minutos).toBe(24 + 15 + result.tempo_viagem);
            expect(result.tem_atraso_baseline).toBe(false);
        });

        it('deve desconsiderar fila prévia no status EM_PREPARACAO somando apenas preparo + viagem', () => {
            const result = calculateBreakdownTimes({
                originLat: baseStation.latitude,
                originLon: baseStation.longitude,
                destLat: condoDest.latitude,
                destLon: condoDest.longitude,
                prepTimeStation: 15,
                queueOrdersCount: 2, // Ignorado pois pedido já está em preparação
                locationType: 'RESIDENCIA',
                orderStatus: 'EM_PREPARACAO'
            });

            expect(result.tipo_fase).toBe('ENTREGA');
            expect(result.tempo_espera).toBe(0);
            expect(result.tempo_preparo).toBe(15);
            expect(result.total_minutos).toBe(15 + result.tempo_viagem);
        });

        it('deve considerar apenas tempo de viagem no status EM_TRANSPORTE', () => {
            const result = calculateBreakdownTimes({
                originLat: baseStation.latitude,
                originLon: baseStation.longitude,
                destLat: condoDest.latitude,
                destLon: condoDest.longitude,
                prepTimeStation: 15,
                queueOrdersCount: 2,
                locationType: 'RESIDENCIA',
                orderStatus: 'EM_TRANSPORTE'
            });

            expect(result.tipo_fase).toBe('ENTREGA');
            expect(result.tempo_espera).toBe(0);
            expect(result.tempo_preparo).toBe(0);
            expect(result.total_minutos).toBe(result.tempo_viagem);
        });

        it('deve identificar atraso vs. baseline quando projeção atual ultrapassa o horário acordado em mais de 5 min', () => {
            const pastBaseline = new Date(Date.now() - 30 * 60000).toISOString(); // Baseline era há 30 min atrás

            const result = calculateBreakdownTimes({
                originLat: baseStation.latitude,
                originLon: baseStation.longitude,
                destLat: condoDest.latitude,
                destLon: condoDest.longitude,
                prepTimeStation: 15,
                orderStatus: 'EM_TRANSPORTE',
                baselineEta: pastBaseline
            });

            expect(result.tem_atraso_baseline).toBe(true);
            expect(result.delta_atraso_minutos).toBeGreaterThan(5);
        });
    });
});

