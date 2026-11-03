/**
 * Cliente HTTP para a API do Groq (Hardware LPU / Inundação de Tokens).
 * Utiliza fetch nativo do Node.js (v20+) com timeout via AbortSignal,
 * eliminando dependências pesadas e prevenindo falhas de volume no Docker.
 */

const {
    calculateDeliveryWindow,
    getSafetyGuidelines
} = require('./etaCalculator');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';
const DEFAULT_TIMEOUT_MS = 7000;

function mergeWithDefensiveFallbacks(parsed, contextData = {}) {
    const metrics = contextData.metrics || {};
    const orderStatus = contextData.orderStatus;
    const locationType = contextData.locationType || 'MARINA';
    const liters = contextData.liters || 0;
    const setbackDescription = contextData.setbackDescription;

    const baseWindow = metrics.janela_entrega || calculateDeliveryWindow(
        metrics.horario_previsto_chegada,
        metrics.total_minutos,
        orderStatus
    );

    const baseSafety = (Array.isArray(metrics.recomendacoes_seguranca) && metrics.recomendacoes_seguranca.length > 0)
        ? metrics.recomendacoes_seguranca
        : getSafetyGuidelines(locationType, liters);

    const janelaEntrega = (parsed?.janela_entrega && parsed.janela_entrega.inicio && parsed.janela_entrega.fim && parsed.janela_entrega.formato_amigavel)
        ? parsed.janela_entrega
        : baseWindow;

    const fatoresTempo = {
        fila_minutos: Number(parsed?.fatores_tempo?.fila_minutos ?? metrics.tempo_espera ?? 0),
        preparo_minutos: Number(parsed?.fatores_tempo?.preparo_minutos ?? metrics.tempo_preparo ?? 0),
        transito_minutos: Number(parsed?.fatores_tempo?.transito_minutos ?? metrics.tempo_viagem ?? 0),
        total_minutos: Number(parsed?.fatores_tempo?.total_minutos ?? metrics.total_minutos ?? 0),
        explicacao: parsed?.fatores_tempo?.explicacao || `Fila no posto: ${Number(metrics.tempo_espera) || 0} min | Preparo da carga: ${Number(metrics.tempo_preparo) || 0} min | Deslocamento em rota: ${Number(metrics.tempo_viagem) || 0} min`
    };

    const recomendacoesSeguranca = (Array.isArray(parsed?.recomendacoes_seguranca) && parsed.recomendacoes_seguranca.length > 0)
        ? parsed.recomendacoes_seguranca
        : baseSafety;

    const condicoesOperacionais = {
        nivel_trafego: parsed?.condicoes_operacionais?.nivel_trafego || (setbackDescription
            ? 'CONGESTIONADO_OU_ADVERSO'
            : (metrics.tempo_viagem > 30 ? 'MODERADO' : 'FLUIDO')),
        complexidade_acesso: parsed?.condicoes_operacionais?.complexidade_acesso || (['MARINA', 'CHACARA', 'PONTÃO', 'PONTAO'].includes(String(locationType).toUpperCase())
            ? 'ALTA'
            : 'PADRAO'),
        notas: parsed?.condicoes_operacionais?.notas || setbackDescription || (metrics.anomalia_distancia
            ? 'Alerta de distância geográfica excessiva (> 100 km)'
            : 'Operação em conformidade com os parâmetros normais')
    };

    return {
        confianca: Number(parsed?.confianca ?? 90),
        risco_atraso: Boolean(parsed?.risco_atraso),
        motivo_risco: parsed?.motivo_risco || null,
        mensagem: parsed?.mensagem || 'Previsão de entrega calculada.',
        janela_entrega: janelaEntrega,
        fatores_tempo: fatoresTempo,
        recomendacoes_seguranca: recomendacoesSeguranca,
        condicoes_operacionais: condicoesOperacionais
    };
}

