import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Trash2, CheckCircle2, Phone, User, Store, ShieldCheck, LogOut } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export const EnderecosPage = () => {
  const { logout } = useAuth();
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
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Barra Lateral (Sidebar NAVROTAS) */}
      <aside className="w-64 bg-[#6b46c1] text-white flex flex-col shadow-2xl relative z-10 hidden md:flex">
        <div className="h-20 flex items-center px-8 border-b border-purple-500/30">
          <h1 className="text-2xl font-bold tracking-widest uppercase">NAVROTAS</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Início / Perfil
          </Link>
          <Link to="/comprar" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Abastecimento
          </Link>
          <Link to="/enderecos" className="block px-4 py-3 rounded-lg bg-white/20 font-medium text-white transition-colors">
            Endereços
          </Link>
          <Link to="/rastreio" className="block px-4 py-3 rounded-lg hover:bg-white/10 text-purple-100 transition-colors">
            Pedidos
          </Link>
        </nav>

        <div className="p-4 border-t border-purple-500/30">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-purple-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto p-8">
        <div className="max-w-4xl w-full mx-auto space-y-8">
          
          <div>
            <h2 className="text-2xl font-bold text-[#6b46c1]">Gestão de Locais e Postos</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Gira os seus endereços de entrega com contactos diretos e consulte os postos homologados da rede.
            </p>
          </div>

          <div className="flex border-b border-gray-200 gap-6">
            <button
              onClick={() => setAbaAtiva('enderecos')}
              className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                abaAtiva === 'enderecos'
                  ? 'border-[#6b46c1] text-[#6b46c1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Meus Endereços
            </button>
            <button
              onClick={() => setAbaAtiva('postos')}
              className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                abaAtiva === 'postos'
                  ? 'border-[#6b46c1] text-[#6b46c1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Store className="w-4 h-4" />
              Postos Homologados
            </button>
          </div>

          {abaAtiva === 'enderecos' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {sucessoMsg && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <div className="font-medium">{sucessoMsg}</div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <h3 className="text-lg font-bold text-[#6b46c1] mb-6">Adicione o endereço de entrega</h3>

                <form onSubmit={handleAdicionar} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-600">Nome do local/posto</label>
                      <input
                        name="apelido"
                        type="text"
                        required
                        value={novoEndereco.apelido}
                        onChange={handleChange}
                        placeholder="Ex: Posto Real Center"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-600">Responsável no Local</label>
                      <input
                        name="responsavel"
                        type="text"
                        value={novoEndereco.responsavel}
                        onChange={handleChange}
                        placeholder="Ex: Comandante João"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-600">Telefone / WhatsApp</label>
                      <input
                        name="telefone"
                        type="text"
                        required
                        value={novoEndereco.telefone}
                        onChange={handleChange}
                        placeholder="(11) 99999-9999"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Cep</label>
                      <input
                        name="cep"
                        type="text"
                        required
                        value={novoEndereco.cep}
                        onChange={handleChange}
                        placeholder="Ex: 05210001"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600">Rua / Avenida</label>
                      <input
                        name="rua"
                        type="text"
                        required
                        value={novoEndereco.rua}
                        onChange={handleChange}
                        placeholder="Ex: Avenida Lino de Souza"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Número</label>
                      <input
                        name="numero"
                        type="text"
                        required
                        value={novoEndereco.numero}
                        onChange={handleChange}
                        placeholder="Ex: 1234"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Complemento (Opcional)</label>
                      <input
                        name="complemento"
                        type="text"
                        value={novoEndereco.complemento}
                        onChange={handleChange}
                        placeholder="Ex: Casa"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="py-3 px-8 bg-[#6b46c1] hover:bg-[#553699] active:bg-[#442b7a] text-white font-semibold rounded-lg shadow-md shadow-purple-500/20 transition-all text-sm cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>

                </form>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Locais Cadastrados ({enderecos.length})</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {enderecos.map((end) => (
                    <div key={end.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-base">{end.apelido}</span>
                          <span className="text-xs bg-purple-50 text-[#6b46c1] border border-purple-200 px-2 py-0.5 rounded-full font-medium">Ativo</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {end.rua}, {end.numero} {end.complemento ? `(${end.complemento})` : ''}
                        </p>
                        <div className="flex items-center gap-4 pt-2 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> {end.responsavel || 'Não informado'}</span>
                          <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {end.telefone}</span>
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">CEP: {end.cep}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemover(end.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
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
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-[#6b46c1]">Rede de Postos Parceiros Homologados</h3>
                <p className="text-sm text-gray-500">
                  Estes são os postos parceiros integrados à plataforma NAVROTAS autorizados a realizar o fornecimento e despacho de combustível.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  {postosHomologados.map((posto) => (
                    <div key={posto.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-md flex items-center gap-1 font-bold">
                          <ShieldCheck className="w-4 h-4" /> {posto.status}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{posto.tipo}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-800 text-base">{posto.nome}</h4>
                        <p className="text-sm text-gray-500 mt-1">{posto.cidade}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 font-medium">
                        <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {posto.telefone}</span>
                        <span className="text-[#6b46c1] font-bold cursor-pointer hover:underline">Ver Detalhes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default EnderecosPage;