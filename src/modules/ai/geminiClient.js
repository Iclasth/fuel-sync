const { GoogleGenAI, Type } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

async function generateCognitivePrediction(contextData) {
    if (!ai) {
        throw new Error('GEMINI_API_KEY não configurada.');
    }

    const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '3500', 10);

    const prompt = `
    Atue como o assistente logístico humanizado da plataforma FuelSync.
    Analise os dados abaixo e forneça a avaliação de risco e a mensagem de status para o cliente final.

    DADOS DA ENTREGA:
    - Cliente: ${contextData.customerName}
    - Local de Entrega: ${contextData.locationType} (${contextData.referencePoint || 'Sem ponto de referência'})
    - Distância: ${contextData.metrics.distanceKm} km
    - Tempo de Preparo no Posto: ${contextData.metrics.tempo_preparo} min
    - Tempo de Espera em Fila: ${contextData.metrics.tempo_espera} min
    - Tempo de Deslocamento: ${contextData.metrics.tempo_viagem} min
    - Estimativa Total: ${contextData.metrics.total_minutos} min
    - Contratempo/Ocorrência: ${contextData.setbackDescription || 'Nenhum'}
    `;

    // Schema rígido de resposta JSON
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            confianca: { type: Type.INTEGER, description: 'Score de confiança de 0 a 100' },
            risco_atraso: { type: Type.BOOLEAN, description: 'Se há risco de atraso' },
            motivo_risco: { type: Type.STRING, nullable: true, description: 'Motivo principal do risco' },
            mensagem: { type: Type.STRING, description: 'Mensagem empática e profissional para o cliente' }
        },
        required: ['confianca', 'risco_atraso', 'mensagem']
    };

    const callPromise = ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.2
        }
    });

    // Corrida com Timeout
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API Timeout')), timeoutMs)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    return JSON.parse(response.text);
}

module.exports = { generateCognitivePrediction };