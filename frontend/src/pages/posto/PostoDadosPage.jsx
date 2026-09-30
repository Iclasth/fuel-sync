import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Phone,
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Fuel,
  Layers,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';

export const PostoDadosPage = () => {
  const { user } = useAuth();

  const [station, setStation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [semPostoVinculado, setSemPostoVinculado] = useState(false);

  const [formData, setFormData] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    endereco: '',
    latitude: -22.9208,
    longitude: -43.1729,
    tempo_medio_preparo_minutos: 15,
    ativo: true,
  });

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const carregarDadosPosto = async () => {
    setIsLoading(true);
    setMensagemErro('');
    setSemPostoVinculado(false);

    try {
      const res = await api.get('/api/v1/stations/me');
      const data = res.data;
      setStation(data);
      setFormData({
        nome_fantasia: data.nome_fantasia || '',
        razao_social: data.razao_social || '',
        cnpj: data.cnpj || '',
        telefone: data.telefone || '',
        endereco: data.endereco || '',
        latitude: data.latitude !== undefined ? Number(data.latitude) : -22.9208,
        longitude: data.longitude !== undefined ? Number(data.longitude) : -43.1729,
        tempo_medio_preparo_minutos:
          data.tempo_medio_preparo_minutos !== undefined
            ? Number(data.tempo_medio_preparo_minutos)
            : 15,
        ativo: data.ativo !== undefined ? Boolean(data.ativo) : true,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setSemPostoVinculado(true);
      } else {
        setMensagemErro(
          err.response?.data?.error || 'Não foi possível carregar os dados do posto.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosPosto();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'latitude' || name === 'longitude' || name === 'tempo_medio_preparo_minutos'
          ? parseFloat(value) || value
          : value,
    }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!station?.id) return;

    setIsSaving(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      const payload = {
        nome_fantasia: String(formData.nome_fantasia).trim(),
        razao_social: formData.razao_social ? String(formData.razao_social).trim() : null,
        telefone: String(formData.telefone).trim(),
        endereco: String(formData.endereco).trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        tempo_medio_preparo_minutos: Number(formData.tempo_medio_preparo_minutos) || 0,
        ativo: Boolean(formData.ativo),
      };

      const res = await api.put(`/api/v1/stations/${station.id}`, payload);
      setStation((prev) => ({ ...prev, ...res.data }));
      setMensagemSucesso('Informações do posto atualizadas com sucesso no banco de dados!');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (err) {
      setMensagemErro(
        err.response?.data?.error || 'Erro ao salvar alterações do posto. Verifique os campos.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6 font-sans">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Building2 className="w-3.5 h-3.5" />
                Administração da Unidade
              </span>
              {station && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                    station.ativo
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {station.ativo ? 'Em Operação' : 'Desativado / Em Manutenção'}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              {station?.nome_fantasia || 'Dados do Posto'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie informações cadastrais, canais de contato, coordenadas de entrega e parâmetros logísticos da sua unidade.
            </p>
          </div>

          {station && (
            <div className="flex items-center gap-2">
              <Link
                to="/posto/precos"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
              >
                <Fuel className="w-3.5 h-3.5 text-blue-600" />
                <span>Tabela Tarifária</span>
              </Link>
              <Link
                to="/posto/pedidos"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Fila de Pedidos</span>
              </Link>
            </div>
          )}
        </div>

        {/* Alertas de Feedback */}
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

        {/* Estado de Carregamento */}
        {isLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Carregando dados da sua unidade...</p>
          </div>
        )}

        {/* Estado: Sem posto vinculado */}
        {!isLoading && semPostoVinculado && (
          <div className="bg-white border border-amber-200 rounded-lg p-8 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Nenhum Posto Vinculado</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Seu perfil de <strong>Administrador de Posto</strong> ainda não foi associado a uma unidade física homologada no sistema NAVROTAS.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Entre em contato com um <strong>Administrador Geral</strong> para realizar a vinculação do seu usuário na tela de Postos & Gestores.
            </p>
          </div>
        )}

        {/* Formulário de Edição */}
        {!isLoading && !semPostoVinculado && station && (
          <form onSubmit={handleSalvar} className="space-y-6">
            {/* Card 1: Identificação Cadastral */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Identificação Jurídica & Comercial</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="nome_fantasia" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nome Fantasia *
                  </label>
                  <input
                    id="nome_fantasia"
                    name="nome_fantasia"
                    type="text"
                    required
                    value={formData.nome_fantasia}
                    onChange={handleChange}
                    placeholder="Ex: Auto Posto Náutico Imperial"
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="razao_social" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Razão Social
                  </label>
                  <input
                    id="razao_social"
                    name="razao_social"
                    type="text"
                    value={formData.razao_social}
                    onChange={handleChange}
                    placeholder="Ex: Marina & Distribuidora Imperial LTDA"
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="cnpj" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    CNPJ Registrado
                  </label>
                  <input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    readOnly
                    value={formData.cnpj}
                    className="w-full px-4 py-2.5 min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed font-mono"
                    title="O CNPJ é a chave canônica fiscal do posto e só pode ser alterado pela Administração Geral."
                  />
                  <p className="text-[11px] text-gray-400">Chave fiscal canônica vinculada à concessão da base.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="telefone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>Telefone de Atendimento *</span>
                  </label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="text"
                    required
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(21) 3333-4444"
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Parâmetros Logísticos & Operacionais */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Parâmetros de Despacho & Operação</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label htmlFor="tempo_medio_preparo_minutos" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tempo Médio de Preparo (Minutos) *
                  </label>
                  <input
                    id="tempo_medio_preparo_minutos"
                    name="tempo_medio_preparo_minutos"
                    type="number"
                    min="0"
                    max="180"
                    required
                    value={formData.tempo_medio_preparo_minutos}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-gray-400">
                    Utilizado no cálculo do prazo de entrega para clientes náuticos e terrestres.
                  </p>
                </div>

                <div className="space-y-1.5 sm:pt-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status Operacional da Base
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <input
                      name="ativo"
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formData.ativo ? 'Base Ativa para Atendimento' : 'Base Temporariamente Indisponível'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {formData.ativo
                          ? 'Seu posto está visível no catálogo e apto a receber novos pedidos.'
                          : 'Seu posto não receberá novos pedidos enquanto estiver desativado.'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3: Localização Geográfica */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Localização de Acesso & Atracação</span>
                </h2>
                {formData.latitude && formData.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>Ver no Mapa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="endereco" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Endereço Completo de Acesso *
                </label>
                <input
                  id="endereco"
                  name="endereco"
                  type="text"
                  required
                  value={formData.endereco}
                  onChange={handleChange}
                  placeholder="Av. Infante Dom Henrique, s/n - Glória, Rio de Janeiro - RJ"
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="latitude" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-gray-400" />
                    <span>Latitude Decimal *</span>
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="longitude" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-gray-400" />
                    <span>Longitude Decimal *</span>
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Botão de Salvar Alterações */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Alterações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Dados do Posto</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default PostoDadosPage;
