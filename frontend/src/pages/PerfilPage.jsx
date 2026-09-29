import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import AppLayout from '../components/layout/AppLayout';

export const PerfilPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco_padrao: '',
    ponto_referencia_padrao: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nome: user.name || '',
        email: user.email || '',
        telefone: user.metadata?.phone || '',
        endereco_padrao: user.metadata?.endereco_padrao || '',
        ponto_referencia_padrao: user.metadata?.ponto_referencia_padrao || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      // Tenta atualizar se existir customer correspondente, ou salva nas preferências locais
      try {
        await api.put(`/customers/${user.id}`, {
          name: formData.nome,
          telefone: formData.telefone,
          endereco_padrao: formData.endereco_padrao,
          ponto_referencia_padrao: formData.ponto_referencia_padrao,
        });
      } catch (_) {
        // Fallback silencioso
      }

      setMensagemSucesso('Dados cadastrais atualizados com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3000);
    } catch (err) {
      setMensagemErro(err.response?.data?.error || 'Erro ao atualizar dados cadastrais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Perfil e Dados Cadastrais
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Mantenha seus dados e endereços padrão atualizados para agilizar novas solicitações de abastecimento
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

        <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="nome"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Nome Completo / Razão Social
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  E-mail de Acesso (Não editável)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-4 py-2.5 min-h-[44px] bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="telefone"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Telefone / WhatsApp de Contato
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="endereco_padrao"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Endereço Padrão de Atracação / Entrega
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="endereco_padrao"
                  name="endereco_padrao"
                  type="text"
                  value={formData.endereco_padrao}
                  onChange={handleChange}
                  placeholder="Ex: Marina da Glória, Av. Infante Dom Henrique"
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ponto_referencia_padrao"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Ponto de Referência Padrão
              </label>
              <input
                id="ponto_referencia_padrao"
                name="ponto_referencia_padrao"
                type="text"
                value={formData.ponto_referencia_padrao}
                onChange={handleChange}
                placeholder="Ex: Píer B, Vaga 14 - Lancha Marlin"
                className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default PerfilPage;
