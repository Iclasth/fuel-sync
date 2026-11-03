const {
    generateCognitivePrediction,
    DEFAULT_MODEL,
    FALLBACK_MODEL,
    GROQ_API_URL,
    DEFAULT_TIMEOUT_MS
} = require('../../src/modules/ai/groqClient');

describe('Unit: AI Module - Groq Client', () => {
    const originalEnv = process.env;

    const mockContext = {
        customerName: 'Roberto Marinho',
        locationType: 'MARINA',
        referencePoint: 'Píer 3, Vaga 12',
        metrics: {
            distanceKm: 4.8,
            tempo_preparo: 15,
            tempo_espera: 12,
            tempo_viagem: 14,
            total_minutos: 41,
            tempo_formatado: '41 min'
        },
        setbackDescription: null
    };

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.GROQ_API_KEY;
        delete process.env.GROQ_MODEL;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('deve lançar erro caso GROQ_API_KEY não esteja configurada no ambiente', async () => {
        await expect(generateCognitivePrediction(mockContext)).rejects.toThrow(
            'GROQ_API_KEY não configurada no ambiente.'
        );
    });

    it('deve chamar a API do Groq com DEFAULT_MODEL e response_format corretos quando GROQ_MODEL não for informado', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_valid_key';

        const mockGroqResponse = {
            id: 'chatcmpl-test-123',
            choices: [
                {
                    message: {
                        role: 'assistant',
                        content: JSON.stringify({
                            confianca: 96,
                            risco_atraso: false,
                            motivo_risco: null,
                            mensagem: 'Olá, Roberto! Sua embarcação receberá o combustível com precisão no Píer 3.'
                        })
                    }
                }
            ]
        };

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(mockGroqResponse)
        });
        global.fetch = mockFetch;

        const result = await generateCognitivePrediction(mockContext);

        expect(mockFetch).toHaveBeenCalledWith(
            GROQ_API_URL,
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer gsk_mock_valid_key',
                    'Content-Type': 'application/json'
                }
            })
        );

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.model).toBe('openai/gpt-oss-120b');
        expect(requestBody.response_format).toEqual({ type: 'json_object' });
        expect(requestBody.max_tokens).toBe(900);
        expect(requestBody.messages[1].content).toContain('Roberto Marinho');

        expect(result.confianca).toBe(96);
        expect(result.risco_atraso).toBe(false);
        expect(result.motivo_risco).toBeNull();
        expect(result.mensagem).toContain('Píer 3');
    });

    it('deve realizar fallback para FALLBACK_MODEL se o modelo retornar erro 404 (model_not_found)', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_valid_key';
        process.env.GROQ_MODEL = 'llama-3.3-70b-versatile';

        const mock404Response = {
            ok: false,
            status: 404,
            text: jest.fn().mockResolvedValue('{"error":{"message":"The model does not exist","code":"model_not_found"}}')
        };

        const mockFallbackSuccessResponse = {
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            confianca: 88,
                            risco_atraso: false,
                            motivo_risco: null,
                            mensagem: 'Previsão gerada pelo modelo fallback.'
                        })
                    }
                }]
            })
        };

        const mockFetch = jest.fn()
            .mockResolvedValueOnce(mock404Response)
            .mockResolvedValueOnce(mockFallbackSuccessResponse);
        global.fetch = mockFetch;

        const result = await generateCognitivePrediction(mockContext);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
        expect(secondCallBody.model).toBe(FALLBACK_MODEL);
        expect(result.confianca).toBe(88);
        expect(result.mensagem).toBe('Previsão gerada pelo modelo fallback.');
    });

    it('deve exportar DEFAULT_MODEL e FALLBACK_MODEL atualizados', () => {
        expect(DEFAULT_MODEL).toBe('openai/gpt-oss-120b');
        expect(FALLBACK_MODEL).toBe('openai/gpt-oss-20b');
    });

    it('deve exportar DEFAULT_TIMEOUT_MS calibrado em 7000ms', () => {
        expect(DEFAULT_TIMEOUT_MS).toBe(7000);
    });

    it('deve incluir max_tokens: 900 no payload enviado para o Groq', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_valid_key';

        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({
                choices: [{
                    message: {
                        role: 'assistant',
                        content: JSON.stringify({ confianca: 95, mensagem: 'OK' })
                    }
                }]
            })
        });
        global.fetch = mockFetch;

        await generateCognitivePrediction(mockContext);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(payload.max_tokens).toBe(900);
    });

    it('deve lançar erro de timeout com DEFAULT_TIMEOUT_MS (7000ms) quando AbortError ocorrer', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_valid_key';
        delete process.env.GROQ_TIMEOUT_MS;

        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        global.fetch = jest.fn().mockRejectedValue(abortError);

        await expect(generateCognitivePrediction(mockContext)).rejects.toThrow(
            'Groq API Timeout após 7000ms'
        );
    });

    it('deve respeitar a variável de ambiente GROQ_TIMEOUT_MS para o timeout da requisição', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_valid_key';
        process.env.GROQ_TIMEOUT_MS = '4500';

        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        global.fetch = jest.fn().mockRejectedValue(abortError);

        await expect(generateCognitivePrediction(mockContext)).rejects.toThrow(
            'Groq API Timeout após 4500ms'
        );
    });

    it('não deve tentar fallback se o modelo que falhou já for o próprio FALLBACK_MODEL', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_valid_key';
        process.env.GROQ_MODEL = FALLBACK_MODEL;

        const mock404Response = {
            ok: false,
            status: 404,
            text: jest.fn().mockResolvedValue('{"error":{"message":"The model does not exist","code":"model_not_found"}}')
        };

        const mockFetch = jest.fn().mockResolvedValue(mock404Response);
        global.fetch = mockFetch;

        await expect(generateCognitivePrediction(mockContext)).rejects.toThrow('Groq API error (404)');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('não deve realizar retries em cascata se a tentativa com o modelo fallback também falhar', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_valid_key';
        process.env.GROQ_MODEL = 'llama-3.3-70b-versatile';

        const mock404Primary = {
            ok: false,
            status: 404,
            text: jest.fn().mockResolvedValue('{"error":{"message":"Primary model not found","code":"model_not_found"}}')
        };
        const mock500Fallback = {
            ok: false,
            status: 500,
            text: jest.fn().mockResolvedValue('Internal Groq Server Error')
        };

        const mockFetch = jest.fn()
            .mockResolvedValueOnce(mock404Primary)
            .mockResolvedValueOnce(mock500Fallback);
        global.fetch = mockFetch;

        await expect(generateCognitivePrediction(mockContext)).rejects.toThrow('Groq API error (500)');
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('deve respeitar a variável de ambiente GROQ_FALLBACK_MODEL caso definida', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_valid_key';
        process.env.GROQ_MODEL = 'custom/primary-model';
        process.env.GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

        const mock404Response = {
            ok: false,
            status: 404,
            text: jest.fn().mockResolvedValue('{"error":{"message":"Model not found"}}')
        };
        const mockFallbackSuccess = {
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            confianca: 90,
                            risco_atraso: false,
                            motivo_risco: null,
                            mensagem: 'OK'
                        })
                    }
                }]
            })
        };

        const mockFetch = jest.fn()
            .mockResolvedValueOnce(mock404Response)
            .mockResolvedValueOnce(mockFallbackSuccess);
        global.fetch = mockFetch;

        await generateCognitivePrediction(mockContext);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
        expect(secondCallBody.model).toBe('llama-3.3-70b-versatile');
    });

    it('deve tratar erro HTTP retornado pela API do Groq', async () => {
        process.env.GROQ_API_KEY = 'gsk_mock_invalid_key';

        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
            text: jest.fn().mockResolvedValue('Invalid API Key')
        });

        await expect(generateCognitivePrediction(mockContext)).rejects.toThrow(
            'Groq API error (401): Invalid API Key'
        );
    });

    describe('Mesclagem Defensiva de Campos Enriquecidos', () => {
        it('deve preencher defensivamente janela_entrega, fatores_tempo e recomendacoes_seguranca se a IA omiti-los', async () => {
            process.env.GROQ_API_KEY = 'gsk_mock_valid_key';

            // Groq retorna apenas os 4 campos clássicos
            const mockGroqResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            confianca: 92,
                            risco_atraso: false,
                            motivo_risco: null,
                            mensagem: 'Previsão de entrega confirmada.'
                        })
                    }
                }]
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockGroqResponse)
            });

            const result = await generateCognitivePrediction(mockContext);

            expect(result.confianca).toBe(92);
            expect(result).toHaveProperty('janela_entrega');
            expect(result.janela_entrega).toHaveProperty('formato_amigavel');
            expect(result).toHaveProperty('fatores_tempo');
            expect(result.fatores_tempo.total_minutos).toBe(41);
            expect(result).toHaveProperty('recomendacoes_seguranca');
            expect(Array.isArray(result.recomendacoes_seguranca)).toBe(true);
            expect(result).toHaveProperty('condicoes_operacionais');
        });

        it('deve preservar campos enriquecidos válidos retornados diretamente pelo Groq', async () => {
            process.env.GROQ_API_KEY = 'gsk_mock_valid_key';

            const customWindow = {
                inicio: '2026-10-10T14:20:00.000Z',
                fim: '2026-10-10T14:45:00.000Z',
                formato_amigavel: '14:20 - 14:45'
            };

            const mockGroqResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            confianca: 95,
                            risco_atraso: false,
                            motivo_risco: null,
                            mensagem: 'Entrega rápida e segura.',
                            janela_entrega: customWindow,
                            recomendacoes_seguranca: ['Recomendação customizada da IA']
                        })
                    }
                }]
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockGroqResponse)
            });

            const result = await generateCognitivePrediction(mockContext);

            expect(result.janela_entrega).toEqual(customWindow);
            expect(result.recomendacoes_seguranca).toContain('Recomendação customizada da IA');
        });
    });

});
