import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Clock, Navigation, CheckCircle2, LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const STATUS_PEDIDO = {
  PENDENTE: 'Pendente',
  ROTA: 'Calculando Rota',
  TRANSITO: 'A Caminho',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado'
};

export default function OrderTrackingPage() {
  const { logout } = useAuth();
  const [statusAtual, setStatusAtual] = useState(STATUS_PEDIDO.PENDENTE);

  const renderizarConteudoDoStatus = () => {
    switch (statusAtual) {
      case STATUS_PEDIDO.PENDENTE:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <Clock className="w-12 h-12 text-yellow-500 mb-3 animate-pulse" />
            <p className="text-gray-800 font-bold text-base">Aguardando confirmação do posto...</p>
            <p className="text-gray-500 text-sm mt-1">O parceiro logístico está a validar o stock selecionado.</p>
          </div>
        );
      case STATUS_PEDIDO.ROTA:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-purple-50 border-2 border-purple-200 rounded-xl">
            <div className="w-10 h-10 border-4 border-[#6b46c1] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[#6b46c1] font-bold text-base">IA a definir a melhor rota e o entregador...</p>
            <p className="text-purple-600/70 text-sm mt-1">Otimizando percursos náuticos e terrestres em tempo real.</p>
          </div>
        );
      case STATUS_PEDIDO.TRANSITO:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-inner">
            <Truck className="w-12 h-12 text-blue-500 mb-3 animate-bounce" />
            <p className="text-blue-800 font-bold text-base">Camião/Embarcação a caminho!</p>
            <p className="text-blue-600/70 text-sm mt-1">Acompanhamento ativo via telemetria GPS.</p>
          </div>
        );
      case STATUS_PEDIDO.ENTREGUE:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-green-50 border-2 border-green-200 rounded-xl">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-green-700 font-bold text-xl">Combustível entregue com sucesso!</p>
            <p className="text-green-600/70 text-sm mt-1">Recibo digital e relatório de abastecimento emitidos.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (statusAtual) {
      case STATUS_PEDIDO.PENDENTE: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case STATUS_PEDIDO.ROTA: return 'bg-purple-100 text-purple-700 border-purple-200';
      case STATUS_PEDIDO.TRANSITO: return 'bg-blue-100 text-blue-700 border-blue-200';
      case STATUS_PEDIDO.ENTREGUE: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Barra Lateral (Sidebar NAVROTAS) */}
      <aside className="w-64 bg-[#6b46c1] text-white flex flex-col shadow-2xl relative z-10 hidden md:flex">
        <div className="h-20 flex items-center px-8 border-b border-purple-500/30">
          <h1 className="text-2xl font-bold tracking-widest uppercase">NAVROTAS</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Início / Perfil
          </Link>
          <Link to="/comprar" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Abastecimento
          </Link>
          <Link to="/enderecos" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Endereços
          </Link>
          <Link to="/rastreio" className="block px-4 py-3 rounded-lg bg-white/20 font-medium text-white transition-colors">
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
      <main className="flex-1 flex flex-col h-screen overflow-y-auto p-8">
        <div className="max-w-4xl w-full mx-auto space-y-8">
          
          <div>
            <h2 className="text-2xl font-bold text-[#6b46c1] flex items-center gap-2">
              <Navigation className="w-6 h-6" />
              Acompanhar Pedido
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Monitorize em tempo real o estado do seu fornecimento de combustível através da nossa IA logística.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Identificador</span>
                <h3 className="font-bold text-gray-800 text-lg">Pedido #FS-1234</h3>
              </div>
              
              <span className={`px-4 py-1.5 rounded-full font-bold text-sm border ${getStatusColor()}`}>
                {statusAtual}
              </span>
            </div>

            <div>
              {renderizarConteudoDoStatus()}
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Simulador de Estados:</span>
              
              <button 
                onClick={() => setStatusAtual(STATUS_PEDIDO.PENDENTE)} 
                className="bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-gray-300"
              >
                Pendente
              </button>
              
              <button 
                onClick={() => setStatusAtual(STATUS_PEDIDO.ROTA)} 
                className="bg-purple-50 hover:bg-purple-100 text-[#6b46c1] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-purple-200"
              >
                IA (Rota)
              </button>
              
              <button 
                onClick={() => setStatusAtual(STATUS_PEDIDO.TRANSITO)} 
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-blue-200"
              >
                Trânsito
              </button>
              
              <button 
                onClick={() => setStatusAtual(STATUS_PEDIDO.ENTREGUE)} 
                className="bg-green-50 hover:bg-green-100 text-green-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-green-200"
              >
                Entregue
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}