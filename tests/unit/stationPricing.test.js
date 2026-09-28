const stationService = require('../../src/modules/stations/stationService');
const supabase = require('../../src/config/supabaseClient');
const AppError = require('../../src/common/errors/AppError');

jest.mock('../../src/config/supabaseClient', () => ({
    from: jest.fn()
}));

describe('Unit: Station Pricing and Multi-tenant Administration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateStationAccess', () => {
        it('deve lançar 401 se usuário não for fornecido', async () => {
            await expect(stationService.validateStationAccess(null, 1))
                .rejects.toThrow(AppError);
        });

        it('deve permitir acesso irrestrito para admin_geral', async () => {
            const result = await stationService.validateStationAccess({ role: 'admin_geral' }, 1);
            expect(result).toBe(true);
        });

        it('deve rejeitar cliente comum com 403', async () => {
            await expect(stationService.validateStationAccess({ role: 'cliente' }, 1))
                .rejects.toThrow(/Acesso negado para o seu perfil/i);
        });

        it('deve permitir posto_admin vinculado ao posto', async () => {
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: { user_id: 'usr-1', posto_id: 1 },
                                error: null
                            })
                        })
                    })
                })
            });

            const result = await stationService.validateStationAccess({ id: 'usr-1', role: 'posto_admin' }, 1);
            expect(result).toBe(true);
        });

        it('deve rejeitar posto_admin não vinculado com 403', async () => {
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'Row not found' }
                            })
                        })
                    })
                })
            });

            await expect(stationService.validateStationAccess({ id: 'usr-2', role: 'posto_admin' }, 1))
                .rejects.toThrow(/não administra este posto/i);
        });
    });

    describe('createStationFuel', () => {
        it('deve rejeitar se preco_litro for negativo ou zero', async () => {
            await expect(
                stationService.createStationFuel(1, { combustivel_id: 1, preco_litro: -5 }, { role: 'admin_geral' })
            ).rejects.toThrow(/preco_litro.*maior que zero/i);
        });
    });

    describe('assignStationAdmin', () => {
        it('deve rejeitar se solicitante não for admin_geral', async () => {
            await expect(
                stationService.assignStationAdmin(1, 'usr-123', { role: 'posto_admin' })
            ).rejects.toThrow(/Apenas o Administrador Geral/i);
        });

        it('deve rejeitar se user_id estiver vazio', async () => {
            await expect(
                stationService.assignStationAdmin(1, '', { role: 'admin_geral' })
            ).rejects.toThrow(/identificador do usuário.*obrigatório/i);
        });

        it('deve vincular administrador com sucesso', async () => {
            const mockRecord = { id: 'link-1', user_id: 'usr-123', posto_id: 1 };
            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                        data: [mockRecord],
                        error: null
                    })
                })
            });

            const result = await stationService.assignStationAdmin(1, 'usr-123', { role: 'admin_geral' });
            expect(result).toEqual(mockRecord);
        });
    });

    describe('getMyStation', () => {
        it('deve lançar erro 401 se usuário não for fornecido', async () => {
            await expect(stationService.getMyStation(null)).rejects.toThrow(/Não autenticado/i);
        });

        it('deve lançar erro 403 se usuário for cliente', async () => {
            await expect(stationService.getMyStation({ id: 'cli-1', role: 'cliente' })).rejects.toThrow(/Acesso restrito/i);
        });

        it('deve lançar erro 404 se posto_admin não tiver vínculo', async () => {
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: [], error: null })
                })
            });

            await expect(stationService.getMyStation({ id: 'usr-sem-posto', role: 'posto_admin' })).rejects.toThrow(
                /Nenhum posto de abastecimento vinculado ao seu perfil/i
            );
        });

        it('deve retornar posto vinculado e stats para posto_admin', async () => {
            // 1. Link
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: [{ user_id: 'usr-1', posto_id: 10 }], error: null })
                })
            });

            // 2. Posto
            const mockStation = { id: 10, nome_fantasia: 'Posto Estrela', cnpj: '11222333000181' };
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockStation, error: null })
                    })
                })
            });

            const result = await stationService.getMyStation({ id: 'usr-1', role: 'posto_admin' });
            expect(result.id).toBe(10);
            expect(result.nome_fantasia).toBe('Posto Estrela');
            expect(result).toHaveProperty('stats');
        });
    });
});
