import React from 'react';
import { LogOut, User, ShieldCheck, Server, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export const HomePage = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'posto_admin': return { label: 'Administrador de Posto', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'entregador': return { label: 'Entregador Náutico', color: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'cliente':
      default: return { label: 'Cliente', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Barra Lateral (Sidebar NAVROTAS) - Navegação Fluida */}
      <aside className="w-64 bg-[#6b46c1] text-white flex flex-col shadow-2xl relative z-10 hidden md:flex">
        <div className="h-20 flex items-center px-8 border-b border-purple-500/30">
          <h1 className="text-2xl font-bold tracking-widest uppercase">NAVROTAS</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Aba Ativa (Home) */}
          <Link to="/" className="block px-4 py-3 rounded-lg bg-white/20 font-medium text-white transition-colors">
            Início / Perfil
          </Link>
          <Link to="/comprar" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Abastecimento
          </Link>
          <Link to="/enderecos" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Endereços
          </Link>
          <Link to="/rastreio" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Pedidos
          </Link>
        </nav>

        <div className="p-4 border-t border-purple-500/30">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-purple-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="p-8 space-y-8 max-w-6xl mx-auto w-full">
          
          <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  {badge.label}
                </span>
                <span className="text-xs text-green-700 flex items-center gap-1.5 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Sessão Autenticada
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-800">
                Bem-vindo(a), {user?.name || user?.email?.split('@')[0]}!
              </h2>
              <p className="text-gray-500 max-w-2xl text-base leading-relaxed">
                Você está conectado ao painel operacional NAVROTAS. Utilize o menu lateral para iniciar um abastecimento, gerenciar seus endereços ou acompanhar seus pedidos de forma fluida.
              </p>
            </div>
          </section>

          {/* Cards (Mantidos iguais ao design aprovado) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100"><User className="w-6 h-6" /></div>
                <div><h3 className="text-lg font-bold text-gray-800">Perfil</h3><p className="text-xs text-gray-500 font-medium">Dados do usuário</p></div>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
                <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">E-mail</span><span className="font-semibold text-gray-800">{user?.email || '—'}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">Nível</span><span className="font-bold uppercase text-[#6b46c1]">{user?.role || 'CLIENTE'}</span></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100"><Server className="w-6 h-6" /></div>
                <div><h3 className="text-lg font-bold text-gray-800">Sistema</h3><p className="text-xs text-gray-500 font-medium">Conexão com Servidor</p></div>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
                <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">API Base</span><span className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono text-xs">/api/v1</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-500 font-medium">Status</span><span className="text-green-600 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Online</span></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-xl text-orange-600 border border-orange-100"><Clock className="w-6 h-6" /></div>
                <div><h3 className="text-lg font-bold text-gray-800">Módulos</h3><p className="text-xs text-gray-500 font-medium">Implementações Recentes</p></div>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100 text-sm text-gray-600 font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /><span>Novo Design System Light</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /><span>Navegação Lateral Fixa e Fluida</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;