import React, { useState } from 'react';
import { MapPin, Home, Hash, FileText, Plus, Trash2, CheckCircle2, Phone, User, Store, ShieldCheck } from 'lucide-react';

export const EnderecosPage = () => {
  const [abaAtiva, setAbaAtiva] = useState('enderecos');

  const [enderecos, setEnderecos] = useState([
    { 
      id: 1, 
      apelido: 'Marina Principal (Base Náutica)', 
      responsavel: 'Comandante Carlos', 
      telefone: '(11) 98765-4321', 
      cep: '05210-001', 
      rua: 'Avenida Beira Mar', 
      numero: '450', 
      complemento: 'Píer Sul' 
    }
  ]);

  const [postosHomologados] = useState([
    { id: 1, nome: 'Posto Náutico Imperial', tipo: 'Marítimo & Terrestre', cidade: 'São Paulo - SP', status: 'Homologado', telefone: '(11) 3333-4444' },
    { id: 2, nome: 'Auto Posto Real Center', tipo: 'Terrestre (Frotas)', cidade: 'Guarulhos - SP', status: 'Homologado', telefone: '(11) 2222-1111' },
    { id: 3, nome: 'Marina & Posto Oceano Azul', tipo: 'Marítimo', cidade: 'Santos - SP', status: 'Homologado', telefone: '(13) 5555-8888' }
  ]);

  const [novoEndereco, setNovoEndereco] = useState({
    apelido: '',
    responsavel: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: ''
  });

  const [sucessoMsg, setSucessoMsg] = useState('');

  const handleChange = (e) => {
    setNovoEndereco({ ...novoEndereco, [e.target.name]: e.target.value });
  };

  const handleAdicionar = (e) => {
    e.preventDefault();
    if (!novoEndereco.apelido || !novoEndereco.telefone || !novoEndereco.cep || !novoEndereco.rua || !novoEndereco.numero) {
      alert('Por favor, preencha todos os campos obrigatórios (incluindo o contacto).');
      return;
    }

    setEnderecos([...enderecos, { id: Date.now(), ...novoEndereco }]);
    setNovoEndereco({ apelido: '', responsavel: '', telefone: '', cep: '', rua: '', numero: '', complemento: '' });
    setSucessoMsg('Endereço e contacto de entrega cadastrados com sucesso!');
    
    setTimeout(() => {
      setSucessoMsg('');
    }, 3500);
  };

  const handleRemover = (id) => {
    setEnderecos(enderecos.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MapPin className="w-8 h-8 text-blue-500" />
            Gestão de Locais e Postos
          </h1>
          <p className="text-slate-400 mt-2">
            Gira os seus endereços de entrega com contactos diretos e consulte os postos homologados da rede.
          </p>
        </div>

        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setAbaAtiva('enderecos')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              abaAtiva === 'enderecos'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Meus Endereços de Entrega
          </button>
          <button
            onClick={() => setAbaAtiva('postos')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              abaAtiva === 'postos'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            Postos Homologados da Rede
          </button>
        </div>

        {abaAtiva === 'enderecos' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {sucessoMsg && (
              <div className="flex items-center gap-3 p-4 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>{sucessoMsg}</div>
              </div>
            )}

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6">Cadastrar novo local com contacto</h2>

              <form onSubmit={handleAdicionar} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Identificação do Local</label>
                    <input
                      name="apelido"
                      type="text"
                      required
                      value={novoEndereco.apelido}
                      onChange={handleChange}
                      placeholder="Ex: Marina Central"
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Responsável no Local</label>
                    <input
                      name="responsavel"
                      type="text"
                      value={novoEndereco.responsavel}
                      onChange={handleChange}
                      placeholder="Ex: Comandante João"
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Telefone / WhatsApp</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        name="telefone"
                        type="text"
                        required
                        value={novoEndereco.telefone}
                        onChange={handleChange}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">CEP</label>
                    <input
                      name="cep"
                      type="text"
                      required
                      value={novoEndereco.cep}
                      onChange={handleChange}
                      placeholder="05210-001"
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Rua / Avenida</label>
                    <input
                      name="rua"
                      type="text"
                      required
                      value={novoEndereco.rua}
                      onChange={handleChange}
                      placeholder="Avenida Beira Mar"
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Número</label>
                    <input
                      name="numero"
                      type="text"
                      required
                      value={novoEndereco.numero}
                      onChange={handleChange}
                      placeholder="450"
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Complemento / Ponto de Referência</label>
                    <input
                      name="complemento"
                      type="text"
                      value={novoEndereco.complemento}
                      onChange={handleChange}
                      placeholder="Píer Sul / Boia 04"
                      className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Salvar Local de Entrega
                  </button>
                </div>

              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Locais Cadastrados ({enderecos.length})</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {enderecos.map((end) => (
                  <div key={end.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{end.apelido}</span>
                        <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">Ativo</span>
                      </div>
                      <p className="text-sm text-slate-300">
                        {end.rua}, {end.numero} {end.complemento ? `(${end.complemento})` : ''}
                      </p>
                      <div className="flex items-center gap-4 pt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-500" /> {end.responsavel || 'Não informado'}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {end.telefone}</span>
                        <span className="font-mono text-slate-500">CEP: {end.cep}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemover(end.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remover</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {abaAtiva === 'postos' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm space-y-4">
              <h2 className="text-xl font-semibold text-white">Rede de Postos Parceiros Homologados</h2>
              <p className="text-sm text-slate-400">
                Estes são os postos parceiros integrados à plataforma FuelSync autorizados a realizar o fornecimento e despacho de combustível para as suas rotas e bases.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {postosHomologados.map((posto) => (
                  <div key={posto.id} className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> {posto.status}
                      </span>
                      <span className="text-xs text-slate-400">{posto.tipo}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-base">{posto.nome}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{posto.cidade}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {posto.telefone}</span>
                      <span className="text-blue-400 font-semibold cursor-pointer hover:underline">Ver Detalhes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EnderecosPage;