/**
 * Cliente HTTP para a API do Groq (Hardware LPU / Inundação de Tokens).
 * Utiliza fetch nativo do Node.js (v20+) com timeout via AbortSignal,
 * eliminando dependências pesadas e prevenindo falhas de volume no Docker.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const DEFAULT_TIMEOUT_MS = 2500;

async function executeGroqChat(payload, apiKey, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        if (!response.ok) {
            const errBody = await response.text();
            const error = new Error(`Groq API error (${response.status}): ${errBody}`);
            error.status = response.status;
            error.body = errBody;
            throw error;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Resposta vazia da API do Groq.');
        }

        const parsed = JSON.parse(content);

        return {
            confianca: Number(parsed.confianca ?? 90),
            risco_atraso: Boolean(parsed.risco_atraso),
            motivo_risco: parsed.motivo_risco || null,
            mensagem: parsed.mensagem || 'Previsão de entrega calculada.'
        };
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error(`Groq API Timeout após ${timeoutMs}ms`);
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function generateCognitivePrediction(contextData) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY não configurada no ambiente.');
    }

    const timeoutMs = parseInt(process.env.GROQ_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS), 10);
    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

    const systemPrompt = `
    Atue como o motor de estimativas logísticas da plataforma NAVROTAS (logística náutica e rodoviária de combustível).
    Analise os dados estruturados e o estado operacional do pedido para gerar uma resposta estritamente em formato JSON válido contendo:
    - confianca: inteiro de 0 a 100 indicando o score de precisão da estimativa.
      REGRA CRÍTICA DE SANIDADE GEOGRÁFICA: Distâncias operacionais acima de 100 km são anomalias severas para abastecimento local. Se a distância estimada for superior a 100 km, o score de confiança NÃO deve ultrapassar 25%, risco_atraso DEVE ser true, e motivo_risco DEVE indicar inconsistência de raio geográfico.
    - risco_atraso: booleano (true caso haja contratempos, atraso vs. baseline acordado, fila crítica ou anomalia de distância, false caso normal)
    - motivo_risco: texto explicativo resumido do risco (ou null caso não haja risco)
    - mensagem: texto humanizado e profissional em português brasileiro para o app do cliente, expressando durações de forma legível (ex: 25 min, 1h 15min) e contextualizado estritamente para o estado atual:
      * Se status for PENDENTE: a mensagem deve focar na ESTIMATIVA DE ACEITE / CONFIRMAÇÃO DO PEDIDO PELO POSTO, informando a quantidade de pedidos que também estão pendentes de análise na base.
      * Se status for CONFIRMADO_POSTO: a mensagem deve anunciar a confirmação e apresentar a ESTIMATIVA DE ENTREGA (baseline oficial), considerando a fila de preparação do posto e a rota.
      * Se status for EM_PREPARACAO: a mensagem deve relatar o abastecimento/bombeamento no posto e comparar a projeção com o baseline inicial, apontando eventuais atrasos se houver.
      * Se status for EM_TRANSPORTE: a mensagem deve relatar o deslocamento com o entregador e prever a chegada, comparando com o baseline inicial.
      NÃO utilize emojis. Mantenha tom técnico, seguro e transparente.
    `;

    const userPrompt = `
    DADOS DA OPERAÇÃO:
    - Status do Pedido: ${contextData.orderStatus || 'NÃO ESPECIFICADO'}
    - Tipo de Estimativa: ${contextData.metrics.tipo_fase || 'ENTREGA'}
    - Posto de Abastecimento: ${contextData.stationName || 'Posto Vinculado'}
    - Fila de Pedidos no Posto: ${contextData.queueCount ?? contextData.metrics.fila_pedidos ?? 0} pedidos
    - Cliente: ${contextData.customerName || 'Cliente'}
    - Local de Entrega: ${contextData.locationType || 'Local'} (${contextData.referencePoint || 'Sem ponto de referência'})
    - Distância Estimada: ${contextData.metrics.distanceKm || 0} km
    - Distância Linear: ${contextData.metrics.distancia_linear_km || 0} km
    - Anomalia Geográfica (> 100 km): ${contextData.metrics.anomalia_distancia ? 'SIM (Distância excessiva para base local)' : 'NÃO (Raio operacional normal)'}
    - Tempo de Espera / Fila no Posto: ${contextData.metrics.tempo_espera || 0} min
    - Tempo de Preparo no Posto: ${contextData.metrics.tempo_preparo || 0} min
    - Tempo de Viagem/Deslocamento: ${contextData.metrics.tempo_viagem || 0} min
    - Estimativa Total: ${contextData.metrics.tempo_formatado || `${contextData.metrics.total_minutos} min`}
    - Horário Baseline Inicial Acordado: ${contextData.baselineEta || 'Ainda não estabelecido'}
    - Variação vs. Baseline: ${contextData.metrics.delta_atraso_minutos ? `${contextData.metrics.delta_atraso_minutos} min de atraso` : 'Dentro do cronograma'}
    - Contratempo/Ocorrência na Rota: ${contextData.setbackDescription || 'Nenhum'}
    `;

    const payload = {
        model,
        messages: [
            { role: 'system', content: systemPrompt.trim() },
            { role: 'user', content: userPrompt.trim() }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
    };

    try {
        return await executeGroqChat(payload, apiKey, timeoutMs);
    } catch (err) {
        // Se o modelo especificado não existir na conta/região (404), tenta com FALLBACK_MODEL
        if (err.status === 404 && model !== FALLBACK_MODEL) {
            console.warn(`Modelo '${model}' não disponível no Groq (404). Tentando fallback com '${FALLBACK_MODEL}'...`);
            const fallbackPayload = { ...payload, model: FALLBACK_MODEL };
            return await executeGroqChat(fallbackPayload, apiKey, timeoutMs);
        }
        throw err;
    }
}

module.exports = {
    generateCognitivePrediction,
    DEFAULT_MODEL,
    FALLBACK_MODEL,
    GROQ_API_URL
};
