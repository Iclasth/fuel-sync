const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');
const { calculateBreakdownTimes } = require('./etaCalculator');
const { generateCognitivePrediction } = require('./groqClient');
const { generateFallbackPrediction } = require('./fallbackGenerator');

async function predictEtaForOrder({
    orderId = null,
    deliveryId = null,
    station,
    destination,
    pendingDeliveries = 0,
    customerName = 'Cliente',
    setbackDescription = null
}) {
    let resolvedStation = station;
    let resolvedDestination = destination;
    let dbOrder = null;
    let queueCount = Number(pendingDeliveries) || 0;

    // Resolução canônica pelo banco de dados quando orderId for fornecido
    if (orderId) {
        try {
            const { data } = await supabase
                .from('pedidos')
                .select('id, cliente_id, posto_id, status, destino_latitude, destino_longitude, tipo_local, ponto_referencia, horario_previsto_entrega, tempo_estimado_entrega_minutos, created_at, posto:postos (id, nome_fantasia, razao_social, latitude, longitude, tempo_medio_preparo_minutos)')
                .eq('id', Number(orderId))
                .maybeSingle();

            dbOrder = data;

            if (dbOrder) {
                if (dbOrder.posto && typeof dbOrder.posto.latitude === 'number' && typeof dbOrder.posto.longitude === 'number') {
                    resolvedStation = {
                        ...(station || {}),
                        id: dbOrder.posto.id,
                        nome: dbOrder.posto.nome_fantasia || dbOrder.posto.razao_social || station?.nome,
                        latitude: Number(dbOrder.posto.latitude),
                        longitude: Number(dbOrder.posto.longitude),
                        tempo_medio_preparo: dbOrder.posto.tempo_medio_preparo_minutos || station?.tempo_medio_preparo || 15
                    };
                }
                if (typeof dbOrder.destino_latitude === 'number' && typeof dbOrder.destino_longitude === 'number') {
                    resolvedDestination = {
                        ...(destination || {}),
                        latitude: Number(dbOrder.destino_latitude),
                        longitude: Number(dbOrder.destino_longitude),
                        tipo_local: dbOrder.tipo_local || destination?.tipo_local || 'MARINA',
                        ponto_referencia: dbOrder.ponto_referencia || destination?.ponto_referencia || ''
                    };
                }

                // Fallback de localização do posto via busca direta por posto_id caso o join não tenha retornado coordenadas
                const targetPostoId = dbOrder.posto_id || resolvedStation?.id;
                if ((!resolvedStation || typeof resolvedStation.latitude !== 'number') && targetPostoId) {
                    try {
                        const { data: stationRow } = await supabase
                            .from('postos')
                            .select('id, nome_fantasia, latitude, longitude, tempo_medio_preparo_minutos')
                            .eq('id', Number(targetPostoId))
                            .maybeSingle();

                        if (stationRow && typeof stationRow.latitude === 'number' && typeof stationRow.longitude === 'number') {
                            resolvedStation = {
                                ...(resolvedStation || {}),
                                id: stationRow.id,
                                nome: stationRow.nome_fantasia || resolvedStation?.nome || 'Posto Vinculado',
                                latitude: Number(stationRow.latitude),
                                longitude: Number(stationRow.longitude),
                                tempo_medio_preparo: stationRow.tempo_medio_preparo_minutos || resolvedStation?.tempo_medio_preparo || 15
                            };
                        }
                    } catch (stationLookupErr) {
                        console.warn('Aviso: Falha ao consultar posto diretamente:', stationLookupErr.message);
                    }
                }

                // Fallback de localização do destino via busca no cliente caso não haja coordenadas no pedido
                if ((!resolvedDestination || typeof resolvedDestination.latitude !== 'number') && dbOrder.cliente_id) {
                    try {
                        const { data: clientRow } = await supabase
                            .from('clientes')
                            .select('id, latitude, longitude, endereco_padrao, ponto_referencia_padrao')
                            .eq('id', Number(dbOrder.cliente_id))
                            .maybeSingle();

                        if (clientRow && typeof clientRow.latitude === 'number' && typeof clientRow.longitude === 'number') {
                            resolvedDestination = {
                                ...(resolvedDestination || {}),
                                latitude: Number(clientRow.latitude),
                                longitude: Number(clientRow.longitude),
                                tipo_local: dbOrder.tipo_local || resolvedDestination?.tipo_local || 'MARINA',
                                ponto_referencia: dbOrder.ponto_referencia || clientRow.ponto_referencia_padrao || resolvedDestination?.ponto_referencia || ''
                            };
                        }
                    } catch (clientLookupErr) {
                        console.warn('Aviso: Falha ao consultar destino diretamente no cliente:', clientLookupErr.message);
                    }
                }

                // Consulta de fila estritamente vinculada a este posto (posto_id)
                if (dbOrder.posto_id) {
                    try {
                        if (dbOrder.status === 'PENDENTE') {
                            let query = supabase
                                .from('pedidos')
                                .select('id', { count: 'exact', head: true })
                                .eq('posto_id', dbOrder.posto_id)
                                .eq('status', 'PENDENTE');

                            if (typeof query.neq === 'function') {
                                query = query.neq('id', dbOrder.id);
                            }
                            if (dbOrder.created_at && typeof query.lte === 'function') {
                                query = query.lte('created_at', dbOrder.created_at);
                            }
                            const res = await query;
                            if (typeof res?.count === 'number') {
                                queueCount = res.count;
                            }
                        } else if (dbOrder.status === 'CONFIRMADO_POSTO') {
                            let query = supabase
                                .from('pedidos')
                                .select('id', { count: 'exact', head: true })
                                .eq('posto_id', dbOrder.posto_id);

                            if (typeof query.in === 'function') {
                                query = query.in('status', ['CONFIRMADO_POSTO', 'EM_PREPARACAO']);
                            } else {
                                query = query.eq('status', 'CONFIRMADO_POSTO');
                            }
                            if (typeof query.neq === 'function') {
                                query = query.neq('id', dbOrder.id);
                            }
                            const res = await query;
                            if (typeof res?.count === 'number') {
                                queueCount = res.count;
                            }
                        }
                    } catch (queueErr) {
                        console.warn('Aviso: Falha ao consultar fila operacional do posto:', queueErr.message);
                    }
                }
            }
        } catch (dbErr) {
            console.warn('Aviso: Não foi possível resolver dados canônicos do pedido/posto:', dbErr.message);
        }
    }

    if (!resolvedStation || typeof resolvedStation.latitude !== 'number' || typeof resolvedStation.longitude !== 'number') {
        throw new AppError('Dados de localização do posto são obrigatórios.', 400);
    }
    if (!resolvedDestination || typeof resolvedDestination.latitude !== 'number' || typeof resolvedDestination.longitude !== 'number') {
        throw new AppError('Dados de localização de destino são obrigatórios.', 400);
    }

    // 1. Pilar 1: Cálculo Matemático Preciso (Node.js com tortuosidade viária/náutica)
    const metrics = calculateBreakdownTimes({
        originLat: resolvedStation.latitude,
        originLon: resolvedStation.longitude,
        destLat: resolvedDestination.latitude,
        destLon: resolvedDestination.longitude,
        prepTimeStation: resolvedStation.tempo_medio_preparo || resolvedStation.tempo_medio_preparo_minutos,
        pendingDeliveries,
        queueOrdersCount: queueCount,
        locationType: resolvedDestination.tipo_local,
        orderStatus: dbOrder?.status || null,
        baselineEta: dbOrder?.horario_previsto_entrega || null
    });

    // 2. Persistência do Baseline Inicial de Entrega no Pedido quando em CONFIRMADO_POSTO
    if (dbOrder && dbOrder.status === 'CONFIRMADO_POSTO' && !dbOrder.horario_previsto_entrega) {
        try {
            await supabase
                .from('pedidos')
                .update({
                    horario_previsto_entrega: metrics.horario_previsto_chegada,
                    tempo_estimado_entrega_minutos: metrics.total_minutos
                })
                .eq('id', dbOrder.id);
            dbOrder.horario_previsto_entrega = metrics.horario_previsto_chegada;
            dbOrder.tempo_estimado_entrega_minutos = metrics.total_minutos;
        } catch (baselineErr) {
            console.warn('Aviso: Não foi possível gravar baseline no pedido:', baselineErr.message);
        }
    }

    // 3. Pilar 2: Tenta obter avaliação cognitiva via Groq LPU (com fallback determinístico)
    let cognitiveResult = null;
    try {
        cognitiveResult = await generateCognitivePrediction({
            customerName,
            locationType: resolvedDestination.tipo_local,
            referencePoint: resolvedDestination.ponto_referencia,
            metrics,
            setbackDescription,
            orderStatus: dbOrder?.status || null,
            stationName: dbOrder?.posto?.nome || resolvedStation?.nome || 'Posto Vinculado',
            queueCount,
            baselineEta: dbOrder?.horario_previsto_entrega || metrics.horario_previsto_chegada
        });
    } catch (err) {
        console.warn('Groq indisponível ou timeout. Ativando Fallback Determinístico:', err.message);
        cognitiveResult = generateFallbackPrediction(metrics, setbackDescription, dbOrder?.status || null);
    }

    if (!cognitiveResult) {
        cognitiveResult = generateFallbackPrediction(metrics, setbackDescription, dbOrder?.status || null);
    }

    // Guardrail de sanidade: penalizar confiança e forçar risco de atraso em anomalias de distância (> 100 km)
    if (metrics.anomalia_distancia) {
        cognitiveResult.confianca = Math.min(Number(cognitiveResult.confianca) || 20, 25);
        cognitiveResult.risco_atraso = true;
        if (!cognitiveResult.motivo_risco || !cognitiveResult.motivo_risco.includes('100 km')) {
            cognitiveResult.motivo_risco = `Distância geográfica excessiva entre base e entrega (${metrics.distanceKm} km > 100 km)`;
        }
    }

    // Se houver pedido mas não foi passado entregaId, tenta resolver entrega ativa
    let resolvedDeliveryId = deliveryId ? Number(deliveryId) : null;
    if (!resolvedDeliveryId && orderId) {
        try {
            const { data: deliveryRows } = await supabase
                .from('entregas')
                .select('id')
                .eq('pedido_id', Number(orderId))
                .order('id', { ascending: false })
                .limit(1);

            if (deliveryRows && deliveryRows.length > 0) {
                resolvedDeliveryId = deliveryRows[0].id;
            }
        } catch (_) {}
    }

    // 4. Persistência na tabela canônica 'previsoes_ia' do Supabase / PostgreSQL
    const rawConfidence = Number(cognitiveResult.confianca);
    const normalizedScore = Number.isFinite(rawConfidence)
        ? Math.min(Math.max(rawConfidence > 1 ? rawConfidence / 100 : rawConfidence, 0), 1)
        : 0.90;

    const predictionPayload = {
        pedido_id: orderId ? Number(orderId) : null,
        entrega_id: resolvedDeliveryId,
        eta_previsto: metrics.horario_previsto_chegada,
        tempo_espera_liberacao_minutos: metrics.tempo_espera,
        tempo_preparo_posto_minutos: metrics.tempo_preparo,
        tempo_viagem_cliente_minutos: metrics.tempo_viagem,
        confianca_score: parseFloat(normalizedScore.toFixed(4)),
        risco_atraso: Boolean(cognitiveResult.risco_atraso),
        fator_principal_risco: cognitiveResult.motivo_risco
            ? String(cognitiveResult.motivo_risco).substring(0, 255)
            : null,
        mensagem_humanizada: cognitiveResult.mensagem || 'Previsão de entrega calculada.',
        criado_em: new Date().toISOString()
    };

    let saved = predictionPayload;
    try {
        const { data, error } = await supabase
            .from('previsoes_ia')
            .insert(predictionPayload)
            .select()
            .single();

        if (error) {
            console.warn('Aviso: Falha ao persistir em previsoes_ia (Migration 006 pendente no Supabase?):', error.message);
            // Se falhou por causa de pedido_id inexistente (PGRST204) e há entrega_id, tenta formato legado
            if (error.code === 'PGRST204' && resolvedDeliveryId) {
                try {
                    const legacyPayload = { ...predictionPayload };
                    delete legacyPayload.pedido_id;
                    const { data: legacyData } = await supabase
                        .from('previsoes_ia')
                        .insert(legacyPayload)
                        .select()
                        .single();
                    if (legacyData) saved = legacyData;
                } catch (_) {}
            }
        } else if (data) {
            saved = data;
        }
    } catch (dbErr) {
        console.warn('Aviso: Exceção ao gravar em previsoes_ia:', dbErr.message);
    }

    return {
        ...saved,
        // Aliases amigáveis para consumo unificado no front-end
        horario_previsto_chegada: saved.eta_previsto,
        tempo_espera: saved.tempo_espera_liberacao_minutos,
        tempo_preparo: saved.tempo_preparo_posto_minutos,
        tempo_viagem: saved.tempo_viagem_cliente_minutos,
        confianca: Math.round(Number(saved.confianca_score) * 100),
        motivo_risco: saved.fator_principal_risco,
        mensagem: saved.mensagem_humanizada,
        distancia_km: metrics.distanceKm,
        distancia_linear_km: metrics.distancia_linear_km,
        total_minutos: metrics.total_minutos,
        tempo_formatado: metrics.tempo_formatado,
        anomalia_distancia: metrics.anomalia_distancia,
        tipo_fase: metrics.tipo_fase,
        fila_pedidos: metrics.fila_pedidos,
        horario_baseline: dbOrder?.horario_previsto_entrega || metrics.horario_previsto_chegada,
        delta_atraso_minutos: metrics.delta_atraso_minutos,
        tem_atraso_baseline: metrics.tem_atraso_baseline
    };
}

module.exports = { predictEtaForOrder };