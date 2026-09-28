const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');
const { calculateBreakdownTimes } = require('./etaCalculator');
const { generateCognitivePrediction } = require('./geminiClient');
const { generateFallbackPrediction } = require('./fallbackGenerator');

async function predictEtaForOrder({
    orderId,
    station,
    destination,
    pendingDeliveries = 0,
    customerName = 'Cliente',
    setbackDescription = null
}) {
    // 1. Pilar 1: Cálculo Matemático Preciso (Node.js)
    const metrics = calculateBreakdownTimes({
        originLat: station.latitude,
        originLon: station.longitude,
        destLat: destination.latitude,
        destLon: destination.longitude,
        prepTimeStation: station.tempo_medio_preparo,
        pendingDeliveries,
        locationType: destination.tipo_local
    });

    // 2. Pilar 2: Tenta obter avaliação cognitiva via Gemini
    let cognitiveResult = null;
    try {
        cognitiveResult = await generateCognitivePrediction({
            customerName,
            locationType: destination.tipo_local,
            referencePoint: destination.ponto_referencia,
            metrics,
            setbackDescription
        });
    } catch (err) {
        console.warn('⚠️ Gemini indisponível ou timeout. Ativando Fallback Determinístico:', err.message);
        cognitiveResult = generateFallbackPrediction(metrics, setbackDescription);
    }

    // 3. Persistência na tabela 'previsoes_ia' do Supabase
    const predictionPayload = {
        pedido_id: orderId,
        horario_previsto_chegada: metrics.horario_previsto_chegada,
        tempo_espera: metrics.tempo_espera,
        tempo_preparo: metrics.tempo_preparo,
        tempo_viagem: metrics.tempo_viagem,
        confianca: cognitiveResult.confianca,
        risco_atraso: cognitiveResult.risco_atraso,
        motivo_risco: cognitiveResult.motivo_risco,
        mensagem: cognitiveResult.mensagem,
        criado_em: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('previsoes_ia')
        .insert(predictionPayload)
        .select()
        .single();

    if (error) {
        console.error('Erro ao salvar no Supabase:', error);
        throw new AppError('Erro ao gravar previsão no banco de dados', 500);
    }

    return data;
}

module.exports = { predictEtaForOrder };