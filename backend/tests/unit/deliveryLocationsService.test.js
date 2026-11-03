const deliveryLocationsService = require('../../src/modules/customers/deliveryLocationsService');
const supabase = require('../../src/config/supabaseClient');
const AppError = require('../../src/common/errors/AppError');

jest.mock('../../src/config/supabaseClient', () => ({
    from: jest.fn()
}));

describe('Unit: Delivery Locations Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createLocation validation', () => {
        it('deve rejeitar se apelido for vazio', async () => {
            await expect(
                deliveryLocationsService.createLocation('usr-1', {
                    apelido: '',
                    tipo_local: 'MARINA',
                    endereco: 'Av. Portuária, 100',
                    latitude: -23.0,
                    longitude: -44.0
                })
            ).rejects.toThrow(AppError);
        });

        it('deve rejeitar se tipo_local for inválido', async () => {
            await expect(
                deliveryLocationsService.createLocation('usr-1', {
                    apelido: 'Minha Poita',
                    tipo_local: 'AEROPORTO_INVALIDO',
                    endereco: 'Av. Portuária, 100',
                    latitude: -23.0,
                    longitude: -44.0
                })
            ).rejects.toThrow('Tipo de local inválido');
        });

        it('deve rejeitar se latitude estiver fora dos limites (-90 a 90)', async () => {
            await expect(
                deliveryLocationsService.createLocation('usr-1', {
                    apelido: 'Minha Poita',
                    tipo_local: 'MARINA',
                    endereco: 'Av. Portuária, 100',
                    latitude: 95.0,
                    longitude: -44.0
                })
            ).rejects.toThrow('Latitude inválida');
        });

        it('deve rejeitar se longitude estiver fora dos limites (-180 a 180)', async () => {
            await expect(
                deliveryLocationsService.createLocation('usr-1', {
                    apelido: 'Minha Poita',
                    tipo_local: 'MARINA',
                    endereco: 'Av. Portuária, 100',
                    latitude: -23.0,
                    longitude: -195.0
                })
            ).rejects.toThrow('Longitude inválida');
        });
    });

    describe('listLocations', () => {
        it('deve listar locais do cliente com sucesso', async () => {
            // Mock getClienteIdByUserId
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 10 }, error: null })
            });

            // Mock listLocations query
            const mockLocations = [
                { id: 1, apelido: 'Marina da Glória', tipo_local: 'MARINA', padrao: true }
            ];
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn()
            };
            queryChain.order
                .mockReturnValueOnce(queryChain)
                .mockResolvedValueOnce({ data: mockLocations, error: null });

            supabase.from.mockReturnValueOnce(queryChain);

            const result = await deliveryLocationsService.listLocations('usr-1');
            expect(Array.isArray(result)).toBe(true);
            expect(result[0].apelido).toBe('Marina da Glória');
        });
    });
});
