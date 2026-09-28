import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Fuel,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Package,
  Building2,
  Phone,
  Compass,
  Layers,
  Edit2,
  Truck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import AppLayout from '../components/layout/AppLayout';

export const HomePage = () => {
  const { user } = useAuth();
  const [latestOrder, setLatestOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);

  // Estados para Administrador de Posto
  const [myStation, setMyStation] = useState(null);
  const [isLoadingStation, setIsLoadingStation] = useState(false);
  const [stationError, setStationError] = useState('');

  // Estados para Entregador
  const [courierProfile, setCourierProfile] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [isLoadingCourier, setIsLoadingCourier] = useState(false);
  const [filtroEntregas, setFiltroEntregas] = useState('TODAS');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const carregarDadosEntregador = async () => {
    setIsLoadingCourier(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        api.get('/api/v1/couriers/me').catch(() => null),
        api.get('/api/v1/orders').catch(() => ({ data: [] })),
      ]);
      if (profileRes?.data) setCourierProfile(profileRes.data);
      setAssignedOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
    } catch (err) {
      console.error('Erro ao carregar dados do entregador:', err);
    } finally {
      setIsLoadingCourier(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Busca último pedido para clientes
    if (user?.role === 'cliente') {
      const fetchLatestOrder = async () => {
        try {
          const response = await api.get('/orders');
          if (isMounted && Array.isArray(response.data) && response.data.length > 0) {
            const sorted = [...response.data].sort((a, b) => b.id - a.id);
            setLatestOrder(sorted[0]);
          }
        } catch (err) {
          // Silencioso caso não haja pedidos ainda
        } finally {
          if (isMounted) setIsLoadingOrder(false);
        }
      };

      fetchLatestOrder();
    } else {
      setIsLoadingOrder(false);
    }

    // Busca dados do posto caso o usuário seja posto_admin
    if (user?.role === 'posto_admin' || user?.role === 'admin_geral') {
      setIsLoadingStation(true);
      api
        .get('/api/v1/stations/me')
        .then((res) => {
          if (isMounted) {
            setMyStation(res.data);
          }
        })
        .catch((err) => {
          if (isMounted) {
            if (err.response?.status === 404) {
              setStationError(
                'Nenhum posto de abastecimento vinculado ao seu perfil. Solicite o vínculo ao Administrador Geral.'
              );
            } else {
              setStationError('Não foi possível carregar as informações do seu posto.');
            }
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingStation(false);
        });
    }

    // Busca dados para entregador
    if (user?.role === 'entregador') {
      setIsLoadingCourier(true);
      Promise.all([
        api.get('/api/v1/couriers/me').catch(() => null),
        api.get('/api/v1/orders').catch(() => ({ data: [] })),
      ])
        .then(([profileRes, ordersRes]) => {
          if (isMounted) {
            if (profileRes?.data) setCourierProfile(profileRes.data);
            setAssignedOrders(Array.isArray(ordersRes?.data) ? ordersRes.data : []);
          }
        })
        .catch((err) => {
          console.error('Erro ao carregar dados do entregador:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingCourier(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  const handleConcluirEntrega = async (orderId) => {
    const confirm = window.confirm(
      `Confirma a conclusão do abastecimento e entrega do Pedido #${orderId}?`
    );
    if (!confirm) return;

    setIsUpdatingOrder(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      await api.patch(`/api/v1/orders/${orderId}/status`, { status: 'CONCLUIDO' });
      setMensagemSucesso(`Entrega do Pedido #${orderId} concluída com sucesso!`);
      setTimeout(() => setMensagemSucesso(''), 3500);
      await carregarDadosEntregador();
    } catch (err) {
      console.error('Erro ao concluir entrega:', err);
      setMensagemErro(err.response?.data?.error || 'Não foi possível concluir a entrega.');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin_geral':
        return { label: 'Administrador Geral', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'posto_admin':
        return { label: 'Administrador de Posto', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'entregador':
        return { label: 'Entregador Homologado', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'cliente':
      default:
        return { label: 'Cliente B2C', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <AppLayout>
      <div className="space-y-6 font-sans">
        {/* Banner de Boas-vindas Institucional */}
        <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${badge.color}`}>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  {badge.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sessão Ativa
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                Olá, {user?.name || user?.email?.split('@')[0]}
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                Plataforma NAVROTAS de gestão integrada de abastecimento náutico e rodoviário. Monitore rotas, gerencie entregas e acompanhe pedidos em tempo real.
              </p>
            </div>
            {user?.role === 'cliente' && (
              <div className="shrink-0">
                <Link
                  to="/comprar"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Fuel className="w-4 h-4" />
                  <span>Novo Abastecimento</span>
                </Link>
              </div>
            )}
            {(user?.role === 'posto_admin' || user?.role === 'admin_geral') && myStation && (
              <div className="shrink-0">
                <Link
                  to="/posto/dados"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar Dados do Posto</span>
                </Link>
              </div>
            )}
          </div>
        </section>

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

        {/* Visão Expandida do Posto para posto_admin */}
        {(user?.role === 'posto_admin' || user?.role === 'admin_geral') && (
          <div className="space-y-6">
            {isLoadingStation && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">Carregando informações do posto vinculado...</p>
              </div>
            )}

            {!isLoadingStation && stationError && (
              <div className="bg-white border border-amber-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Vínculo de Posto Pendente</h3>
                    <p className="text-xs text-gray-600 mt-1">{stationError}</p>
                  </div>
                </div>
              </div>
            )}

            {!isLoadingStation && myStation && (
              <>
                {/* Card Principal de Identificação da Unidade */}
                <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                          {myStation.nome_fantasia}
                        </h2>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${
                            myStation.ativo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {myStation.ativo ? 'Unidade Ativa' : 'Em Manutenção'}
                        </span>
                      </div>
                      {myStation.razao_social && (
                        <p className="text-xs text-gray-500 mt-0.5">{myStation.razao_social}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/posto/dados"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Gerenciar Dados</span>
                      </Link>
                    </div>
                  </div>

                  {/* Detalhes Operacionais do Posto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                      <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px]">
                        CNPJ Registrado
                      </span>
                      <span className="font-mono text-gray-900 font-medium block truncate">
                        {myStation.cnpj || '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                      <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        Telefone Comercial
                      </span>
                      <span className="text-gray-900 font-medium block truncate">
                        {myStation.telefone || '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                      <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        Tempo Médio de Preparo
                      </span>
                      <span className="text-gray-900 font-semibold block">
                        {myStation.tempo_medio_preparo_minutos} minutos
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                      <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px] flex items-center gap-1">
                        <Compass className="w-3 h-3 text-gray-400" />
                        Coordenadas Decimais
                      </span>
                      <span className="font-mono text-gray-900 font-medium block truncate">
                        {Number(myStation.latitude).toFixed(4)}, {Number(myStation.longitude).toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Endereço de Acesso Físico */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-900">Endereço de Acesso: </span>
                        <span>{myStation.endereco}</span>
                      </div>
                    </div>
                    {myStation.latitude && myStation.longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${myStation.latitude},${myStation.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                      >
                        <span>Abrir mapa</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </section>

                {/* Cards Operacionais de Acesso Rápido para o Gestor do Posto */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Fuel className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Tabela de Preços & Estoque</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Gerencie preços por litro, controle volumes disponíveis e consulte o histórico de alterações auditado.
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Link
                        to="/posto/precos"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        <span>Acessar tabela</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Fila de Pedidos</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Acompanhe solicitações de abastecimento em tempo real e avance os status operacionais da esteira.
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Link
                        to="/posto/pedidos"
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                      >
                        <span>Ver fila de pedidos</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <Truck className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Equipe de Entregadores</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Cadastre novos operadores de transporte náutico/terrestre e monitore sua disponibilidade operacional.
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Link
                        to="/posto/entregadores"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                      >
                        <span>Gerenciar equipe</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Visão Operacional do Entregador */}
        {user?.role === 'entregador' && (
          <div className="space-y-6">
            {/* Card de Identificação do Operador e Veículo Homologado */}
            <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                        {courierProfile?.nome || user?.name || 'Operador de Entrega'}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${
                          courierProfile?.status === 'EM_ROTA'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : courierProfile?.status === 'INDISPONIVEL'
                            ? 'bg-gray-100 text-gray-700 border-gray-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {courierProfile?.status || 'DISPONIVEL'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Operador autorizado para transporte e descarga fracionada de combustíveis homologados
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-800 rounded-lg uppercase">
                    Placa: {courierProfile?.placa || '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px]">
                    Veículo Homologado
                  </span>
                  <span className="text-gray-900 font-medium block truncate mt-0.5">
                    {courierProfile?.veiculo_descricao || 'Furgão Utilitário com Tanque Homologado'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px]">
                    Contato / Rádio
                  </span>
                  <span className="text-gray-900 font-medium block truncate mt-0.5">
                    {courierProfile?.telefone || '—'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider block text-[10px]">
                    Identificador de Fila
                  </span>
                  <span className="font-mono text-gray-900 font-semibold block mt-0.5">
                    Operador #{courierProfile?.id || (user?.id ? user.id.substring(0, 6) : '—')}
                  </span>
                </div>
              </div>
            </section>

            {/* KPIs de Desempenho Operacional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-sky-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                    Em Rota de Entrega
                  </span>
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-gray-900">
                    {assignedOrders.filter((o) => o.status === 'EM_TRANSPORTE').length}
                  </span>
                  <span className="text-xs text-gray-500">em trânsito</span>
                </div>
              </div>

              <div className="bg-white border border-indigo-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                    Aguardando Despacho
                  </span>
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-gray-900">
                    {assignedOrders.filter((o) => o.status === 'EM_PREPARACAO').length}
                  </span>
                  <span className="text-xs text-gray-500">no posto</span>
                </div>
              </div>

              <div className="bg-white border border-emerald-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Entregas Concluídas
                  </span>
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-gray-900">
                    {assignedOrders.filter((o) => o.status === 'CONCLUIDO').length}
                  </span>
                  <span className="text-xs text-gray-500">finalizadas</span>
                </div>
              </div>
            </div>

            {/* Fila de Entregas Designadas */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Suas Entregas Designadas
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Lista de solicitações de abastecimento sob sua responsabilidade
                  </p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setFiltroEntregas('TODAS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      filtroEntregas === 'TODAS'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Todas ({assignedOrders.length})
                  </button>
                  <button
                    onClick={() => setFiltroEntregas('EM_ANDAMENTO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      filtroEntregas === 'EM_ANDAMENTO'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Em Andamento ({assignedOrders.filter((o) => o.status === 'EM_TRANSPORTE' || o.status === 'EM_PREPARACAO').length})
                  </button>
                  <button
                    onClick={() => setFiltroEntregas('CONCLUIDAS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      filtroEntregas === 'CONCLUIDAS'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Concluídas ({assignedOrders.filter((o) => o.status === 'CONCLUIDO').length})
                  </button>
                </div>
              </div>

              {isLoadingCourier ? (
                <div className="p-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <span className="text-sm">Carregando entregas designadas...</span>
                </div>
              ) : assignedOrders
                  .filter((order) => {
                    if (filtroEntregas === 'EM_ANDAMENTO') {
                      return order.status === 'EM_TRANSPORTE' || order.status === 'EM_PREPARACAO';
                    }
                    if (filtroEntregas === 'CONCLUIDAS') {
                      return order.status === 'CONCLUIDO';
                    }
                    return true;
                  }).length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-gray-900">
                    Nenhuma entrega encontrada
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    {filtroEntregas === 'EM_ANDAMENTO'
                      ? 'Você não possui entregas em transporte ou aguardando preparo no momento.'
                      : 'Nenhum pedido foi designado para sua escala até o momento. Aguarde o despacho do posto.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {assignedOrders
                    .filter((order) => {
                      if (filtroEntregas === 'EM_ANDAMENTO') {
                        return order.status === 'EM_TRANSPORTE' || order.status === 'EM_PREPARACAO';
                      }
                      if (filtroEntregas === 'CONCLUIDAS') {
                        return order.status === 'CONCLUIDO';
                      }
                      return true;
                    })
                    .map((pedido) => {
                      const emTransporte = pedido.status === 'EM_TRANSPORTE';
                      const emPreparo = pedido.status === 'EM_PREPARACAO';
                      const concluido = pedido.status === 'CONCLUIDO';

                      return (
                        <div
                          key={pedido.id}
                          className={`p-5 transition-colors ${
                            emTransporte ? 'bg-sky-50/30 hover:bg-sky-50/50' : 'hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-base text-gray-900">
                                  Pedido #{pedido.id}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                                    emTransporte
                                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                                      : emPreparo
                                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                      : concluido
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                                >
                                  {pedido.status}
                                </span>
                                {pedido.created_at && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(pedido.created_at).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      day: '2-digit',
                                      month: '2-digit',
                                    })}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-start gap-2 text-xs text-gray-700">
                                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-gray-900">Destino: </span>
                                  <span>{pedido.endereco_entrega}</span>
                                  {pedido.ponto_referencia && (
                                    <p className="text-gray-500 mt-0.5">
                                      <strong>Ponto de Ref: </strong>
                                      {pedido.ponto_referencia}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {pedido.instrucoes_adicionais && (
                                <div className="p-2.5 bg-white border border-gray-200 rounded text-xs text-gray-700">
                                  <span className="font-semibold text-gray-800 block text-[11px] uppercase tracking-wider mb-0.5">
                                    Instruções do Cliente:
                                  </span>
                                  <p>{pedido.instrucoes_adicionais}</p>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                                <span className="font-semibold text-gray-900 font-mono">
                                  Valor Total: R$ {Number(pedido.valor_total).toFixed(2)}
                                </span>
                                {pedido.destino_latitude && pedido.destino_longitude && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${pedido.destino_latitude},${pedido.destino_longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 underline"
                                  >
                                    <span>Abrir rota no Maps</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 shrink-0">
                              {emTransporte && (
                                <button
                                  onClick={() => handleConcluirEntrega(pedido.id)}
                                  disabled={isUpdatingOrder}
                                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                                >
                                  {isUpdatingOrder ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                  <span>Concluir Entrega</span>
                                </button>
                              )}

                              {emPreparo && (
                                <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                                  Preparando Carga no Posto
                                </span>
                              )}

                              {concluido && (
                                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Entrega Finalizada</span>
                                </span>
                              )}

                              <Link
                                to={`/rastreio?orderId=${pedido.id}`}
                                className="text-xs font-semibold text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
                              >
                                <span>Ver rastreamento</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card de Pedido em Andamento (Apenas para Clientes) */}
        {user?.role === 'cliente' && latestOrder && (
          <section className="bg-white border border-blue-200 rounded-lg p-5 shadow-sm bg-gradient-to-r from-blue-50/30 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Último Pedido (#{latestOrder.id})
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                      {latestOrder.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    Destino: {latestOrder.endereco_entrega}
                  </p>
                  <p className="text-xs text-gray-500">
                    Valor total: R$ {Number(latestOrder.valor_total).toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <Link
                  to={`/rastreio?orderId=${latestOrder.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg shadow-sm transition-colors"
                >
                  <span>Acompanhar entrega</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Módulos de Acesso Rápido para Clientes */}
        {user?.role === 'cliente' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Fuel className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Abastecimento Sob Demanda</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Solicite combustíveis para embarcações ou frotas com cálculo dinâmico de tarifação por posto credenciado.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  to="/comprar"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Acessar catálogo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Histórico de Pedidos</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Acompanhe a timeline da esteira de atendimento: recebido, em trânsito e abastecimento concluído.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  to="/rastreio"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                >
                  <span>Ver pedidos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Pontos de Entrega</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Cadastre píeres, marinas, garagens náuticas ou coordenadas terrestres para entregas recorrentes.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  to="/enderecos"
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
                >
                  <span>Gerenciar locais</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HomePage;