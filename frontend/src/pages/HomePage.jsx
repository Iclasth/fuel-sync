import React from 'react';
import { Link } from 'react-router-dom';
import { Fuel, MapPin, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import AppLayout from '../components/layout/AppLayout';

export const HomePage = () => {
  const { user } = useAuth();

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
      <div className="space-y-6">
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
                Plataforma de gestão integrada de abastecimento náutico e rodoviário. Monitore rotas, gerencie entregas e acompanhe pedidos em tempo real.
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
          </div>
        </section>

        {/* Módulos de Acesso Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Fuel className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Abastecimento Sob Demanda</h2>
              <p className="text-xs text-gray-500 mt-1">
                Solicite combustíveis para embarcações ou veículos com cálculo dinâmico de tarifação por posto credenciado.
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

        {/* Painel de Telemetria e Conectividade */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Status da Conexão & API
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Operacional
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 block">Identificador do Operador</span>
              <span className="font-mono font-medium text-gray-800 break-all">{user?.id || '—'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 block">E-mail Cadastrado</span>
              <span className="font-medium text-gray-800">{user?.email || '—'}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 block">Gateway de API</span>
              <span className="font-mono font-medium text-gray-800">/api/v1 (Proxy Interno)</span>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default HomePage;