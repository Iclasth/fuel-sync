import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, MapPin, DollarSign, Droplets, ShoppingCart, X } from 'lucide-react';

export const ComprarCombustivelPage = () => {
  const navigate = useNavigate();
  const [combustivelSelecionado, setCombustivelSelecionado] = useState('gasolina');

  const tiposCombustivel = [
    { id: 'gasolina', label: 'Gasolina', icon: <Droplets className="w-4 h-4" /> },
    { id: 'diesel', label: 'Diesel', icon: <Droplets className="w-4 h-4" /> },
    { id: 'aditivada', label: 'Gasolina Aditivada', icon: <Droplets className="w-4 h-4" /> }
  ];

  const handleCancelar = () => {
    navigate(-1); 
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Fuel className="w-8 h-8 text-blue-500" />
            Comprar Combustível
          </h1>
          <p className="text-slate-400 mt-2">
            Selecione o tipo de combustível, a quantidade desejada e o posto para abastecimento.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
          
          <div className="mb-8">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Tipo de Combustível
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tiposCombustivel.map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => setCombustivelSelecionado(tipo.id)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                    combustivelSelecionado === tipo.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tipo.icon}
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Quantidade (Litros)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    placeholder="Ex: 10.000L"
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Preço Máximo por Litro (R$)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: R$ 5,80"
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Posto de Abastecimento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <select 
                  className="w-full pl-11 pr-10 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  defaultValue=""
                >
                  <option value="" disabled>Selecione um posto homologado...</option>
                  <option value="posto-1">Posto Real Center</option>
                  <option value="posto-2">Auto Posto Náutico Imperial</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex flex-col-reverse sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleCancelar}
                className="w-full sm:w-1/3 flex items-center justify-center gap-2 py-3 px-4 bg-transparent hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-xl transition-all text-base"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
              
              <button
                type="button"
                className="w-full sm:w-2/3 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-base"
              >
                <ShoppingCart className="w-5 h-5" />
                Confirmar Compra
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComprarCombustivelPage;