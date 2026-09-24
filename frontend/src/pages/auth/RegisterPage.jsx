import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, FileText, Loader2, AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulação de chamada à API
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Após o cadastro com sucesso, redireciona para o login
      navigate('/login');
    } catch (err) {
      setErrorMessage('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {/* Cabeçalho Superior */}
      <header className="bg-white border-b border-purple-200 py-4 px-8 shadow-sm flex items-center">
        <h1 className="text-2xl font-bold text-[#6b46c1] tracking-widest uppercase">
          NAVROTAS
        </h1>
      </header>

      {/* Área Central - Formulário de Registo */}
      <main className="flex-1 flex items-center justify-center p-6 my-4">
        <div className="w-full max-w-[480px] bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-[#6b46c1]">Realize seu cadastro</h2>
          </div>

          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Nome */}
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Nome"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                />
              </div>
            </div>

            {/* Campo CPF */}
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FileText className="w-5 h-5" />
                </div>
                <input
                  name="cpf"
                  type="text"
                  required
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="CPF / CNPJ"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                />
              </div>
            </div>

            {/* Campo E-mail */}
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                />
              </div>
            </div>

            {/* Grid para as Senhas */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Senha"
                    className="w-full pl-11 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#6b46c1] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmar"
                    className="w-full pl-11 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#6b46c1] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#6b46c1] hover:bg-[#553699] active:bg-[#442b7a] disabled:bg-purple-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>Cadastrar</span>
                )}
              </button>
            </div>
          </form>

          {/* Redirecionamento para Login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Ja possui conta?{' '}
              <Link to="/login" className="text-[#6b46c1] hover:text-[#553699] font-medium transition-colors">
                Logue aqui
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default RegisterPage;