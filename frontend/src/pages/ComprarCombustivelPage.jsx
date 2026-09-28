import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export const ComprarCombustivelPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [combustivelSelecionado, setCombustivelSelecionado] = useState('gasolina');

  const tiposCombustivel = [
    { id: 'gasolina', label: 'Gasolina' },
    { id: 'diesel', label: 'Diesel' },
    { id: 'aditivada', label: 'Gasolina / Aditivada' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de submissão aqui
    console.log('Compra confirmada!');
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
          <Link to="/comprar" className="block px-4 py-3 rounded-lg bg-white/20 font-medium text-white transition-colors">
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
      <main className="flex-1 flex flex-col h-screen overflow-y-auto p-8">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          
          <div>
            <h2 className="text-2xl font-bold text-[#6b46c1]">Comprar combustível</h2>
          </div>

          {/* Cartão do Formulário */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 shadow-sm">
            
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Seleção de Tipo de Combustível */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiposCombustivel.map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setCombustivelSelecionado(tipo.id)}
                    className={`py-3 px-4 rounded-lg text-sm font-medium transition-all border ${
                      combustivelSelecionado === tipo.id
                        ? 'bg-[#6b46c1] text-white border-[#6b46c1] shadow-md shadow-purple-500/20'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-[#6b46c1] hover:text-[#6b46c1]'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>

              {/* Campos de Quantidade e Preço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Litros
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 10.000L"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">
                    Preço por litro (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: R$ 65.300,00"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                  />
                </div>
              </div>

              {/* Campo de Posto */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">
                  Posto
                </label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 appearance-none focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>Selecione um posto...</option>
                    <option value="posto-1">Posto Real Center</option>
                    <option value="posto-2">Auto Posto Náutico Imperial</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-6 flex justify-center">
                <button
                  type="submit"
                  className="w-full md:w-auto min-w-[240px] py-3 px-8 bg-[#6b46c1] hover:bg-[#553699] active:bg-[#442b7a] text-white text-sm font-semibold rounded-lg shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  Confirmar Compra
                </button>
              </div>
              
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComprarCombustivelPage;