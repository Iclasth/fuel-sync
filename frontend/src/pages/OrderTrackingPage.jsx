import React, { useState } from 'react';
import { Clock, CheckCircle2, Truck, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';

const ORDER_STATUS_CONFIG = {
  PENDENTE: {
    label: 'Pendente',
    description: 'Aguardando validação de estoque pelo posto credenciado.',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  CONFIRMADO: {
    label: 'Confirmado',
    description: 'Posto confirmou a disponibilidade e agendou o despacho.',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  PREPARANDO: {
    label: 'Preparando',
    description: 'Carga em abastecimento no tanque do caminhão/embarcação.',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  EM_TRANSITO: {
    label: 'Em Trânsito',
    description: 'Entregador em deslocamento até o ponto de atracação/entrega.',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  ENTREGUE: {
    label: 'Entregue',
    description: 'Abastecimento finalizado com telemetria conferida.',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  CANCELADO: {
    label: 'Cancelado',
    description: 'Pedido cancelado pelo cliente ou operador.',
    badge: 'bg-red-50 text-red-800 border-red-200',
  },
};

const STEPS = ['PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'EM_TRANSITO', 'ENTREGUE'];

export const OrderTrackingPage = () => {
  const [currentStatus, setCurrentStatus] = useState('EM_TRANSITO');

  const currentStepIndex = STEPS.indexOf(currentStatus);
  const statusInfo = ORDER_STATUS_CONFIG[currentStatus] || ORDER_STATUS_CONFIG.PENDENTE;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Rastreamento de Pedido
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe o status e a telemetria do seu pedido em tempo real
          </p>
        </div>

        {/* Detalhes do Pedido Ativo */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-100 gap-3">
            <div>
              <span className="text-xs text-gray-500 font-mono">PEDIDO #FS-2026-089</span>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                Gasolina Comum — 1.500 Litros
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Fornecedor: Auto Posto Náutico Imperial | Destino: Marina Santos Vaga 12
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded text-xs font-semibold border ${statusInfo.badge}`}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Stepper Timeline Horizontal */}
          <div className="py-8">
            <div className="hidden sm:flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
              {STEPS.map((stepKey, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const stepConfig = ORDER_STATUS_CONFIG[stepKey];

                return (
                  <div key={stepKey} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        isPassed
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : 'bg-white border-2 border-gray-300 text-gray-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCurrent
                          ? 'text-blue-700 font-bold'
                          : isPassed
                          ? 'text-gray-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {stepConfig.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stepper Mobile Vertical */}
            <div className="sm:hidden space-y-4">
              {STEPS.map((stepKey, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const stepConfig = ORDER_STATUS_CONFIG[stepKey];

                return (
                  <div key={stepKey} className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPassed
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-100'
                          : 'bg-white border border-gray-300 text-gray-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isCurrent ? 'text-blue-700' : 'text-gray-800'
                        }`}
                      >
                        {stepConfig.label}
                      </p>
                      <p className="text-xs text-gray-500">{stepConfig.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Ativo Banner */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Situação da Operação
            </h3>
            <p className="text-sm font-medium text-gray-900">{statusInfo.description}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default OrderTrackingPage;