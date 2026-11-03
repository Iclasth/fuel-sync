const { fetchRealRoute, DEFAULT_OSRM_TIMEOUT_MS } = require('../../src/modules/ai/routingClient');
const AppError = require('../../src/common/errors/AppError');

describe('Unit: AI Module - Routing Client (OSRM & Haversine Fallback)', () => {
    const originalFetch = global.fetch;

    // Coordenadas válidas próximas (~3.6 km linear)
    const validOrigin = { originLat: -23.550520, originLon: -46.633308 }; // Centro SP
    const validDest = { destLat: -23.518600, destLon: -46.625300 }; // Zona Norte SP

    // Coordenadas muito distantes (> 1000 km)
    const distantDest = { destLat: -12.971400, destLon: -38.501400 }; // Salvador/BA

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    describe('Validação Estrita de Coordenadas', () => {
        it('deve lançar erro se latitude de origem for inválida ou fora dos limites [-90, 90]', async () => {
            await expect(fetchRealRoute({
                originLat: 95,
                originLon: -46.633308,
                destLat: -23.518600,
                destLon: -46.625300
            })).rejects.toThrow();

            await expect(fetchRealRoute({
                originLat: 'invalido',
                originLon: -46.633308,
                destLat: -23.518600,
                destLon: -46.625300
            })).rejects.toThrow();
        });

        it('deve lançar erro se longitude for inválida ou fora dos limites [-180, 180]', async () => {
            await expect(fetchRealRoute({
                originLat: -23.550520,
                originLon: 185,
                destLat: -23.518600,
                destLon: -46.625300
            })).rejects.toThrow();

            await expect(fetchRealRoute({
                originLat: -23.550520,
                originLon: -46.633308,
                destLat: -23.518600,
                destLon: null
            })).rejects.toThrow();
        });
    });

    describe('Proteção de Anomalia Geográfica (> 100 km)', () => {
        it('deve abortar requisição externa imediatamente quando distância linear > 100 km e retornar fallback', async () => {
            const result = await fetchRealRoute({
                ...validOrigin,
                ...distantDest,
                locationType: 'MARINA'
            });

            // Não deve chamar fetch
            expect(global.fetch).not.toHaveBeenCalled();
            expect(result.fonte).toBe('HAVERSINE_FALLBACK');
            expect(result.anomalia_distancia).toBe(true);
            expect(result.distancia_km).toBeGreaterThan(100);
            expect(result.geometria).toEqual({
                type: 'LineString',
                coordinates: [
                    [validOrigin.originLon, validOrigin.originLat],
                    [distantDest.destLon, distantDest.destLat]
                ]
            });
        });
    });

    describe('Consulta ao OSRM com Sucesso', () => {
        it('deve extrair dados da rota do OSRM quando a resposta for 200 e code Ok', async () => {
            const mockGeometry = {
                type: 'LineString',
                coordinates: [
                    [-46.633308, -23.550520],
                    [-46.630000, -23.540000],
                    [-46.625300, -23.518600]
                ]
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    code: 'Ok',
                    routes: [
                        {
                            distance: 4850.5, // metros
                            duration: 720.0,   // segundos = 12 min
                            geometry: mockGeometry
                        }
                    ]
                })
            });

            const result = await fetchRealRoute({
                ...validOrigin,
                ...validDest,
                locationType: 'RESIDENCIA'
            });

            expect(global.fetch).toHaveBeenCalledTimes(1);
            const calledUrl = global.fetch.mock.calls[0][0];
            // OSRM deve receber lon,lat na URL
            expect(calledUrl).toContain(`${validOrigin.originLon},${validOrigin.originLat};${validDest.destLon},${validDest.destLat}`);
            expect(calledUrl).toContain('overview=full&geometries=geojson');

            expect(result.distancia_km).toBe(4.85);
            expect(result.duracao_minutos).toBe(12);
            expect(result.geometria).toEqual(mockGeometry);
            expect(result.fonte).toBe('OSRM');
            expect(result.anomalia_distancia).toBe(false);
        });
    });

    describe('Fallback Determinístico em Casos de Falha', () => {
        it('deve retornar fallback determinístico quando OSRM retornar HTTP 500', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error'
            });

            const result = await fetchRealRoute({
                ...validOrigin,
                ...validDest,
                locationType: 'MARINA'
            });

            expect(result.fonte).toBe('HAVERSINE_FALLBACK');
            expect(result.distancia_km).toBeGreaterThan(0);
            expect(result.duracao_minutos).toBeGreaterThan(0);
            expect(result.geometria.coordinates).toEqual([
                [validOrigin.originLon, validOrigin.originLat],
                [validDest.destLon, validDest.destLat]
            ]);
        });

        it('deve retornar fallback determinístico quando OSRM retornar code diferente de Ok', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    code: 'NoRoute',
                    routes: []
                })
            });

            const result = await fetchRealRoute({
                ...validOrigin,
                ...validDest,
                locationType: 'RESIDENCIA'
            });

            expect(result.fonte).toBe('HAVERSINE_FALLBACK');
            expect(result.distancia_km).toBeGreaterThan(0);
            expect(result.duracao_minutos).toBeGreaterThan(0);
        });

        it('deve retornar fallback determinístico quando ocorrer AbortError (timeout)', async () => {
            const timeoutError = new Error('The operation was aborted');
            timeoutError.name = 'AbortError';
            global.fetch.mockRejectedValueOnce(timeoutError);

            const result = await fetchRealRoute({
                ...validOrigin,
                ...validDest,
                locationType: 'MARINA'
            });

            expect(result.fonte).toBe('HAVERSINE_FALLBACK');
            expect(result.duracao_minutos).toBeGreaterThan(0);
        });

        it('deve utilizar velocidade náutica/reduzida (20 km/h) para MARINA e CHACARA no fallback', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const resultMarina = await fetchRealRoute({
                ...validOrigin,
                ...validDest,
                locationType: 'MARINA'
            });

            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const resultResidencia = await fetchRealRoute({
                ...validOrigin,
                ...validDest,
                locationType: 'RESIDENCIA'
            });

            // A mesma distância percorrida a 20 km/h leva mais tempo que a 30 km/h
            expect(resultMarina.duracao_minutos).toBeGreaterThanOrEqual(resultResidencia.duracao_minutos);
        });

        it('deve exportar DEFAULT_OSRM_TIMEOUT_MS calibrado em 5000ms', () => {
            expect(DEFAULT_OSRM_TIMEOUT_MS).toBe(5000);
        });
    });
});
