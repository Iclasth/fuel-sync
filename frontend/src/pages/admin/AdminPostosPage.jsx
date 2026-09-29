import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Edit2,
  MapPin,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export const AdminPostosPage = () => {
  const [postos, setPostos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [postoEditando, setPostoEditando] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    endereco: '',
    latitude: -23.5505,
    longitude: -46.6333,
    tempo_medio_preparo_minutos: 15,
  });

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const carregarPostos = async () => {
    setIsLoading(true);
    setMensagemErro('');
    try {
      const res = await api.get('/api/v1/stations');
      setPostos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao listar postos:', err);
      setMensagemErro('Não foi possível carregar a lista de postos homologados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPostos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'latitude' || name === 'longitude' || name === 'tempo_medio_preparo_minutos'
          ? parseFloat(value) || value
          : value,
    }));
  };

  const handleCriarPosto = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      await api.post('/api/v1/stations', {
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        tempo_medio_preparo_minutos: Number(formData.tempo_medio_preparo_minutos) || 15,
      });

      setMensagemSucesso('Posto homologado cadastrado com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3500);
      setModalNovoAberto(false);
      setFormData({
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        telefone: '',
        endereco: '',
        latitude: -23.5505,
        longitude: -46.6333,
        tempo_medio_preparo_minutos: 15,
      });
      await carregarPostos();
    } catch (err) {
      console.error('Erro ao cadastrar posto:', err);
      setMensagemErro(err.response?.data?.error || 'Erro ao cadastrar posto. Verifique os dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbrirEditar = (posto) => {
    setPostoEditando(posto);
    setFormData({
      nome_fantasia: posto.nome_fantasia || '',
      razao_social: posto.razao_social || '',
      cnpj: posto.cnpj || '',
      telefone: posto.telefone || '',
      endereco: posto.endereco || '',
      latitude: Number(posto.latitude) || -23.5505,
      longitude: Number(posto.longitude) || -46.6333,
      tempo_medio_preparo_minutos: Number(posto.tempo_medio_preparo_minutos) || 15,
    });
    setModalEditarAberto(true);
  };

  const handleAtualizarPosto = async (e) => {
    e.preventDefault();
    if (!postoEditando) return;

    setIsSubmitting(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      await api.put(`/api/v1/stations/${postoEditando.id}`, {
        nome_fantasia: formData.nome_fantasia,
        razao_social: formData.razao_social,
        cnpj: formData.cnpj,
        telefone: formData.telefone,
        endereco: formData.endereco,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        tempo_medio_preparo_minutos: Number(formData.tempo_medio_preparo_minutos) || 15,
      });

      setMensagemSucesso('Dados do posto atualizados com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3500);
      setModalEditarAberto(false);
      setPostoEditando(null);
      await carregarPostos();
    } catch (err) {
      console.error('Erro ao atualizar posto:', err);
      setMensagemErro(err.response?.data?.error || 'Erro ao atualizar dados do posto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Gestão Geral de Postos & Unidades Físicas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Controle a homologação de postos terrestres e marítimos, dados fiscais e vínculo com gestores locais
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarPostos}
              disabled={isLoading}
              className="p-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              to="/admin/vinculos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Vínculo de Gestores</span>
            </Link>

            <button
              onClick={() => setModalNovoAberto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Posto Homologado</span>
            </button>
          </div>
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

        {/* Tabela de Postos */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Posto / CNPJ</th>
                  <th className="py-3 px-4">Endereço & Coordenadas</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Tempo Médio</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <span>Carregando postos credenciados...</span>
                    </td>
                  </tr>
                ) : postos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      Nenhum posto cadastrado. Clique em "Novo Posto Homologado".
                    </td>
                  </tr>
                ) : (
                  postos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{p.nome_fantasia}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-normal">
                          CNPJ: {p.cnpj}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-700">
                        <div className="font-medium text-gray-900">{p.endereco}</div>
                        <span className="text-gray-400 font-mono">
                          {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {p.telefone}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-700 font-mono">
                        {p.tempo_medio_preparo_minutos || 15} min
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/vinculos?posto_id=${p.id}`}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Gerenciar Administradores do Posto"
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleAbrirEditar(p)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                            title="Editar Dados do Posto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Cadastro / Edição */}
        {(modalNovoAberto || modalEditarAberto) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>
                    {modalNovoAberto ? 'Cadastrar Posto Homologado' : `Editar Posto #${postoEditando?.id}`}
                  </span>
                </h3>
                <button
                  onClick={() => {
                    setModalNovoAberto(false);
                    setModalEditarAberto(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={modalNovoAberto ? handleCriarPosto : handleAtualizarPosto}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Auto Posto Náutico Imperial"
                      value={formData.nome_fantasia}
                      onChange={handleChange}
                      name="nome_fantasia"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Imperial Derivados de Petróleo LTDA"
                      value={formData.razao_social}
                      onChange={handleChange}
                      name="razao_social"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="45997418000153"
                      value={formData.cnpj}
                      onChange={handleChange}
                      name="cnpj"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(13) 3219-8800"
                      value={formData.telefone}
                      onChange={handleChange}
                      name="telefone"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Av. Portuária, 100 - Bairro do Porto, Santos - SP"
                    value={formData.endereco}
                    onChange={handleChange}
                    name="endereco"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={formData.latitude}
                      onChange={handleChange}
                      name="latitude"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={formData.longitude}
                      onChange={handleChange}
                      name="longitude"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      Preparo (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.tempo_medio_preparo_minutos}
                      onChange={handleChange}
                      name="tempo_medio_preparo_minutos"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setModalNovoAberto(false);
                      setModalEditarAberto(false);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Salvando...'
                      : modalNovoAberto
                      ? 'Homologar Posto'
                      : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminPostosPage;
