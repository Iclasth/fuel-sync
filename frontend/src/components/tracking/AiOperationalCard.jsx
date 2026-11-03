import React from 'react';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Fuel,
  Truck,
  Activity,
  CheckCircle,
} from 'lucide-react';

export const AiOperationalCard = ({
  aiPrediction,
  status = 'PENDENTE',
  isLoading = false,
  formatEtaDisplay,
}) => {
  const isPendente = status === 'PENDENTE';
  const isConcluido = status === 'CONCLUIDO';
  const isCancelado = status === 'CANCELADO';

  // Fallback formatador caso não injetado
  const formatTime = (pred) => {
    if (typeof formatEtaDisplay === 'function') {
      return formatEtaDisplay(pred);
    }
    if (!pred) return '~35 a 50 minutos';
    const total = Number(pred.total_minutos);
    if (!isNaN(total) && total > 0) {
      const h = Math.floor(total / 60);
      const m = total % 60;
      if (h > 0 && m > 0) return `~${h}h ${m}min`;
      if (h > 0) return `~${h}h`;
      return `~${m} minutos`;
    }
    return pred.tempo_formatado ? `~${pred.tempo_formatado}` : '~35 a 50 minutos';
  };

  const filaMin = Number(
    aiPrediction?.fatores_tempo?.fila_minutos ?? (aiPrediction?.tempo_espera || 0)
  );
  const preparoMin = Number(
    aiPrediction?.fatores_tempo?.preparo_minutos ?? (aiPrediction?.tempo_preparo || 0)
  );
  const transitoMin = Number(
    aiPrediction?.fatores_tempo?.transito_minutos ?? (aiPrediction?.tempo_viagem || 0)
  );
  const totalMin = filaMin + preparoMin + transitoMin;

  const hasFatores = totalMin > 0;
  const pctFila = hasFatores ? Math.round((filaMin / totalMin) * 100) : 0;
  const pctPreparo = hasFatores ? Math.round((preparoMin / totalMin) * 100) : 0;
  const pctTransito = hasFatores ? Math.round((transitoMin / totalMin) * 100) : 0;

  const trafegoLabel =
    aiPrediction?.condicoes_operacionais?.nivel_trafego === 'CONGESTIONADO_OU_ADVERSO'
      ? 'Tráfego Adverso'
      : aiPrediction?.condicoes_operacionais?.nivel_trafego === 'MODERADO'
      ? 'Tráfego Moderado'
      : aiPrediction?.condicoes_operacionais?.nivel_trafego === 'FLUIDO'
      ? 'Tráfego Fluido'
      : null;

  const acessoLabel =
    aiPrediction?.condicoes_operacionais?.complexidade_acesso === 'ALTA'
      ? 'Acesso Complexo'
      : aiPrediction?.condicoes_operacionais?.complexidade_acesso === 'PADRAO'
      ? 'Acesso Padrão'
      : null;

  return (
    <div
      className="bg-white border border-blue-100 rounded-lg p-5 shadow-sm space-y-4"
      role="region"
      aria-label="Painel de IA e Estimativa Operacional"
    >
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>
                {isPendente ? 'ESTIMATIVA DE CONFIRMAÇÃO' : 'ESTIMATIVA DE ENTREGA'}
              </span>
            </h3>
            <span className="text-[11px] text-gray-500 block">
              Telemetria preditiva com inteligência cognitiva
            </span>
          </div>
        </div>

        {/* Badge de Fila de Análise ou Posto */}
        {aiPrediction?.fila_pedidos !== undefined && Number(aiPrediction.fila_pedidos) > 0 ? (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            {isPendente
              ? `${aiPrediction.fila_pedidos} na fila de análise`
              : `${aiPrediction.fila_pedidos} na fila da base`}
          </span>
        ) : aiPrediction?.confianca ? (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            Confiabilidade {aiPrediction.confianca}%
          </span>
        ) : null}
      </div>

      {/* Conteúdo Dinâmico / Loading / Dados */}
      {isLoading ? (
        <div className="flex items-center gap-2.5 text-xs text-blue-700 py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>
            Calculando telemetria e estimativa de {isPendente ? 'confirmação' : 'entrega'}...
          </span>
        </div>
      ) : aiPrediction ? (
        <div className="space-y-4">
          {/* Destaque da Janela ou Chegada Estimada */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">
                  {isPendente ? 'Confirmação prevista' : 'Janela Estimada'}
                </span>
                <p className="text-base sm:text-lg font-bold text-blue-950 mt-0.5">
                  {isPendente ? 'Confirmação estimada' : 'Chegada estimada'}: {formatTime(aiPrediction)}
                </p>
                {aiPrediction?.janela_entrega?.formato_amigavel && (
                  <p className="text-xs font-semibold text-blue-700 mt-0.5">
                    Janela Prevista: {aiPrediction.janela_entrega.formato_amigavel}
                  </p>
                )}
              </div>
              <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-1" aria-hidden="true" />
            </div>

            <p className="text-xs text-blue-900 mt-2 leading-relaxed">
              {aiPrediction.mensagem || aiPrediction.mensagem_humanizada}
            </p>
          </div>

          {/* Decomposição Visual dos Fatores de Tempo */}
          {hasFatores && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                Composição do Tempo Estimado
              </span>

              {/* Barra segmentada de proporção */}
              <div
                className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden flex"
                aria-label="Distribuição do tempo previsto"
              >
                {pctFila > 0 && (
                  <div
                    style={{ width: `${pctFila}%` }}
                    className="bg-amber-400 h-full"
                    title={`Fila: ${filaMin} min`}
                  />
                )}
                {pctPreparo > 0 && (
                  <div
                    style={{ width: `${pctPreparo}%` }}
                    className="bg-indigo-500 h-full"
                    title={`Preparo: ${preparoMin} min`}
                  />
                )}
                {pctTransito > 0 && (
                  <div
                    style={{ width: `${pctTransito}%` }}
                    className="bg-blue-600 h-full"
                    title={`Trânsito: ${transitoMin} min`}
                  />
                )}
              </div>

              {/* Detalhes de cada fator */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 bg-gray-50 border border-gray-100 rounded">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Fila Posto</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                    {filaMin} min
                  </span>
                </div>

                <div className="p-2 bg-gray-50 border border-gray-100 rounded">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Preparo</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                    {preparoMin} min
                  </span>
                </div>

                <div className="p-2 bg-gray-50 border border-gray-100 rounded">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Trânsito</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                    {transitoMin} min
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chips de Condições Operacionais */}
          {(trafegoLabel || acessoLabel) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-gray-500">Condições:</span>
              {trafegoLabel && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    aiPrediction?.condicoes_operacionais?.nivel_trafego ===
                    'CONGESTIONADO_OU_ADVERSO'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {trafegoLabel}
                </span>
              )}
              {acessoLabel && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                  {acessoLabel}
                </span>
              )}
            </div>
          )}

          {/* Alertas Contextuais de Risco de Atraso ou Anomalia */}
          {aiPrediction.tem_atraso_baseline ? (
            <div
              className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Aviso: variação de ~{aiPrediction.delta_atraso_minutos || 0} min em relação ao
                horário acordado na confirmação
              </span>
            </div>
          ) : aiPrediction.risco_atraso ? (
            <div
              className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs"
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Atenção: {aiPrediction.motivo_risco || 'Possível variação na rota'}</span>
            </div>
          ) : null}
        </div>
      ) : (
        /* Fallback quando não há dados calculados */
        <div className="space-y-2 py-1">
          <p className="text-sm font-medium text-blue-950">
            {isConcluido
              ? 'Operação finalizada com sucesso.'
              : isCancelado
              ? 'Despacho encerrado.'
              : isPendente
              ? 'Estimativa de aceite pelo posto: ~5 a 15 minutos.'
              : 'Estimativa de entrega: ~35 a 50 minutos.'}
          </p>
          <p className="text-xs text-blue-700">
            Monitoramento contínuo do percurso e vazão de abastecimento em tempo real.
          </p>
        </div>
      )}
    </div>
  );
};

export default AiOperationalCard;
