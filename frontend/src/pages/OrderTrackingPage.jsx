import { useState } from 'react';
import { Truck, Clock, Navigation, CheckCircle2, ShieldAlert } from 'lucide-react';

const STATUS_PEDIDO = {
  PENDENTE: 'Pendente',
  ROTA: 'Calculando Rota',
  TRANSITO: 'A Caminho',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado'
};

export default function OrderTrackingPage() {
  const [statusAtual, setStatusAtual] = useState(STATUS_PEDIDO.PENDENTE);

  const renderizarConteudoDoStatus = () => {
    switch (statusAtual) {
      case STATUS_PEDIDO.PENDENTE:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-900/40 border-2 border-dashed border-slate-700 rounded-xl">
            <Clock className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
            <p className="text-slate-300 font-semibold text-base">Aguardando confirmação do posto...</p>
            <p className="text-slate-500 text-xs mt-1">O parceiro logístico está a validar o stock selecionado.</p>
          </div>
        );
      case STATUS_PEDIDO.ROTA:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-blue-950/20 border-2 border-blue-500/40 rounded-xl">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-400 font-semibold text-base">IA a definir a melhor rota e o entregador...</p>
            <p className="text-slate-500 text-xs mt-1">Otimizando percursos náuticos e terrestres em tempo real.</p>
          </div>
        );
      case STATUS_PEDIDO.TRANSITO:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-900/60 border-2 border-slate-700 rounded-xl shadow-inner">
            <Truck className="w-12 h-12 text-blue-400 mb-3 animate-bounce" />
            <p className="text-slate-100 font-bold text-base">Camião/Embarcação a caminho!</p>
            <p className="text-slate-400 text-xs mt-1">Acompanhamento ativo via telemetria GPS.</p>
          </div>
        );
      case STATUS_PEDIDO.ENTREGUE:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-emerald-950/30 border-2 border-emerald-500/40 rounded-xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <p className="text-emerald-300 font-bold text-xl">Combustível entregue com sucesso!</p>
            <p className="text-slate-400 text-xs mt-1">Recibo digital e relatório de abastecimento emitidos.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Navigation className="w-8 h-8 text-blue-500" />
          Acompanhar Pedido
        </h1>
        <p className="text-slate-400 mt-2">
          Monitorize em tempo real o estado do seu fornecimento de combustível através da nossa IA logística.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Identificador</span>
            <h3 className="font-bold text-white text-lg">Pedido #FS-1234</h3>
          </div>
          
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full font-bold text-sm">
            {statusAtual}
          </span>
        </div>

        <div>
          {renderizarConteudoDoStatus()}
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Simulador de Estados:</span>
          
          <button 
            onClick={() => setStatusAtual(STATUS_PEDIDO.PENDENTE)} 
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
          >
            Pendente
          </button>
          
          <button 
            onClick={() => setStatusAtual(STATUS_PEDIDO.ROTA)} 
            className="bg-blue-900/60 hover:bg-blue-900 text-blue-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-blue-700/50"
          >
            IA (Rota)
          </button>
          
          <button 
            onClick={() => setStatusAtual(STATUS_PEDIDO.TRANSITO)} 
            className="bg-cyan-900/60 hover:bg-cyan-900 text-cyan-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-cyan-700/50"
          >
            Trânsito
          </button>
          
          <button 
            onClick={() => setStatusAtual(STATUS_PEDIDO.ENTREGUE)} 
            className="bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-700/50"
          >
            Entregue
          </button>
        </div>

      </div>
    </div>
  );
}