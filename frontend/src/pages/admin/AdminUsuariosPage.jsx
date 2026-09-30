import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Building2,
  Truck,
  User,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit2,
  ShieldAlert,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';

export const AdminUsuariosPage = () => {
  const { user: currentUser } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState('TODAS');

  // Estado para alteração de role
  const [modalUsuario, setModalUsuario] = useState(null);
  const [novaRoleSelecionada, setNovaRoleSelecionada] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const carregarUsuarios = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setMensagemErro('');

    try {
      const res = await api.get('/api/v1/users');
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setMensagemErro(
        err.response?.data?.error || 'Não foi possível carregar a lista de usuários da plataforma.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Estatísticas de usuários por papel
  const kpis = useMemo(() => {
    const total = usuarios.length;
    const adminGeral = usuarios.filter((u) => u.role === 'admin_geral').length;
    const postoAdmin = usuarios.filter((u) => u.role === 'posto_admin').length;
    const entregador = usuarios.filter((u) => u.role === 'entregador').length;
    const cliente = usuarios.filter((u) => u.role === 'cliente').length;

    return { total, adminGeral, postoAdmin, entregador, cliente };
  }, [usuarios]);

  // Filtragem reativa
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroRole !== 'TODAS' && u.role !== filtroRole) {
        return false;
      }

      if (termoBusca.trim()) {
        const termo = termoBusca.toLowerCase().trim();
        const nome = (u.nome || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const id = (u.id || '').toLowerCase();
        return nome.includes(termo) || email.includes(termo) || id.includes(termo);
      }

      return true;
    });
  }, [usuarios, filtroRole, termoBusca]);

  const handleAbrirModal = (user) => {
    setModalUsuario(user);
    setNovaRoleSelecionada(user.role);
    setMensagemErro('');
  };

  const handleFecharModal = () => {
    setModalUsuario(null);
    setNovaRoleSelecionada('');
    setIsSubmittingRole(false);
  };

  const handleSalvarRole = async (e) => {
    e.preventDefault();
    if (!modalUsuario || !novaRoleSelecionada) return;

    if (modalUsuario.id === currentUser?.id && novaRoleSelecionada !== 'admin_geral') {
      setMensagemErro('Você não pode remover seu próprio papel de Administrador Geral.');
      return;
    }

    setIsSubmittingRole(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      await api.patch(`/api/v1/users/${modalUsuario.id}/role`, {
        role: novaRoleSelecionada,
      });

      setMensagemSucesso(
        `Papel do usuário ${modalUsuario.nome || modalUsuario.email} atualizado com sucesso para "${novaRoleSelecionada}"!`
      );
      setTimeout(() => setMensagemSucesso(''), 4500);

      // Atualiza estado local imediatamente
      setUsuarios((prev) =>
        prev.map((u) => (u.id === modalUsuario.id ? { ...u, role: novaRoleSelecionada } : u))
      );

      handleFecharModal();
    } catch (err) {
      console.error('Erro ao atualizar papel:', err);
      setMensagemErro(
        err.response?.data?.error || 'Erro ao atualizar o papel do usuário na base de dados.'
      );
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin_geral':
        return {
          label: 'Administrador Geral',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'posto_admin':
        return {
          label: 'Gestor de Posto',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'entregador':
        return {
          label: 'Entregador',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'cliente':
      default:
        return {
          label: 'Cliente',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6 font-sans">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Gestão de Usuários & Papéis
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Governança centralizada de acessos, privilégios e papéis institucionais da plataforma NAVROTAS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => carregarUsuarios(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              title="Recarregar usuários"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
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

        {/* KPIs de Usuários por Role */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total de Usuários
              </span>
              <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">{kpis.total}</span>
              <span className="text-xs text-gray-400">cadastros</span>
            </div>
          </div>

          <div className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">
                Admin Geral
              </span>
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">{kpis.adminGeral}</span>
              <span className="text-xs text-purple-600 font-semibold">governantes</span>
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                Gestores de Posto
              </span>
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">{kpis.postoAdmin}</span>
              <span className="text-xs text-blue-600 font-semibold">posto_admin</span>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Entregadores
              </span>
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">{kpis.entregador}</span>
              <span className="text-xs text-amber-600 font-semibold">em campo</span>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-lg p-4 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Clientes
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">{kpis.cliente}</span>
              <span className="text-xs text-emerald-600 font-semibold">consumidores</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por nome, e-mail ou UUID..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Filtro por Papel (Role) */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={filtroRole}
                onChange={(e) => setFiltroRole(e.target.value)}
                className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="TODAS">Todos os Papéis</option>
                <option value="admin_geral">Administrador Geral</option>
                <option value="posto_admin">Gestor de Posto</option>
                <option value="entregador">Entregador</option>
                <option value="cliente">Cliente </option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">UUID</th>
                  <th className="py-3 px-4">Papel Atual</th>
                  <th className="py-3 px-4">Data de Cadastro</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <span>Carregando usuários da plataforma...</span>
                    </td>
                  </tr>
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 text-xs">
                      Nenhum usuário encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const badge = getRoleBadge(u.role);
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {(u.nome || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                                <span>{u.nome || 'Sem Nome'}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                    Você
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-[11px] font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                          {u.id}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-500 font-mono">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleAbrirModal(u)}
                            disabled={isSelf}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isSelf
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title={isSelf ? 'Você não pode alterar seu próprio papel' : 'Alterar Papel (Role)'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Alterar Papel</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Alteração de Role */}
        {modalUsuario && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Alterar Papel de Acesso
                    </h3>
                    <p className="text-xs text-gray-500">
                      Atualização imediata de permissões no sistema
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Usuário:</span>
                  <span className="font-semibold text-gray-900">{modalUsuario.nome || 'Sem Nome'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">E-mail:</span>
                  <span className="font-mono text-gray-700">{modalUsuario.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Papel Atual:</span>
                  <span className="font-semibold text-blue-700">{modalUsuario.role}</span>
                </div>
              </div>

              <form onSubmit={handleSalvarRole} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Novo Papel (Role)
                  </label>
                  <select
                    value={novaRoleSelecionada}
                    onChange={(e) => setNovaRoleSelecionada(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                  >
                    <option value="cliente">Cliente (cliente)</option>
                    <option value="posto_admin">Gestor de Posto (posto_admin)</option>
                    <option value="entregador">Entregador Homologado (entregador)</option>
                    <option value="admin_geral">Administrador Geral (admin_geral)</option>
                  </select>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    A alteração é refletida imediatamente em perfis_usuarios e autoriza ou restringe o acesso aos módulos protegidos da aplicação.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleFecharModal}
                    disabled={isSubmittingRole}
                    className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRole || novaRoleSelecionada === modalUsuario.role}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {isSubmittingRole ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>Confirmar Alteração</span>
                    )}
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

export default AdminUsuariosPage;
