import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Phone,
  User,
  Shield,
  RefreshCw,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const STATUS_BADGES = {
  DISPONIVEL: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  EM_ROTA: 'bg-blue-50 text-blue-800 border-blue-200',
  INDISPONIVEL: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const PostoEntregadoresPage = () => {
  const [entregadores, setEntregadores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [novoEntregador, setNovoEntregador] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    vehicleDescription: 'Furgão Utilitário com Tanque Homologado',
    licensePlate: '',
  });

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const carregarEntregadores = async () => {
    setIsLoading(true);
    setMensagemErro('');
    try {
      const res = await api.get('/api/v1/couriers');
      setEntregadores(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao carregar entregadores:', err);
      // Fallback
      setEntregadores([
        {
          id: 1,
          nome: 'Carlos Santos (Operador Náutico)',
          cpf: '52998224725',
          telefone: '(11) 98765-4321',
          veiculo_descricao: 'Furgão com Tanque Certificado INMETRO',
          placa: 'BRA2E19',
          status: 'DISPONIVEL',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarEntregadores();
  }, []);

  const handleStatusChange = async (courierId, novoStatus) => {
    setIsUpdatingStatus(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      await api.patch(`/api/v1/couriers/${courierId}/status`, { status: novoStatus });
      setMensagemSucesso('Status de disponibilidade atualizado!');
      setTimeout(() => setMensagemSucesso(''), 3000);
      setEntregadores((prev) =>
        prev.map((e) => (e.id === courierId ? { ...e, status: novoStatus } : e))
      );
    } catch (err) {
      console.error('Erro ao atualizar status do entregador:', err);
      setMensagemErro(err.response?.data?.error || 'Erro ao alterar status operacional.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCadastrar = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      await api.post('/api/v1/auth/admin/create-courier', novoEntregador);
      setMensagemSucesso('Entregador credenciado com sucesso no posto!');
      setTimeout(() => setMensagemSucesso(''), 3500);
      setModalNovoAberto(false);
      setNovoEntregador({
        name: '',
        email: '',
        password: '',
        cpf: '',
        phone: '',
        vehicleDescription: 'Furgão Utilitário com Tanque Homologado',
        licensePlate: '',
      });
      await carregarEntregadores();
    } catch (err) {
      console.error('Erro ao criar entregador:', err);
      setMensagemErro(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Erro ao credenciar entregador. Verifique os dados fornecidos.'
      );
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
              Equipe de Entregadores & Frota
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie a escala de operadores autorizados para abastecimento fracionado e transporte de combustíveis
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarEntregadores}
              disabled={isLoading}
              className="p-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setModalNovoAberto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Credenciar Novo Entregador</span>
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

        {/* Tabela de Entregadores */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Operador / CPF</th>
                  <th className="py-3 px-4">Veículo & Placa</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Status Atual</th>
                  <th className="py-3 px-4 text-right">Alterar Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <span>Carregando frota de entregadores...</span>
                    </td>
                  </tr>
                ) : entregadores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      Nenhum entregador cadastrado para este posto. Clique em "Credenciar Novo Entregador".
                    </td>
                  </tr>
                ) : (
                  entregadores.map((ent) => {
                    const badgeClass = STATUS_BADGES[ent.status] || 'bg-gray-100 text-gray-800';
                    return (
                      <tr key={ent.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div>{ent.nome}</div>
                          <span className="text-xs text-gray-400 font-normal">
                            CPF: {ent.cpf ? ent.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-700">
                          <div className="font-medium text-gray-900">{ent.veiculo_descricao}</div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 font-mono text-[11px] font-bold rounded bg-gray-100 text-gray-800 border border-gray-200 uppercase">
                            {ent.placa}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600">
                          {ent.telefone}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClass}`}
                          >
                            {ent.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={ent.status}
                            disabled={isUpdatingStatus}
                            onChange={(e) => handleStatusChange(ent.id, e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="DISPONIVEL">Disponível</option>
                            <option value="EM_ROTA">Em Rota</option>
                            <option value="INDISPONIVEL">Indisponível</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Cadastrar Novo Entregador */}
        {modalNovoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>Credenciar Entregador no Posto</span>
                </h3>
                <button
                  onClick={() => setModalNovoAberto(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCadastrar} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                    Nome Completo do Operador
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={novoEntregador.name}
                    onChange={(e) => setNovoEntregador({ ...novoEntregador, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="operador@posto.com"
                      value={novoEntregador.email}
                      onChange={(e) => setNovoEntregador({ ...novoEntregador, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      Senha Provisória
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 8 dígitos"
                      value={novoEntregador.password}
                      onChange={(e) => setNovoEntregador({ ...novoEntregador, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      CPF
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="52998224725"
                      value={novoEntregador.cpf}
                      onChange={(e) => setNovoEntregador({ ...novoEntregador, cpf: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                      Telefone / Rádio
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 98765-4321"
                      value={novoEntregador.phone}
                      onChange={(e) => setNovoEntregador({ ...novoEntregador, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                    Descrição do Veículo Homologado
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Furgão Master com Tanques Certificados"
                    value={novoEntregador.vehicleDescription}
                    onChange={(e) => setNovoEntregador({ ...novoEntregador, vehicleDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 uppercase tracking-wider block">
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRA2E19"
                    value={novoEntregador.licensePlate}
                    onChange={(e) => setNovoEntregador({ ...novoEntregador, licensePlate: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-mono uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalNovoAberto(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Credenciando...' : 'Credenciar Entregador'}
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

export default PostoEntregadoresPage;
