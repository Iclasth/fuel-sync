import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Fuel,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  Save,
  Plus,
  XCircle,
  Building2,
  TrendingUp,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';

export const PostoCatalogoPage = () => {
  const { user } = useAuth();

  const [postos, setPostos] = useState([]);
  const [postoId, setPostoId] = useState('1');
  const [combustiveis, setCombustiveis] = useState([]);
  const [catalogoGlobal, setCatalogoGlobal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [historicoCombustivel, setHistoricoCombustivel] = useState(null);
  const [historicoLogs, setHistoricoLogs] = useState([]);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);

  const [novoCombustivel, setNovoCombustivel] = useState({
    combustivel_id: '',
    preco_litro: '',
    estoque_litros: '5000',
    disponivel: true,
  });

  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Carrega lista de postos e catálogo global
  useEffect(() => {
    const carregarPostosECatalogo = async () => {
      try {
        const [postosRes, catRes] = await Promise.allSettled([
          api.get('/api/v1/stations'),
          api.get('/api/v1/catalog/fuels'),
        ]);

        if (postosRes.status === 'fulfilled' && Array.isArray(postosRes.value.data)) {
          setPostos(postosRes.value.data);
          if (postosRes.value.data.length > 0) {
            setPostoId(String(postosRes.value.data[0].id));
          }
        }

        if (catRes.status === 'fulfilled' && Array.isArray(catRes.value.data)) {
          setCatalogoGlobal(catRes.value.data);
          if (catRes.value.data.length > 0) {
            setNovoCombustivel((prev) => ({
              ...prev,
              combustivel_id: String(catRes.value.data[0].id),
            }));
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar postos:', err);
      }
    };

    carregarPostosECatalogo();
  }, []);

  // Carrega combustíveis do posto selecionado
  const carregarCombustiveisDoPosto = async () => {
    if (!postoId) return;
    setIsLoading(true);
    setMensagemErro('');
    try {
      const res = await api.get(`/api/v1/stations/${postoId}/fuels`);
      const list = Array.isArray(res.data) ? res.data : [];
      setCombustiveis(
        list.map((c) => ({
          ...c,
          preco_litro: Number(c.preco_litro),
          estoque_litros: Number(c.estoque_litros || 0),
          disponivel: c.disponivel !== false,
        }))
      );
    } catch (err) {
      console.error('Erro ao buscar combustíveis do posto:', err);
      setMensagemErro('Não foi possível carregar os preços do posto selecionado.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarCombustiveisDoPosto();
  }, [postoId]);

  const handleFieldChange = (index, field, value) => {
    setCombustiveis((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'disponivel' ? Boolean(value) : value,
      };
      return updated;
    });
  };

  const handleSalvarPreco = async (combustivel) => {
    setIsSaving(true);
    setMensagemSucesso('');
    setMensagemErro('');

    const precoNum = parseFloat(combustivel.preco_litro);
    if (isNaN(precoNum) || precoNum <= 0) {
      setMensagemErro('O preço por litro deve ser um valor numérico positivo.');
      setIsSaving(false);
      return;
    }

    try {
      const cId = combustivel.combustivel_id || combustivel.id;
      await api.put(`/api/v1/stations/${postoId}/fuels/${cId}`, {
        preco_litro: precoNum,
        estoque_litros: Number(combustivel.estoque_litros),
        disponivel: combustivel.disponivel,
      });

      setMensagemSucesso(`Preço do combustível atualizado para R$ ${precoNum.toFixed(3)}/L!`);
      setTimeout(() => setMensagemSucesso(''), 3500);
      await carregarCombustiveisDoPosto();
    } catch (err) {
      console.error('Erro ao atualizar preço:', err);
      setMensagemErro(err.response?.data?.error || 'Erro ao salvar reajuste de preço.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAbrirHistorico = async (combustivel) => {
    setHistoricoCombustivel(combustivel);
    setIsLoadingHistorico(true);
    setHistoricoLogs([]);
    try {
      const cId = combustivel.combustivel_id || combustivel.id;
      const res = await api.get(`/api/v1/stations/${postoId}/fuels/${cId}/history`);
      setHistoricoLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao buscar histórico de preços:', err);
    } finally {
      setIsLoadingHistorico(false);
    }
  };

  const handleCadastrarNovo = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMensagemSucesso('');
    setMensagemErro('');

    const preco = parseFloat(novoCombustivel.preco_litro);
    if (isNaN(preco) || preco <= 0) {
      setMensagemErro('Informe um preço por litro válido.');
      setIsSaving(false);
      return;
    }

    try {
      await api.post(`/api/v1/stations/${postoId}/fuels`, {
        combustivel_id: Number(novoCombustivel.combustivel_id),
        preco_litro: preco,
        estoque_litros: Number(novoCombustivel.estoque_litros),
        disponivel: Boolean(novoCombustivel.disponivel),
      });

      setMensagemSucesso('Combustível adicionado com sucesso ao catálogo do posto!');
      setTimeout(() => setMensagemSucesso(''), 3500);
      setModalNovoAberto(false);
      setNovoCombustivel((prev) => ({ ...prev, preco_litro: '' }));
      await carregarCombustiveisDoPosto();
    } catch (err) {
      console.error('Erro ao adicionar combustível:', err);
      setMensagemErro(err.response?.data?.error || 'Erro ao cadastrar combustível no posto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Gestão de Preços & Catálogo do Posto
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Defina as tarifas vigentes, controle a disponibilidade de bomba e consulte o histórico auditado
            </p>
          </div>

          <div className="flex items-center gap-3">
            {postos.length > 1 && (
              <select
                value={postoId}
                onChange={(e) => setPostoId(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-600"
              >
                {postos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_fantasia || p.razao_social}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setModalNovoAberto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Combustível</span>
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

        {/* Tabela de Preços */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="py-3 px-4">Combustível</th>
                  <th className="py-3 px-4">Preço por Litro (R$)</th>
                  <th className="py-3 px-4">Estoque Atual (Litros)</th>
                  <th className="py-3 px-4">Disponibilidade</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <span>Carregando catálogo tarifário do posto...</span>
                    </td>
                  </tr>
                ) : combustiveis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      Nenhum combustível cadastrado para este posto. Clique em "Adicionar Combustível".
                    </td>
                  </tr>
                ) : (
                  combustiveis.map((comb, index) => {
                    const nome = comb.combustiveis?.nome || `Combustível #${comb.combustivel_id || comb.id}`;
                    return (
                      <tr key={comb.id || index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <Fuel className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{nome}</span>
                          </div>
                          <span className="text-[11px] text-gray-400 font-normal">
                            ID: {comb.combustivel_id || comb.id}
                          </span>
                        </td>

                        {/* Input Preço por Litro */}
                        <td className="py-3 px-4">
                          <div className="relative w-36">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs text-gray-400 font-mono">
                              R$
                            </div>
                            <input
                              type="number"
                              step="0.001"
                              min="0.01"
                              value={comb.preco_litro}
                              onChange={(e) =>
                                handleFieldChange(index, 'preco_litro', e.target.value)
                              }
                              className="w-full pl-8 pr-2 py-1.5 min-h-[38px] bg-white border border-gray-300 rounded font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                            />
                          </div>
                        </td>

                        {/* Input Estoque */}
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={comb.estoque_litros}
                            onChange={(e) =>
                              handleFieldChange(index, 'estoque_litros', e.target.value)
                            }
                            className="w-32 px-2.5 py-1.5 min-h-[38px] bg-white border border-gray-300 rounded font-mono text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                          />
                        </td>

                        {/* Toggle Disponibilidade */}
                        <td className="py-3 px-4">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={comb.disponivel}
                              onChange={(e) =>
                                handleFieldChange(index, 'disponivel', e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span
                              className={`text-xs font-semibold ${
                                comb.disponivel ? 'text-emerald-700' : 'text-gray-400'
                              }`}
                            >
                              {comb.disponivel ? 'Ativo' : 'Indisponível'}
                            </span>
                          </label>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSalvarPreco(comb)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Salvar</span>
                            </button>

                            <button
                              onClick={() => handleAbrirHistorico(comb)}
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Histórico de Reajustes (Trigger Audit)"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Histórico de Reajustes */}
        {historicoCombustivel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Histórico de Auditoria de Preço
                  </h3>
                </div>
                <button
                  onClick={() => setHistoricoCombustivel(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Registros gravados atomicamente pela Trigger PostgreSQL{' '}
                <code className="text-blue-700 font-mono">trg_audit_preco_combustivel</code>:
              </p>

              {isLoadingHistorico ? (
                <div className="py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <span>Consultando auditoria do banco...</span>
                </div>
              ) : historicoLogs.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs">
                  Nenhum reajuste tarifário registrado para este combustível até o momento.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <th className="p-2.5">Data/Hora</th>
                        <th className="p-2.5 text-right">Preço Anterior</th>
                        <th className="p-2.5 text-right">Preço Novo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historicoLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="p-2.5 text-gray-600">
                            {log.alterado_em ? new Date(log.alterado_em).toLocaleString('pt-BR') : '—'}
                          </td>
                          <td className="p-2.5 text-right font-mono text-gray-500 line-through">
                            R$ {Number(log.preco_anterior || 0).toFixed(3)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-blue-600">
                            R$ {Number(log.preco_novo).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setHistoricoCombustivel(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cadastrar Novo Combustível no Posto */}
        {modalNovoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  Adicionar Combustível ao Posto
                </h3>
                <button
                  onClick={() => setModalNovoAberto(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCadastrarNovo} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Combustível Homologado
                  </label>
                  <select
                    value={novoCombustivel.combustivel_id}
                    onChange={(e) =>
                      setNovoCombustivel({ ...novoCombustivel, combustivel_id: e.target.value })
                    }
                    className="w-full px-3 py-2 min-h-[40px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  >
                    {catalogoGlobal.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome} ({cat.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Preço Inicial por Litro (R$)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.01"
                    required
                    placeholder="Ex: 5.890"
                    value={novoCombustivel.preco_litro}
                    onChange={(e) =>
                      setNovoCombustivel({ ...novoCombustivel, preco_litro: e.target.value })
                    }
                    className="w-full px-3 py-2 min-h-[40px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Estoque Inicial (Litros)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={novoCombustivel.estoque_litros}
                    onChange={(e) =>
                      setNovoCombustivel({ ...novoCombustivel, estoque_litros: e.target.value })
                    }
                    className="w-full px-3 py-2 min-h-[40px] bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
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
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {isSaving ? 'Salvando...' : 'Cadastrar Combustível'}
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

export default PostoCatalogoPage;
