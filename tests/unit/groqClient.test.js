const { generateCognitivePrediction, DEFAULT_MODEL, FALLBACK_MODEL, GROQ_API_URL } = require('../../src/modules/ai/groqClient');

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
});
