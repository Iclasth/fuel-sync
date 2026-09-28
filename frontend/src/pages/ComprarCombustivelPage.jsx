import React, { useState } from 'react';
import { Fuel, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';

export const ComprarCombustivelPage = () => {
  const [combustivelSelecionado, setCombustivelSelecionado] = useState('gasolina_comum');
  const [quantidadeLitros, setQuantidadeLitros] = useState('');
  const [postoSelecionado, setPostoSelecionado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const tiposCombustivel = [
    { id: 'gasolina_comum', label: 'Gasolina Comum', precoReferencia: 5.89 },
    { id: 'diesel_s10', label: 'Diesel S10 Náutico', precoReferencia: 6.25 },
    { id: 'gasolina_aditivada', label: 'Gasolina Aditivada', precoReferencia: 6.09 },
  ];

  const postosDisponiveis = [
    { id: 'posto-1', nome: 'Posto Náutico Imperial', cidade: 'Santos - SP' },
    { id: 'posto-2', nome: 'Auto Posto Real Center', cidade: 'Guarulhos - SP' },
    { id: 'posto-3', nome: 'Marina & Abastecimento Oceano Azul', cidade: 'São Sebastião - SP' },
  ];

  const comb = tiposCombustivel.find((c) => c.id === combustivelSelecionado);
  const litrosNum = parseFloat(quantidadeLitros) || 0;
  const totalEstimado = (litrosNum * (comb?.precoReferencia || 0)).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!litrosNum || litrosNum <= 0) return;
    setSucesso(true);
    setTimeout(() => {
      setSucesso(false);
    }, 4000);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Solicitação de Abastecimento
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecione o tipo de combustível, a quantidade necessária e o posto credenciado
          </p>
        </div>

        {sucesso && (
          <div
            className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm"
            role="status"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Pedido registrado com sucesso!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                A solicitação foi enviada para validação e despacho pelo posto homologado.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção do Tipo de Combustível */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                1. Tipo de Combustível
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tiposCombustivel.map((tipo) => {
                  const isSelected = combustivelSelecionado === tipo.id;
                  return (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => setCombustivelSelecionado(tipo.id)}
                      className={`flex flex-col items-start p-4 rounded-lg border text-left min-h-[44px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 text-gray-900'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="font-semibold text-sm">{tipo.label}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        Ref: R$ {tipo.precoReferencia.toFixed(2)} / L
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Posto Homologado */}
            <div className="space-y-1.5">
              <label
                htmlFor="posto"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                2. Posto Credenciado
              </label>
              <div className="relative">
                <select
                  id="posto"
                  value={postoSelecionado}
                  onChange={(e) => setPostoSelecionado(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                >
                  <option value="" disabled>
                    Selecione um posto fornecedor...
                  </option>
                  {postosDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {p.cidade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantidade em Litros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="litros"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  3. Quantidade (Litros)
                </label>
                <div className="relative">
                  <input
                    id="litros"
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={quantidadeLitros}
                    onChange={(e) => setQuantidadeLitros(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Total Estimado */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Valor Estimado
                </label>
                <div className="px-4 py-2.5 min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-gray-500">Estimativa</span>
                  <span className="text-base font-bold text-gray-900">
                    R$ {totalEstimado}
                  </span>
                </div>
              </div>
            </div>

            {/* Observações / Local de Encontro */}
            <div className="space-y-1.5">
              <label
                htmlFor="obs"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                4. Observações de Despacho
              </label>
              <textarea
                id="obs"
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Embarcação no píer norte, vaga 14. Abastecimento preferencialmente pela manhã."
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
              />
            </div>

            {/* Botão de Envio */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Confirmar Solicitação de Pedido
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default ComprarCombustivelPage;