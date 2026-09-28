import React, { useState } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';

export const EnderecosPage = () => {
  const [enderecos, setEnderecos] = useState([
    {
      id: 1,
      apelido: 'Marina Principal (Base Náutica)',
      responsavel: 'Comandante Carlos',
      telefone: '(11) 98765-4321',
      cep: '05210-001',
      rua: 'Avenida Beira Mar',
      numero: '450',
      complemento: 'Píer Sul, Vaga 12',
    },
  ]);

  const [novoEndereco, setNovoEndereco] = useState({
    apelido: '',
    responsavel: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
  });

  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const handleChange = (e) => {
    setNovoEndereco({ ...novoEndereco, [e.target.name]: e.target.value });
  };

  const handleAdicionar = (e) => {
    e.preventDefault();
    if (!novoEndereco.apelido || !novoEndereco.rua || !novoEndereco.numero) return;

    setEnderecos([
      ...enderecos,
      {
        id: Date.now(),
        ...novoEndereco,
      },
    ]);

    setNovoEndereco({
      apelido: '',
      responsavel: '',
      telefone: '',
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
    });

    setMensagemSucesso('Ponto de entrega adicionado com sucesso!');
    setTimeout(() => setMensagemSucesso(''), 3000);
  };

  const handleRemover = (id) => {
    setEnderecos(enderecos.filter((end) => end.id !== id));
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Pontos de Entrega Homologados
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre píeres, atracadouros, marinas e endereços terrestres para recebimento de combustível
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

        {/* Formulário de Novo Endereço */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Cadastrar Novo Ponto de Entrega
          </h2>

          <form onSubmit={handleAdicionar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label
                  htmlFor="apelido"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Identificação / Apelido
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
                  htmlFor="responsavel"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Responsável no Local
                </label>
                <input
                  id="responsavel"
                  name="responsavel"
                  type="text"
                  value={novoEndereco.responsavel}
                  onChange={handleChange}
                  placeholder="Ex: Mestre Carlos"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="telefone"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Telefone de Contato
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={novoEndereco.telefone}
                  onChange={handleChange}
                  placeholder="(11) 98765-4321"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label
                  htmlFor="cep"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  CEP
                </label>
                <input
                  id="cep"
                  name="cep"
                  type="text"
                  value={novoEndereco.cep}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor="rua"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Logradouro / Canal
                </label>
                <input
                  id="rua"
                  name="rua"
                  type="text"
                  required
                  value={novoEndereco.rua}
                  onChange={handleChange}
                  placeholder="Avenida / Rua / Canal Marítimo"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label
                  htmlFor="numero"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Número
                </label>
                <input
                  id="numero"
                  name="numero"
                  type="text"
                  required
                  value={novoEndereco.numero}
                  onChange={handleChange}
                  placeholder="Nº"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="complemento"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Complemento / Referência Náutica
              </label>
              <input
                id="complemento"
                name="complemento"
                type="text"
                value={novoEndereco.complemento}
                onChange={handleChange}
                placeholder="Ex: Próximo à balsa, canal 2, poita de atracação nº 8"
                className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
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
            Pontos de Entrega Salvos ({enderecos.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Local</th>
                  <th className="py-3 px-4">Endereço Completo</th>
                  <th className="py-3 px-4">Responsável & Contato</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enderecos.map((end) => (
                  <tr key={end.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {end.apelido}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {end.rua}, {end.numero}
                      {end.complemento ? ` (${end.complemento})` : ''} — CEP: {end.cep}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {end.responsavel || '—'} {end.telefone ? `| ${end.telefone}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemover(end.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
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