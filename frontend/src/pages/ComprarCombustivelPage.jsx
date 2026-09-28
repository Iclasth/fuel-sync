import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fuel,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Loader2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

export const ComprarCombustivelPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [postos, setPostos] = useState([]);
  const [postoSelecionado, setPostoSelecionado] = useState('');
  const [combustiveis, setCombustiveis] = useState([]);
  const [combustivelSelecionadoId, setCombustivelSelecionadoId] = useState('');
  const [quantidadeLitros, setQuantidadeLitros] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Endereços de entrega salvos
  const [enderecosSalvos, setEnderecosSalvos] = useState([]);
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState('');
  const [enderecoCustom, setEnderecoCustom] = useState({
    endereco: 'Marina da Glória, Av. Infante Dom Henrique, s/n',
    ponto_referencia: 'Píer Sul, Vaga 14',
    tipo_local: 'MARINA',
    latitude: -22.9205,
    longitude: -43.1729,
  });

  const [isLoadingPostos, setIsLoadingPostos] = useState(true);
  const [isLoadingFuels, setIsLoadingFuels] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  // Carrega lista de postos e locais salvos diretamente da API do banco
  useEffect(() => {
    let isMounted = true;

    const carregarPostosELocais = async () => {
      try {
        setIsLoadingPostos(true);
        const [postosRes, locaisRes] = await Promise.allSettled([
          api.get('/api/v1/stations'),
          api.get('/api/v1/customers/locations'),
        ]);

        if (isMounted && postosRes.status === 'fulfilled') {
          const stationList = Array.isArray(postosRes.value.data) ? postosRes.value.data : [];
          setPostos(stationList);
          if (stationList.length > 0) {
            setPostoSelecionado(String(stationList[0].id));
          }
        }

        if (isMounted && locaisRes.status === 'fulfilled') {
          const locations = Array.isArray(locaisRes.value.data) ? locaisRes.value.data : [];
          setEnderecosSalvos(locations);
          if (locations.length > 0) {
            setEnderecoSelecionadoId(String(locations[0].id));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados operacionais:', err);
      } finally {
        if (isMounted) setIsLoadingPostos(false);
      }
    };

    carregarPostosELocais();

    return () => {
      isMounted = false;
    };
  }, []);

  // Carrega combustíveis do posto selecionado
  useEffect(() => {
    if (!postoSelecionado) return;

    const carregarCombustiveisDoPosto = async () => {
      setIsLoadingFuels(true);
      setMensagemErro('');
      try {
        const res = await api.get(`/api/v1/stations/${postoSelecionado}/fuels`);
        const fuels = Array.isArray(res.data) ? res.data : [];

        if (fuels.length > 0) {
          const mapped = fuels.map((f) => ({
            id: f.combustivel_id || f.id,
            nome: f.combustiveis?.nome || `Combustível #${f.combustivel_id || f.id}`,
            preco_litro: Number(f.preco_litro),
            disponivel: f.disponivel !== false,
          }));
          setCombustiveis(mapped);
          const firstAvailable = mapped.find((m) => m.disponivel);
          if (firstAvailable) {
            setCombustivelSelecionadoId(String(firstAvailable.id));
          }
        } else {
          // Fallback para catálogo global
          const catRes = await api.get('/api/v1/catalog/fuels');
          const catFuels = Array.isArray(catRes.data) ? catRes.data : [];
          const mapped = catFuels.map((f) => ({
            id: f.id,
            nome: f.nome,
            preco_litro: 5.89,
            disponivel: true,
          }));
          setCombustiveis(mapped);
          if (mapped.length > 0) {
            setCombustivelSelecionadoId(String(mapped[0].id));
          }
        }
      } catch (err) {
        console.error('Erro ao consultar combustíveis do posto:', err);
        // Fallback básico
        const defaultFuels = [
          { id: 1, nome: 'Gasolina Comum Náutica', preco_litro: 5.89, disponivel: true },
          { id: 2, nome: 'Diesel S10 Marítimo', preco_litro: 6.25, disponivel: true },
          { id: 3, nome: 'Gasolina Podium / Premium', preco_litro: 7.15, disponivel: true },
        ];
        setCombustiveis(defaultFuels);
        setCombustivelSelecionadoId('1');
      } finally {
        setIsLoadingFuels(false);
      }
    };

    carregarCombustiveisDoPosto();
  }, [postoSelecionado]);

  // Cálculos financeiros
  const combSelecionado = combustiveis.find((c) => String(c.id) === String(combustivelSelecionadoId));
  const litrosNum = parseFloat(quantidadeLitros) || 0;
  const precoUnitario = combSelecionado ? combSelecionado.preco_litro : 0;
  const totalEstimado = (litrosNum * precoUnitario).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagemErro('');

    if (!litrosNum || litrosNum <= 0) {
      setMensagemErro('Informe uma quantidade de litros válida e maior que zero.');
      return;
    }

    if (!combSelecionado) {
      setMensagemErro('Selecione um tipo de combustível disponível.');
      return;
    }

    // Identifica o local de entrega
    let enderecoFinal = enderecoCustom;
    if (enderecoSelecionadoId && enderecoSelecionadoId !== 'custom') {
      const saved = enderecosSalvos.find((s) => s.id === enderecoSelecionadoId);
      if (saved) {
        enderecoFinal = saved;
      }
    }

    if (!enderecoFinal.endereco || !enderecoFinal.endereco.trim()) {
      setMensagemErro('Informe ou selecione o endereço de entrega do abastecimento.');
      return;
    }

    const payload = {
      posto_id: Number(postoSelecionado),
      endereco_entrega: enderecoFinal.endereco.trim(),
      ponto_referencia: enderecoFinal.ponto_referencia ? enderecoFinal.ponto_referencia.trim() : null,
      tipo_local: enderecoFinal.tipo_local || 'MARINA',
      instrucoes_adicionais: observacoes.trim() || null,
      destino_latitude: Number(enderecoFinal.latitude) || -22.9205,
      destino_longitude: Number(enderecoFinal.longitude) || -43.1729,
      itens: [
        {
          combustivel_id: Number(combSelecionado.id),
          quantidade_litros: litrosNum,
          valor_unitario: Number(precoUnitario),
        },
      ],
    };

    setIsSubmitting(true);

    try {
      const res = await api.post('/api/v1/orders', payload);
      setSucesso(true);
      const orderId = res.data?.id || res.data?.pedido?.id;
      setTimeout(() => {
        if (orderId) {
          navigate(`/rastreio?orderId=${orderId}`);
        } else {
          navigate('/rastreio');
        }
      }, 1500);
    } catch (err) {
      console.error('Erro ao submeter pedido:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Não foi possível registrar o pedido de abastecimento. Verifique os dados e tente novamente.';
      setMensagemErro(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Solicitação de Abastecimento
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecione o posto credenciado, o combustível desejado e o ponto homologado para entrega fracionada
          </p>
        </div>

        {sucesso && (
          <div
            className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm"
            role="status"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Pedido registrado com sucesso!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Redirecionando para a central de rastreamento e telemetria...
              </p>
            </div>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Seleção do Posto Credenciado */}
            <div className="space-y-1.5">
              <label
                htmlFor="posto"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                1. Posto Fornecedor Credenciado
              </label>
              {isLoadingPostos ? (
                <div className="flex items-center gap-2 p-3 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Localizando postos homologados...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="posto"
                    value={postoSelecionado}
                    onChange={(e) => setPostoSelecionado(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  >
                    {postos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome_fantasia || p.razao_social} {p.endereco ? `— ${p.endereco}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Seleção do Tipo de Combustível */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  2. Combustível Vigente no Posto
                </label>
                {isLoadingFuels && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Atualizando catálogo...
                  </span>
                )}
              </div>

              {combustiveis.length === 0 && !isLoadingFuels ? (
                <p className="text-xs text-gray-500 italic">
                  Nenhum combustível ativo encontrado para o posto selecionado.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {combustiveis.map((tipo) => {
                    const isSelected = String(combustivelSelecionadoId) === String(tipo.id);
                    const isAvailable = tipo.disponivel;

                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setCombustivelSelecionadoId(String(tipo.id))}
                        className={`flex flex-col items-start p-4 rounded-lg border text-left min-h-[44px] transition-colors cursor-pointer ${
                          !isAvailable
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed text-gray-400'
                            : isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 text-gray-900'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-sm">{tipo.nome}</span>
                          <Fuel className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs text-gray-600 mt-2 font-mono">
                          R$ {tipo.preco_litro.toFixed(2)} / L
                        </span>
                        {!isAvailable && (
                          <span className="text-[10px] text-red-600 font-semibold uppercase mt-1">
                            Indisponível
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Ponto de Entrega */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                3. Local de Abastecimento Homologado
              </label>

              {enderecosSalvos.length > 0 && (
                <div className="space-y-1.5">
                  <select
                    value={enderecoSelecionadoId}
                    onChange={(e) => setEnderecoSelecionadoId(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    {enderecosSalvos.map((end) => (
                      <option key={end.id} value={end.id}>
                        {end.apelido} — {end.endereco}
                      </option>
                    ))}
                    <option value="custom">Outro local (digitar endereço manualmente)...</option>
                  </select>
                </div>
              )}

              {(enderecosSalvos.length === 0 || enderecoSelecionadoId === 'custom') && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Av. Infante Dom Henrique, s/n - Glória, Rio de Janeiro"
                      value={enderecoCustom.endereco}
                      onChange={(e) =>
                        setEnderecoCustom({ ...enderecoCustom, endereco: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">
                        Ponto de Referência / Vaga
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Píer Sul, Vaga 14"
                        value={enderecoCustom.ponto_referencia}
                        onChange={(e) =>
                          setEnderecoCustom({ ...enderecoCustom, ponto_referencia: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">
                        Tipo de Local
                      </label>
                      <select
                        value={enderecoCustom.tipo_local}
                        onChange={(e) =>
                          setEnderecoCustom({ ...enderecoCustom, tipo_local: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value="MARINA">Marina / Píer</option>
                        <option value="CONDOMINIO">Condomínio</option>
                        <option value="CHACARA">Chácara</option>
                        <option value="RODOVIA">Rodovia</option>
                        <option value="RESIDENCIA">Residência</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Volume e Cálculo Financeiro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="space-y-1.5">
                <label
                  htmlFor="litros"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  4. Volume Desejado (Litros)
                </label>
                <div className="relative">
                  <input
                    id="litros"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={quantidadeLitros}
                    onChange={(e) => setQuantidadeLitros(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full px-4 py-2.5 min-h-[44px] bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-semibold text-gray-400">
                    LITROS
                  </div>
                </div>
              </div>

              {/* Box de Resumo Financeiro */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col justify-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Valor Total Estimado
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">
                    R$ {Number(totalEstimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({litrosNum} L × R$ {precoUnitario.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Observações */}
            <div className="space-y-1.5">
              <label
                htmlFor="observacoes"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Instruções Adicionais para a Equipe de Despacho (Opcional)
              </label>
              <textarea
                id="observacoes"
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Embarcação atracada no canal esquerdo, solicitar crachá na guarita."
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Antifraude badge */}
            <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Validação antifraude ativa: os valores unitários são conferidos e auditados
                diretamente contra a base do posto fornecedor.
              </span>
            </div>

            {/* Ações */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !litrosNum || litrosNum <= 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando Pedido...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Solicitação de Abastecimento</span>
                    <ArrowRight className="w-4 h-4" />
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

export default ComprarCombustivelPage;