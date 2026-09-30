import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export const AdminVinculosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryPostoId = searchParams.get('posto_id');

  const [postos, setPostos] = useState([]);
  const [postoId, setPostoId] = useState(queryPostoId || '');
  const [admins, setAdmins] = useState([]);
  const [gestores, setGestores] = useState([]);
  const [userIdInput, setUserIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGestores, setIsLoadingGestores] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Carrega lista de postos
  useEffect(() => {
    const carregarPostos = async () => {
      try {
        const res = await api.get('/api/v1/stations');
        const list = Array.isArray(res.data) ? res.data : [];
        setPostos(list);
        if (!postoId && list.length > 0) {
          setPostoId(String(list[0].id));
        }
      } catch (err) {
        console.error('Erro ao carregar postos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    carregarPostos();
  }, []);

  // Carrega lista de gestores elegíveis (posto_admin)
  const carregarGestores = async () => {
    setIsLoadingGestores(true);
    try {
      const res = await api.get('/api/v1/users?role=posto_admin');
      const list = Array.isArray(res.data) ? res.data : [];
      setGestores(list);
    } catch (err) {
      console.error('Erro ao carregar lista de gestores:', err);
    } finally {
      setIsLoadingGestores(false);
    }
  };

  useEffect(() => {
    carregarGestores();
  }, []);

  // Carrega administradores vinculados ao posto selecionado
  const carregarAdminsDoPosto = async (id) => {
    if (!id) return;
    setIsLoading(true);
    setMensagemErro('');
    try {
      const res = await api.get(`/api/v1/stations/${id}/admins`);
      setAdmins(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao carregar administradores do posto:', err);
      setMensagemErro('Não foi possível carregar os administradores vinculados a este posto.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postoId) {
      setSearchParams({ posto_id: String(postoId) });
      carregarAdminsDoPosto(postoId);
    }
  }, [postoId]);

  const handleVincular = async (e) => {
    e.preventDefault();
    if (!userIdInput.trim()) return;

    setIsSubmitting(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      await api.post(`/api/v1/stations/${postoId}/admins`, {
        user_id: userIdInput.trim(),
      });

      setMensagemSucesso('Administrador vinculado com sucesso ao posto físico!');
      setTimeout(() => setMensagemSucesso(''), 3500);
      setUserIdInput('');
      await carregarAdminsDoPosto(postoId);
    } catch (err) {
      console.error('Erro ao vincular administrador:', err);
      setMensagemErro(
        err.response?.data?.error || 'Erro ao vincular administrador ao posto. Verifique a seleção.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const postoSelecionado = postos.find((p) => String(p.id) === String(postoId));

  return (
    <AppLayout>
      <div className="w-full space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/postos"
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Voltar aos postos"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                Vínculos de Postos
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Associe contas de gestores homologados às unidades físicas operacionais da rede NAVROTAS
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Link
              to="/admin/usuarios"
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Gestão de Usuários & Funções</span>
            </Link>
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

        {/* Seleção do Posto */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Selecione o Posto Físico
            </label>
            <select
              value={postoId}
              onChange={(e) => setPostoId(e.target.value)}
              className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              {postos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome_fantasia} — CNPJ: {p.cnpj}
                </option>
              ))}
            </select>
          </div>

          {postoSelecionado && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">Endereço: </span>
                <span>{postoSelecionado.endereco}</span>
              </div>
              <span className="font-mono text-gray-400">ID Posto: #{postoSelecionado.id}</span>
            </div>
          )}
        </div>

        {/* Formulário de Vinculação com Seleção de Gestores */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Vincular Administrador de Posto</span>
            </h2>
            <Link
              to="/admin/usuarios"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gerenciar Usuários & Atribuir Funções</span>
            </Link>
          </div>

          <form onSubmit={handleVincular} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="user_id"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Selecione o Gestor de Posto
              </label>

              {isLoadingGestores ? (
                <div className="flex items-center gap-2 p-3 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Carregando lista de gestores habilitados...</span>
                </div>
              ) : gestores.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Nenhum usuário com papel de Administrador de Posto (posto_admin) encontrado</span>
                  </div>
                  <p className="text-amber-700">
                    Para vincular um gestor a este posto, acesse a Gestão de Usuários e atribua o papel <strong>Administrador de Posto</strong> à conta desejada.
                  </p>
                  <div>
                    <Link
                      to="/admin/usuarios"
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline hover:text-amber-950"
                    >
                      <span>Ir para Gestão de Usuários e Funções</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <select
                  id="user_id"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">Selecione um gestor na lista...</option>
                  {gestores.map((g) => {
                    const isAlreadyLinked = admins.some((a) => a.user_id === g.id);
                    return (
                      <option key={g.id} value={g.id} disabled={isAlreadyLinked}>
                        {g.nome || 'Sem Nome'} — {g.email} {isAlreadyLinked ? '(Já Vinculado a este Posto)' : ''}
                      </option>
                    );
                  })}
                </select>
              )}

              <p className="text-[11px] text-gray-500">
                A lista exibe apenas usuários que possuem a permissão institucional <code className="text-blue-700 font-mono">posto_admin</code>.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !userIdInput.trim() || gestores.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vinculando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Conceder Acesso ao Posto</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Administradores Atuais */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900">
            Administradores Atribuídos ao Posto ({admins.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Gestor de Posto</th>
                  <th className="py-3 px-4">Data de Vinculação</th>
                  <th className="py-3 px-4 text-right">Permissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <span>Verificando administradores vinculados...</span>
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 text-xs">
                      Nenhum administrador local vinculado a este posto até o momento.
                    </td>
                  </tr>
                ) : (
                  admins.map((adm) => {
                    const matchedGestor = gestores.find((g) => g.id === adm.user_id);
                    const gestorNome = adm.usuario?.nome || matchedGestor?.nome || 'Gestor Vinculado';
                    const gestorEmail = adm.usuario?.email || matchedGestor?.email || adm.user_id;

                    return (
                      <tr key={adm.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-gray-900">{gestorNome}</div>
                          <div className="text-gray-500 text-[11px] font-mono">{gestorEmail}</div>
                          <div className="text-gray-400 text-[10px] font-mono">UUID: {adm.user_id}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {adm.criado_em ? new Date(adm.criado_em).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Autorizado
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminVinculosPage;
