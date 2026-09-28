import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Truck,
  ArrowRight,
  Eye,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Status' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'CONFIRMADO_POSTO', label: 'Confirmados' },
  { value: 'EM_PREPARACAO', label: 'Em Preparação' },
  { value: 'EM_TRANSPORTE', label: 'Em Transporte' },
  { value: 'CONCLUIDO', label: 'Concluídos' },
  { value: 'CANCELADO', label: 'Cancelados' },
];

const STATUS_BADGES = {
  PENDENTE: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMADO_POSTO: 'bg-blue-50 text-blue-800 border-blue-200',
  EM_PREPARACAO: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  EM_TRANSPORTE: 'bg-sky-50 text-sky-800 border-sky-200',
  CONCLUIDO: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-red-50 text-red-800 border-red-200',
};

export const PostoPedidosPage = () => {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const carregarPedidos = async () => {
    setIsLoading(true);
    setMensagemErro('');
    try {
      const res = await api.get('/api/v1/orders');
      setPedidos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao carregar fila de pedidos:', err);
      setMensagemErro('Não foi possível carregar a lista de pedidos do posto.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const handleUpdateStatus = async (orderId, novoStatus) => {
    setIsUpdating(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      await api.patch(`/api/v1/orders/${orderId}/status`, { status: novoStatus });
      setMensagemSucesso(`Status do Pedido #${orderId} atualizado para ${novoStatus}!`);
      setTimeout(() => setMensagemSucesso(''), 3500);
      await carregarPedidos();
      if (pedidoSelecionado && pedidoSelecionado.id === orderId) {
        setPedidoSelecionado((prev) => ({ ...prev, status: novoStatus }));
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setMensagemErro(err.response?.data?.error || 'Erro ao atualizar o status do pedido.');
    } finally {
      setIsUpdating(false);
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
    const matchBusca =
      !termoBusca ||
      String(p.id).includes(termoBusca) ||
      (p.endereco_entrega && p.endereco_entrega.toLowerCase().includes(termoBusca.toLowerCase())) ||
      (p.ponto_referencia && p.ponto_referencia.toLowerCase().includes(termoBusca.toLowerCase()));
    return matchStatus && matchBusca;
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Fila de Pedidos & Despacho
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitore solicitações de abastecimento e gerencie a evolução operacional do posto
            </p>
          </div>

          <button
            onClick={carregarPedidos}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar Fila</span>
          </button>
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

        {mensagemErro && (
          <div
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{mensagemErro}</span>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por ID, endereço ou ponto de referência..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 min-h-[40px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="sm:w-60">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 min-h-[40px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Destino / Local</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <span>Carregando fila operacional...</span>
                    </td>
                  </tr>
                ) : pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      Nenhum pedido encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((p) => {
                    const badgeClass = STATUS_BADGES[p.status] || 'bg-gray-100 text-gray-800';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          <div>#{p.id}</div>
                          <span className="text-[11px] font-normal text-gray-400">
                            {p.created_at ? new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-700 max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{p.endereco_entrega}</div>
                          {p.ponto_referencia && (
                            <div className="text-gray-500 truncate">Ref: {p.ponto_referencia}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-gray-900">
                          R$ {Number(p.valor_total).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClass}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                            {p.status === 'PENDENTE' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(p.id, 'CONFIRMADO_POSTO')}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
                                >
                                  Aceitar
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(p.id, 'CANCELADO')}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold rounded transition-colors cursor-pointer"
                                >
                                  Recusar
                                </button>
                              </>
                            )}

                            {p.status === 'CONFIRMADO_POSTO' && (
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'EM_PREPARACAO')}
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
                              >
                                Iniciar Preparo
                              </button>
                            )}

                            {p.status === 'EM_PREPARACAO' && (
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'EM_TRANSPORTE')}
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
                              >
                                Despachar
                              </button>
                            )}

                            {p.status === 'EM_TRANSPORTE' && (
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'CONCLUIDO')}
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
                              >
                                Concluir Entrega
                              </button>
                            )}

                            <button
                              onClick={() => setPedidoSelecionado(p)}
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Visualizar Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Detalhes do Pedido */}
        {pedidoSelecionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  Detalhes do Pedido #{pedidoSelecionado.id}
                </h3>
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider block">
                    Local e Coordenadas
                  </span>
                  <p className="text-gray-900 text-sm mt-0.5">{pedidoSelecionado.endereco_entrega}</p>
                  {pedidoSelecionado.ponto_referencia && (
                    <p className="text-gray-500">Ref: {pedidoSelecionado.ponto_referencia}</p>
                  )}
                  <p className="text-gray-400 font-mono mt-0.5">
                    Lat: {pedidoSelecionado.destino_latitude}, Lon: {pedidoSelecionado.destino_longitude}
                  </p>
                </div>

                {pedidoSelecionado.instrucoes_adicionais && (
                  <div>
                    <span className="font-semibold text-gray-500 uppercase tracking-wider block">
                      Instruções do Cliente
                    </span>
                    <p className="text-gray-800 bg-gray-50 p-2 rounded mt-0.5">
                      {pedidoSelecionado.instrucoes_adicionais}
                    </p>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Itens do Pedido
                  </span>
                  {pedidoSelecionado.itens_pedido && pedidoSelecionado.itens_pedido.length > 0 ? (
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded">
                      {pedidoSelecionado.itens_pedido.map((it, idx) => (
                        <div key={idx} className="p-2 flex justify-between text-gray-800">
                          <span>Combustível #{it.combustivel_id} ({it.quantidade_litros} L)</span>
                          <span className="font-mono font-bold">R$ {Number(it.subtotal || it.quantidade_litros * it.valor_unitario).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Combustível fracionado padrão.</p>
                  )}
                </div>

                <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-gray-100">
                  <span>Valor Total:</span>
                  <span className="text-base text-gray-900 font-mono">
                    R$ {Number(pedidoSelecionado.valor_total).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PostoPedidosPage;
