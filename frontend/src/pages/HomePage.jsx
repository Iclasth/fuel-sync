import React from 'react';
import { Fuel, LogOut, User, ShieldCheck, CheckCircle2, Server, Clock } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export const HomePage = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'posto_admin':
        return {
          label: 'Administrador de Posto',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        };
      case 'entregador':
        return {
          label: 'Entregador Náutico',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'cliente':
      default:
        return {
          label: 'Cliente',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Fuel className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Fuel<span className="text-blue-400">Sync</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-white">{user?.name || user?.email}</span>
              <span className="text-xs text-slate-400">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  {badge.label}
                </span>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sessão Autenticada
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Bem-vindo(a), {user?.name || user?.email?.split('@')[0]}!
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl">
                Você está conectado ao painel operacional do FuelSync. Os módulos operacionais e de gestão de pedidos serão disponibilizados de acordo com o seu perfil de acesso.
              </p>
            </div>
          </div>
        </section>

        {/* User Profile Card & System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 rounded-xl text-blue-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Perfil do Usuário</h3>
                <p className="text-xs text-slate-400">Dados do token de sessão</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-sm border-t border-slate-800/80">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 text-xs">Identificador (ID)</span>
                <span className="text-xs font-mono text-slate-300 max-w-[180px] truncate" title={user?.id}>
                  {user?.id || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 text-xs">E-mail</span>
                <span className="text-xs font-medium text-slate-200">{user?.email || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 text-xs">Regra de Acesso (RBAC)</span>
                <span className="text-xs font-semibold uppercase text-blue-400">{user?.role || 'cliente'}</span>
              </div>
            </div>
          </div>

          {/* Backend Status Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600/20 rounded-xl text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Backend & APIs</h3>
                <p className="text-xs text-slate-400">Comunicação via proxy reverso</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 text-sm border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Endpoint Base</span>
                <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">/api/v1</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Documentação Swagger</span>
                <a
                  href="http://localhost:3000/api-docs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Abrir /api-docs ↗
                </a>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status do Container</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                </span>
              </div>
            </div>
          </div>

          {/* Platform Roadmap Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-600/20 rounded-xl text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Próximas Telas</h3>
                <p className="text-xs text-slate-400">Módulos em estruturação</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs border-t border-slate-800/80 text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Autenticação & RBAC (Concluído)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Docker & Proxy Vite (Concluído)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                <span className="text-slate-400">Gestão de Pedidos B2C (Etapa 5)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        FuelSync Maritime & Fleet Solutions — Ambiente de Desenvolvimento Integrado (Docker)
      </footer>
    </div>
  );
};

export default HomePage;
