import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Loader2,
  Package,
  MapPin,
  Calendar,
  Fuel,
  Ban,
  Radio,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import api from '../services/api';

const ORDER_STATUS_CONFIG = {
  PENDENTE: {
    label: 'Aguardando Posto',
    description: 'Aguardando confirmação de estoque e fila pelo posto credenciado.',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    step: 0,
  },
  CONFIRMADO_POSTO: {
    label: 'Confirmado',
    description: 'Posto confirmou a disponibilidade e agendou o abastecimento fracionado.',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    step: 1,
  },
  EM_PREPARACAO: {
    label: 'Em Preparação',
    description: 'Carga em abastecimento no tanque do caminhão/embarcação homologada.',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    step: 2,
  },
  EM_TRANSPORTE: {
    label: 'Em Transporte',
    description: 'Entregador em deslocamento até o ponto de atracação/entrega.',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    step: 3,
  },
  CONCLUIDO: {
    label: 'Concluído',
    description: 'Abastecimento finalizado com telemetria conferida e comprovante gerado.',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    step: 4,
  },
  CANCELADO: {
    label: 'Cancelado',
    description: 'Pedido cancelado. Nenhuma cobrança ou despacho será efetuado.',
    badge: 'bg-red-50 text-red-800 border-red-200',
    step: -1,
  },
};

const LOGISTIC_STEPS = [
  { key: 'PENDENTE', label: '1. Pedido Criado' },
  { key: 'CONFIRMADO_POSTO', label: '2. Confirmado' },
  { key: 'EM_PREPARACAO', label: '3. Preparo' },
  { key: 'EM_TRANSPORTE', label: '4. Em Trânsito' },
  { key: 'CONCLUIDO', label: '5. Concluído' },
];

