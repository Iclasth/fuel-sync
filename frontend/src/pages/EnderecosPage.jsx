import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import useAuth from '../hooks/useAuth';

const TIPOS_LOCAL = [
  { value: 'MARINA', label: 'Marina / Píer Náutico' },
  { value: 'CONDOMINIO', label: 'Condomínio Fechado' },
  { value: 'CHACARA', label: 'Chácara / Área Rural' },
  { value: 'RODOVIA', label: 'Ponto Rodoviário' },
  { value: 'RESIDENCIA', label: 'Residência' },
  { value: 'OUTRO', label: 'Outro Local Homologado' },
];

export const EnderecosPage = () => {
  const { user } = useAuth();
  const storageKey = `fuel_sync_delivery_locations_${user?.id || 'default'}`;

  const defaultLocations = [
    {
      id: 'loc-1',
      apelido: 'Marina da Glória (Píer Sul)',
      tipo_local: 'MARINA',
      endereco: 'Av. Infante Dom Henrique, s/n - Glória, Rio de Janeiro - RJ',
      ponto_referencia: 'Píer Sul, Poita 14 - Lancha Marlin',
      latitude: -22.9205,
      longitude: -43.1729,
    },
    {
      id: 'loc-2',
      apelido: 'Base Náutica Santos (Canal 3)',
      tipo_local: 'MARINA',
      endereco: 'Avenida Almirante Saldanha da Gama, 80 - Ponta da Praia, Santos - SP',
      ponto_referencia: 'Trapiche B, Vaga 08',
      latitude: -23.9876,
      longitude: -46.3021,
    },
  ];

  const [enderecos, setEnderecos] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {
      // Fallback
    }
    return defaultLocations;
  });

  const [novoEndereco, setNovoEndereco] = useState({
    apelido: '',
    tipo_local: 'MARINA',
    endereco: '',
    ponto_referencia: '',
    latitude: -23.5505,
    longitude: -46.6333,
  });

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(enderecos));
    } catch (_) {
      // Ignorar falhas de quota
    }
  }, [enderecos, storageKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoEndereco((prev) => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) || value : value,
    }));
  };

  const handleAdicionar = (e) => {
    e.preventDefault();
    setMensagemSucesso('');
    setMensagemErro('');

    if (!novoEndereco.apelido.trim()) {
      setMensagemErro('Informe um apelido ou identificação para o ponto de entrega.');
      return;
    }
    if (!novoEndereco.endereco.trim()) {
      setMensagemErro('Informe o endereço completo.');
      return;
    }

    const lat = Number(novoEndereco.latitude);
    const lon = Number(novoEndereco.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setMensagemErro('A latitude deve ser um número decimal válido entre -90 e 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setMensagemErro('A longitude deve ser um número decimal válido entre -180 e 180.');
      return;
    }

    const novoItem = {
      id: `loc-${Date.now()}`,
      apelido: novoEndereco.apelido.trim(),
      tipo_local: novoEndereco.tipo_local,
      endereco: novoEndereco.endereco.trim(),
      ponto_referencia: novoEndereco.ponto_referencia.trim() || null,
      latitude: lat,
      longitude: lon,
    };

    setEnderecos((prev) => [novoItem, ...prev]);
    setNovoEndereco({
      apelido: '',
      tipo_local: 'MARINA',
      endereco: '',
      ponto_referencia: '',
      latitude: -23.5505,
      longitude: -46.6333,
    });

    setMensagemSucesso('Ponto de abastecimento salvo com sucesso no perfil!');
    setTimeout(() => setMensagemSucesso(''), 3500);
  };

  const handleRemover = (id) => {
    setEnderecos((prev) => prev.filter((item) => item.id !== id));
    setMensagemSucesso('Ponto de entrega removido.');
    setTimeout(() => setMensagemSucesso(''), 3000);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Pontos de Entrega Homologados
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre píeres, atracadouros, marinas e endereços terrestres para recebimento rápido de combustível
          </p>
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

        {/* Formulário de Novo Endereço */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Cadastrar Novo Local de Abastecimento</span>
          </h2>

          <form onSubmit={handleAdicionar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="apelido"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Apelido / Identificação do Local
                </label>
                <input
                  id="apelido"
                  name="apelido"
                  type="text"
                  required
                  value={novoEndereco.apelido}
                  onChange={handleChange}
                  placeholder="Ex: Marina Santos (Píer 4)"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="tipo_local"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Tipo de Local de Entrega
                </label>
                <select
                  id="tipo_local"
                  name="tipo_local"
                  value={novoEndereco.tipo_local}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  {TIPOS_LOCAL.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="endereco"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Endereço Completo de Acesso
              </label>
              <input
                id="endereco"
                name="endereco"
                type="text"
                required
                value={novoEndereco.endereco}
                onChange={handleChange}
                placeholder="Av. Beira Mar, 450 - Ponta da Praia"
                className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ponto_referencia"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Ponto de Referência / Vaga / Atracadouro
              </label>
              <input
                id="ponto_referencia"
                name="ponto_referencia"
                type="text"
                value={novoEndereco.ponto_referencia}
                onChange={handleChange}
                placeholder="Ex: Píer B, Vaga 14, embarcação Marlin Azul"
                className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="latitude"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5 text-gray-400" />
                  <span>Latitude Decimal</span>
                </label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  required
                  value={novoEndereco.latitude}
                  onChange={handleChange}
                  placeholder="-23.987654"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="longitude"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1"
                >
                  <Compass className="w-3.5 h-3.5 text-gray-400" />
                  <span>Longitude Decimal</span>
                </label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  required
                  value={novoEndereco.longitude}
                  onChange={handleChange}
                  placeholder="-46.302145"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Ponto de Entrega</span>
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Endereços Cadastrados */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Locais de Abastecimento Registrados ({enderecos.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Local & Tipo</th>
                  <th className="py-3 px-4">Endereço & Referência</th>
                  <th className="py-3 px-4">Coordenadas</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enderecos.map((end) => (
                  <tr key={end.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div>{end.apelido}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {TIPOS_LOCAL.find((t) => t.value === end.tipo_local)?.label || end.tipo_local}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      <div className="font-medium text-gray-800">{end.endereco}</div>
                      {end.ponto_referencia && (
                        <div className="text-gray-500 mt-0.5">Ref: {end.ponto_referencia}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs font-mono">
                      {Number(end.latitude).toFixed(4)}, {Number(end.longitude).toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemover(end.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        aria-label={`Remover endereço ${end.apelido}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EnderecosPage;