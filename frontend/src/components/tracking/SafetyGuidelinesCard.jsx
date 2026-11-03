import React from 'react';
import { ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';

export const SafetyGuidelinesCard = ({ aiPrediction, order }) => {
  const locationType = String(order?.tipo_local || 'MARINA').toUpperCase();
  const isMarina = ['MARINA', 'PONTÃO', 'PONTAO'].includes(locationType);
  const isEmpresa = ['EMPRESA', 'GERADOR'].includes(locationType);

  let normaBadge = 'NR-20 — Segurança Geral';
  let normaSub = 'Protocolo de segurança e controle de inflamáveis';

  if (isMarina) {
    normaBadge = 'Normam-04/DPC — Marítima';
    normaSub = 'Diretrizes de abastecimento náutico seguro';
  } else if (isEmpresa) {
    normaBadge = 'NR-20 — Abastecimento Industrial';
    normaSub = 'Isolamento de área e aterramento estático';
  }

  const defaultMarinaGuidelines = [
    'Desligar motores, geradores e circuitos elétricos da embarcação antes de iniciar o abastecimento (Normam-04/DPC).',
    'Conectar o cabo de equalização de potencial eletrostático antes da abertura do bocal do reservatório.',
    'Manter extintor de incêndio PQS ou CO2 desobstruído e pronto para uso imediato no píer.',
    'Proibir fumar ou acionar dispositivos não intrinsecamente seguros em um raio mínimo de 15 metros.',
    'Manter kit de mitigação com mantas absorventes a postos na linha d\'água para contenção preventiva.',
  ];

  const defaultEmpresaGuidelines = [
    'Isolar e sinalizar a área operacional com cones e fita zebrada conforme raio de segurança da NR-20.',
    'Fixar grampo de aterramento estático homologado no chassi/tanque antes de iniciar a vazão.',
    'Verificar capacidade volumétrica nominal e respiro do reservatório para evitar transbordamento.',
    'Dispor de extintor de pó químico com capacidade extintora mínima classe BC a barlavento da operação.',
  ];

  const defaultGeneralGuidelines = [
    'Isolar o perímetro operacional e manter a área livre de qualquer fonte de calor ou ignição (NR-20).',
    'Efetuar equalização eletrostática obrigatória antes de qualquer transferência de combustível.',
    'Manter extintores de incêndio portáteis adequados ao alcance imediato do operador.',
    'Manter pessoas não autorizadas e animais afastados da zona de descarregamento fracionado.',
  ];

  const guidelines =
    aiPrediction?.recomendacoes_seguranca &&
    Array.isArray(aiPrediction.recomendacoes_seguranca) &&
    aiPrediction.recomendacoes_seguranca.length > 0
      ? aiPrediction.recomendacoes_seguranca
      : isMarina
      ? defaultMarinaGuidelines
      : isEmpresa
      ? defaultEmpresaGuidelines
      : defaultGeneralGuidelines;

  return (
    <div
      className="bg-white border border-emerald-100 rounded-lg p-5 shadow-sm space-y-4"
      role="region"
      aria-label="Recomendações e Diretrizes de Segurança Operacional"
    >
      {/* Cabeçalho Institucional */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Checklist de Segurança Operacional
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{normaSub}</p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
          {normaBadge}
        </span>
      </div>

      {/* Lista de Checagem */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-gray-600 block">
          Itens obrigatórios antes do início da transferência de combustível:
        </span>

        <ul role="list" className="space-y-2.5">
          {guidelines.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 p-2 rounded-md bg-gray-50/70 border border-gray-100 text-xs text-gray-800 leading-relaxed"
            >
              <CheckCircle2
                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Rodapé Preventivo */}
      <div className="flex items-center gap-2 p-2.5 bg-amber-50/60 border border-amber-100 rounded text-[11px] text-amber-900">
        <AlertOctagon className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
        <span>Em caso de qualquer odor incomum ou vazamento, o bombeamento deve ser interrompido imediatamente.</span>
      </div>
    </div>
  );
};

export default SafetyGuidelinesCard;