export const OrderTrackingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Carrega lista de pedidos e pedido ativo
  const fetchOrderDetails = async (id) => {
    try {
      setIsLoading(true);
      setErro('');
      const res = await api.get(`/api/v1/orders/${id}`);
      setActiveOrder(res.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes do pedido:', err);
      setErro('Não foi possível carregar os detalhes do pedido selecionado.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/api/v1/orders');
        const list = Array.isArray(res.data) ? res.data : [];
        setOrders(list);

        if (queryOrderId) {
          await fetchOrderDetails(queryOrderId);
        } else if (list.length > 0) {
          // Seleciona o primeiro pedido (mais recente)
          const targetId = list[0].id;
          setSearchParams({ orderId: String(targetId) });
          await fetchOrderDetails(targetId);
        } else {
          setActiveOrder(null);
        }
      } catch (err) {
        console.error('Erro ao listar pedidos:', err);
        setErro('Erro ao consultar seus pedidos ativos.');
      } finally {
        setIsLoading(false);
      }
    };

    carregarPedidos();
  }, [queryOrderId]);

  const handleSelectOrder = (id) => {
    setSearchParams({ orderId: String(id) });
  };

  const handleCancelOrder = async () => {
    if (!activeOrder || activeOrder.status !== 'PENDENTE') return;

    const confirm = window.confirm(
      'Tem certeza de que deseja cancelar este pedido de abastecimento? Esta ação não pode ser desfeita.'
    );
    if (!confirm) return;

    setIsCancelling(true);
    setErro('');
    setMensagemSucesso('');

    try {
      await api.post(`/api/v1/orders/${activeOrder.id}/cancel`, {
        motivo: 'Cancelamento solicitado pelo cliente via interface web.',
      });
      setMensagemSucesso('Pedido cancelado com sucesso.');
      // Atualiza os dados do pedido ativo
      await fetchOrderDetails(activeOrder.id);
    } catch (err) {
      console.error('Erro ao cancelar pedido:', err);
      setErro(err.response?.data?.error || 'Não foi possível cancelar o pedido.');
    } finally {
      setIsCancelling(false);
    }
  };

  const status = activeOrder?.status || 'PENDENTE';
  const statusInfo = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDENTE;
  const currentStepIndex = statusInfo.step;
  const isCancelled = status === 'CANCELADO';
  const canCancel = status === 'PENDENTE';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Rastreamento de Abastecimento
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Acompanhe o ciclo operacional, telemetria de bomba e estimativas de entrega em tempo real
            </p>
          </div>

          <Link
            to="/comprar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors w-fit"
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Novo Pedido</span>
          </Link>
        </div>

        {mensagemSucesso && (
          <div
            className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm"
            role="status"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{mensagemSucesso}</span>
          </div>
        )}

        {erro && (
          <div
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{erro}</span>
          </div>
        )}

        {/* Seletor de Pedidos Recentes */}
        {orders.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Seus Pedidos:
            </span>
            {orders.map((o) => {
              const isSelected = activeOrder && String(activeOrder.id) === String(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => handleSelectOrder(o.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Pedido #{o.id} — {o.status}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Localizando telemetria do pedido...</p>
          </div>
        ) : !activeOrder ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">Nenhum pedido ativo encontrado</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Você ainda não possui pedidos de abastecimento registrados no sistema.
            </p>
            <div className="mt-6">
              <Link
                to="/comprar"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <span>Solicitar Primeiro Abastecimento</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm space-y-6">
            {/* Header do Pedido */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-500">
                    PEDIDO #{activeOrder.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${statusInfo.badge}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-1">
                  Abastecimento Fracionado
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{activeOrder.endereco_entrega}</span>
                  </span>
                  {activeOrder.ponto_referencia && (
                    <span className="text-gray-400">Ref: {activeOrder.ponto_referencia}</span>
                  )}
                  {activeOrder.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{new Date(activeOrder.created_at).toLocaleString('pt-BR')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Botão de Cancelamento */}
              {canCancel && (
                <div className="shrink-0">
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4 text-red-600" />
                    )}
                    <span>Cancelar Pedido</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stepper Timeline Horizontal / Vertical */}
            {isCancelled ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Este pedido foi cancelado.</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    O ciclo de transporte e separação do combustível foi interrompido.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <div className="hidden sm:flex items-center justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                  {LOGISTIC_STEPS.map((step, idx) => {
                    const isPassed = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center">
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
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Stepper Vertical */}
                <div className="sm:hidden space-y-3">
                  {LOGISTIC_STEPS.map((step, idx) => {
                    const isPassed = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step.key} className="flex items-center gap-3">
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
                        <span
                          className={`text-xs ${
                            isCurrent ? 'text-blue-700 font-bold' : 'text-gray-600'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Descrição do Status e Telemetria IA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span>Situação Atual da Operação</span>
                </h3>
                <p className="text-sm font-medium text-gray-900">{statusInfo.description}</p>
                {!canCancel && !isCancelled && (
                  <p className="text-[11px] text-gray-500 mt-2">
                    * Bloqueio antifraude e segurança: cancelamento desabilitado após o despacho do posto.
                  </p>
                )}
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Previsão Logística & Telemetria</span>
                </h3>
                <p className="text-sm font-medium text-blue-950">
                  {status === 'CONCLUIDO'
                    ? 'Operação finalizada com sucesso.'
                    : isCancelled
                    ? 'Despacho encerrado.'
                    : 'Estimativa de entrega: ~35 a 50 minutos.'}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Monitoramento contínuo da bomba certificada INMETRO e rota rastreada via GPS.
                </p>
              </div>
            </div>

            {/* Itens do Pedido e Resumo Financeiro */}
            {activeOrder.itens_pedido && activeOrder.itens_pedido.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Itens e Volumes Solicitados
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                        <th className="py-2.5 px-3">Item / Combustível</th>
                        <th className="py-2.5 px-3 text-right">Volume</th>
                        <th className="py-2.5 px-3 text-right">Preço Unitário</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeOrder.itens_pedido.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="py-2.5 px-3 text-gray-900 font-medium">
                            Combustível #{item.combustivel_id}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700 font-mono">
                            {Number(item.quantidade_litros).toFixed(0)} L
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700 font-mono">
                            R$ {Number(item.valor_unitario).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-900 font-semibold font-mono">
                            R$ {Number(item.subtotal || item.quantidade_litros * item.valor_unitario).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 font-bold bg-gray-50 text-gray-900">
                        <td colSpan={3} className="py-3 px-3 text-right uppercase text-xs">
                          Valor Total:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-base">
                          R$ {Number(activeOrder.valor_total).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default OrderTrackingPage;