async function executeGroqChat(payload, apiKey, timeoutMs, contextData = {}) {
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

        return mergeWithDefensiveFallbacks(parsed, contextData);
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error(`Groq API Timeout após ${timeoutMs}ms`);
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

function sanitizePromptInput(input, maxLength = 200) {
    if (!input || typeof input !== 'string') return '';
    return input
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[\\`"'{}[\]]/g, '')
        .trim()
        .substring(0, maxLength);
}

async function generateCognitivePrediction(contextData) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY não configurada no ambiente.');
    }

    const timeoutMs = parseInt(process.env.GROQ_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS), 10);
    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    const fallbackModel = process.env.GROQ_FALLBACK_MODEL || FALLBACK_MODEL;

    const safeCustomer = sanitizePromptInput(contextData.customerName, 80) || 'Cliente';
    const safeStation = sanitizePromptInput(contextData.stationName, 80) || 'Posto Vinculado';
    const safeLocationType = sanitizePromptInput(contextData.locationType, 40) || 'Local';
    const safeReference = sanitizePromptInput(contextData.referencePoint, 150) || 'Sem ponto de referência';
    const safeSetback = sanitizePromptInput(contextData.setbackDescription, 300) || 'Nenhum';

    const systemPrompt = `
    Atue como o motor de estimativas logísticas da plataforma NAVROTAS (logística náutica e rodoviária de combustível).
    Analise os dados estruturados e o estado operacional do pedido para gerar uma resposta estritamente em formato JSON válido contendo:
    - confianca: inteiro de 0 a 100 indicando o score de precisão da estimativa.
      REGRA CRÍTICA DE SANIDADE GEOGRÁFICA: Distâncias operacionais acima de 100 km são anomalias severas para abastecimento local. Se a distância estimada for superior a 100 km, o score de confiança NÃO deve ultrapassar 25%, risco_atraso DEVE ser true, e motivo_risco DEVE indicar inconsistência de raio geográfico.
    - risco_atraso: booleano (true caso haja contratempos, atraso vs. baseline acordado, fila crítica ou anomalia de distância, false caso normal)
    - motivo_risco: texto explicativo resumido do risco (ou null caso não haja risco)
    - mensagem: texto humanizado e profissional em português brasileiro para o app do cliente, expressando durações de forma legível (ex: 25 min, 1h 15min) e contextualizado estritamente para o estado atual:
      * Se status for PENDENTE: estimativa de aceite e confirmação pelo posto com contagem da fila.
      * Se status for CONFIRMADO_POSTO: confirmação e apresentação da estimativa de entrega (baseline).
      * Se status for EM_PREPARACAO: abastecimento/bombeamento na base e comparação com baseline.
      * Se status for EM_TRANSPORTE: deslocamento com o entregador e previsão de chegada.
      NÃO utilize emojis. Mantenha tom técnico, seguro e transparente.
    - janela_entrega: objeto { inicio, fim, formato_amigavel } delimitando o intervalo de entrega.
    - fatores_tempo: objeto { fila_minutos, preparo_minutos, transito_minutos, total_minutos, explicacao }.
    - recomendacoes_seguranca: lista de recomendações técnicas baseadas na NR-20 e Normam-04/DPC para o local.
    - condicoes_operacionais: objeto { nivel_trafego, complexidade_acesso, notas }.
    `;

    const userPrompt = `
    DADOS DA OPERAÇÃO:
    - Status do Pedido: ${contextData.orderStatus || 'NÃO ESPECIFICADO'}
    - Tipo de Estimativa: ${contextData.metrics.tipo_fase || 'ENTREGA'}
    - Posto de Abastecimento: ${safeStation}
    - Fila de Pedidos no Posto: ${contextData.queueCount ?? contextData.metrics.fila_pedidos ?? 0} pedidos
    - Cliente: ${safeCustomer}
    - Local de Entrega: ${safeLocationType} (${safeReference})
    - Volume Solicitado: ${contextData.liters || 0} L
    - Fonte de Roteamento: ${contextData.metrics.fonte_roteamento || 'OSRM'}
    - Distância Estimada: ${contextData.metrics.distanceKm || 0} km
    - Distância Linear: ${contextData.metrics.distancia_linear_km || 0} km
    - Anomalia Geográfica (> 100 km): ${contextData.metrics.anomalia_distancia ? 'SIM (Distância excessiva para base local)' : 'NÃO (Raio operacional normal)'}
    - Tempo de Espera / Fila no Posto: ${contextData.metrics.tempo_espera || 0} min
    - Tempo de Preparo no Posto: ${contextData.metrics.tempo_preparo || 0} min
    - Tempo de Viagem/Deslocamento: ${contextData.metrics.tempo_viagem || 0} min
    - Estimativa Total: ${contextData.metrics.tempo_formatado || `${contextData.metrics.total_minutos} min`}
    - Horário Baseline Inicial Acordado: ${contextData.baselineEta || 'Ainda não estabelecido'}
    - Variação vs. Baseline: ${contextData.metrics.delta_atraso_minutos ? `${contextData.metrics.delta_atraso_minutos} min de atraso` : 'Dentro do cronograma'}
    - Contratempo/Ocorrência na Rota: ${safeSetback}
    `;

    const payload = {
        model,
        messages: [
            { role: 'system', content: systemPrompt.trim() },
            { role: 'user', content: userPrompt.trim() }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 900
    };

    try {
        return await executeGroqChat(payload, apiKey, timeoutMs, contextData);
    } catch (err) {
        // Se o modelo especificado não existir na conta/região (404), tenta com fallbackModel
        // Evita retries desnecessários se o modelo já for o próprio fallbackModel ou se fallback falhar
        if (err.status === 404 && fallbackModel && model !== fallbackModel) {
            console.warn(`Modelo '${model}' não disponível no Groq (404). Tentando fallback com '${fallbackModel}'...`);
            const fallbackPayload = { ...payload, model: fallbackModel };
            try {
                return await executeGroqChat(fallbackPayload, apiKey, timeoutMs, contextData);
            } catch (fallbackErr) {
                console.warn(`Falha no modelo fallback '${fallbackModel}':`, fallbackErr.message);
                throw fallbackErr;
            }
        }
        throw err;
    }
}

module.exports = {
    generateCognitivePrediction,
    mergeWithDefensiveFallbacks,
    DEFAULT_MODEL,
    FALLBACK_MODEL,
    GROQ_API_URL,
    DEFAULT_TIMEOUT_MS
};
