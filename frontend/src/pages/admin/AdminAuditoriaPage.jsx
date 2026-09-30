import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Fuel,
  Clock,
  User,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

export const AdminAuditoriaPage = () => {
  const [registros, setRegistros] = useState([]);
  const [postos, setPostos] = useState([]);
  const [combustiveis, setCombustiveis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  // Filtros interativos
  const [postoFiltro, setPostoFiltro] = useState('');
  const [combustivelFiltro, setCombustivelFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS'); // TODOS, AUMENTO, REDUCAO, PRIMEIRO_CADASTRO
  const [buscaTexto, setBuscaTexto] = useState('');

  const carregarDadosAuditoria = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErro('');

    try {
      const [auditRes, postosRes, catalogRes] = await Promise.all([
        api.get('/api/v1/stations/audit/price-history'),
        api.get('/api/v1/stations').catch(() => ({ data: [] })),
        api.get('/api/v1/catalog').catch(() => ({ data: [] })),
      ]);

      setRegistros(Array.isArray(auditRes?.data) ? auditRes.data : []);
      setPostos(Array.isArray(postosRes?.data) ? postosRes.data : []);
      setCombustiveis(Array.isArray(catalogRes?.data) ? catalogRes.data : []);
    } catch (err) {
      console.error('Erro ao carregar auditoria de preços:', err);
      setErro('Não foi possível carregar o histórico auditado de alterações de preços.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    carregarDadosAuditoria();
  }, []);

  // Filtragem local reativa
  const registrosFiltrados = useMemo(() => {
    return registros.filter((reg) => {
      // Filtro por Posto
      if (postoFiltro && String(reg.posto_id) !== String(postoFiltro)) {
        return false;
      }

      // Filtro por Combustível
      if (combustivelFiltro && String(reg.combustivel_id) !== String(combustivelFiltro)) {
        return false;
      }

      // Filtro por Tipo de Variação
      const ant = reg.preco_anterior !== null && reg.preco_anterior !== undefined
        ? Number(reg.preco_anterior)
        : null;
      const novo = Number(reg.preco_novo);

      if (tipoFiltro === 'AUMENTO') {
        if (ant === null || novo <= ant) return false;
      } else if (tipoFiltro === 'REDUCAO') {
        if (ant === null || novo >= ant) return false;
      } else if (tipoFiltro === 'PRIMEIRO_CADASTRO') {
        if (ant !== null) return false;
      }

      // Busca Textual
      if (buscaTexto.trim()) {
        const termo = buscaTexto.toLowerCase();
        const nomePosto = reg.posto?.nome_fantasia?.toLowerCase() || '';
        const cnpjPosto = reg.posto?.cnpj || '';
        const nomeCombustivel = reg.combustivel?.nome?.toLowerCase() || '';
        const usuarioEmail = reg.usuario?.email?.toLowerCase() || '';
        const usuarioNome = reg.usuario?.nome?.toLowerCase() || '';

        return (
          nomePosto.includes(termo) ||
          cnpjPosto.includes(termo) ||
          nomeCombustivel.includes(termo) ||
          usuarioEmail.includes(termo) ||
          usuarioNome.includes(termo)
        );
      }

      return true;
    });
  }, [registros, postoFiltro, combustivelFiltro, tipoFiltro, buscaTexto]);

  // Cálculos de métricas e KPIs de auditoria
  const metricas = useMemo(() => {
    let maiorAumento = 0;
    let maiorReducao = 0;
    const postosAfetados = new Set();

    registros.forEach((reg) => {
      if (reg.posto_id) postosAfetados.add(reg.posto_id);
      if (reg.preco_anterior !== null && reg.preco_anterior !== undefined) {
        const diff = Number(reg.preco_novo) - Number(reg.preco_anterior);
        if (diff > maiorAumento) maiorAumento = diff;
        if (diff < maiorReducao) maiorReducao = diff;
      }
    });

    return {
      totalAlteracoes: registros.length,
      postosAuditados: postosAfetados.size,
      maiorAumento,
      maiorReducao,
    };
  }, [registros]);

  return (
    <AppLayout>
      <div className="space-y-6 font-sans">
        {/* Cabeçalho da Página */}
        <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                Auditoria de Preços de Combustível
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Rastreamento e fiscalização de todas as alterações de preços praticadas pelos postos cadastrados na plataforma NAVROTAS.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => carregarDadosAuditoria(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar Auditoria</span>
              </button>
            </div>
          </div>
        </section>

        {erro && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{erro}</span>
          </div>
        )}

        {/* Cards de Métricas e KPIs Globais de Auditoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total de Registros
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">
                {metricas.totalAlteracoes}
              </span>
              <span className="text-xs text-gray-500">alterações registradas</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Bases Auditadas
              </span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">
                {metricas.postosAuditados}
              </span>
              <span className="text-xs text-gray-500">postos com histórico</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Maior Aumento
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-700">
                {metricas.maiorAumento > 0 ? `+ R$ ${metricas.maiorAumento.toFixed(2)}` : 'R$ 0,00'}
              </span>
              <span className="text-xs text-gray-500">por litro</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Maior Redução
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {metricas.maiorReducao < 0 ? `- R$ ${Math.abs(metricas.maiorReducao).toFixed(2)}` : 'R$ 0,00'}
              </span>
              <span className="text-xs text-gray-500">por litro</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Campo de Busca Textual */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="Buscar por nome do posto, CNPJ, combustível ou responsável..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Filtros em Linha */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro por Posto */}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <select
                  value={postoFiltro}
                  onChange={(e) => setPostoFiltro(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os Postos</option>
                  {postos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome_fantasia}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Combustível */}
              <div className="flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <select
                  value={combustivelFiltro}
                  onChange={(e) => setCombustivelFiltro(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os Combustíveis</option>
                  {combustiveis.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Tipo de Alteração */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <select
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TODOS">Todas as Alterações</option>
                  <option value="AUMENTO">Aumentos de Preço</option>
                  <option value="REDUCAO">Reduções de Preço</option>
                  <option value="PRIMEIRO_CADASTRO">Primeiro Cadastro</option>
                </select>
              </div>

              {(postoFiltro || combustivelFiltro || tipoFiltro !== 'TODOS' || buscaTexto) && (
                <button
                  onClick={() => {
                    setPostoFiltro('');
                    setCombustivelFiltro('');
                    setTipoFiltro('TODOS');
                    setBuscaTexto('');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline px-1 cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Tabela de Histórico de Auditoria */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Histórico Auditado de Preços
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Exibindo {registrosFiltrados.length} de {registros.length} eventos registrados
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <span className="text-sm">Carregando registros de auditoria...</span>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-900">
                Nenhum evento de auditoria encontrado
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Não foram localizados registros de preços correspondentes aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-200">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Data / Hora</th>
                    <th scope="col" className="px-4 py-3">Posto de Abastecimento</th>
                    <th scope="col" className="px-4 py-3">Combustível</th>
                    <th scope="col" className="px-4 py-3">Preço Anterior</th>
                    <th scope="col" className="px-4 py-3">Preço Novo</th>
                    <th scope="col" className="px-4 py-3">Variação</th>
                    <th scope="col" className="px-4 py-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {registrosFiltrados.map((item) => {
                    const precoAnt = item.preco_anterior !== null && item.preco_anterior !== undefined
                      ? Number(item.preco_anterior)
                      : null;
                    const precoNovo = Number(item.preco_novo);
                    const diff = precoAnt !== null ? precoNovo - precoAnt : null;
                    const pct = precoAnt !== null && precoAnt > 0 ? (diff / precoAnt) * 100 : null;

                    const isAumento = diff !== null && diff > 0;
                    const isReducao = diff !== null && diff < 0;
                    const isPrimeiroCadastro = precoAnt === null;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Data / Hora */}
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>
                              {new Date(item.alterado_em).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}{' '}
                              {new Date(item.alterado_em).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>

                        {/* Posto */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {item.posto?.nome_fantasia || `Posto #${item.posto_id}`}
                          </div>
                          {item.posto?.cnpj && (
                            <div className="text-[11px] font-mono text-gray-500">
                              CNPJ: {item.posto.cnpj}
                            </div>
                          )}
                        </td>

                        {/* Combustível */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            {item.combustivel?.nome || `Combustível #${item.combustivel_id}`}
                          </span>
                          <span className="text-[10px] text-gray-400 block uppercase">
                            {item.combustivel?.unidade_medida || 'LITRO'}
                          </span>
                        </td>

                        {/* Preço Anterior */}
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-600">
                          {precoAnt !== null ? `R$ ${precoAnt.toFixed(2)}` : '—'}
                        </td>

                        {/* Preço Novo */}
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-gray-900">
                          R$ {precoNovo.toFixed(2)}
                        </td>

                        {/* Variação */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isPrimeiroCadastro ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Primeiro Cadastro
                            </span>
                          ) : isAumento ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <ArrowUpRight className="w-3 h-3 text-amber-600" />
                              <span>+ R$ {diff.toFixed(2)} (+{pct.toFixed(1)}%)</span>
                            </span>
                          ) : isReducao ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                              <span>- R$ {Math.abs(diff).toFixed(2)} ({pct.toFixed(1)}%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              Sem alteração
                            </span>
                          )}
                        </td>

                        {/* Responsável */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <div>
                              <span className="text-gray-900 font-medium block">
                                {item.usuario?.nome || item.usuario?.email || 'Sistema (Automático)'}
                              </span>
                              {item.usuario?.role && (
                                <span className="text-[10px] text-gray-400 block uppercase">
                                  {item.usuario.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default AdminAuditoriaPage;
