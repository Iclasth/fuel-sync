import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const apiError = err.response?.data?.error;
      const apiDetails = err.response?.data?.details;

      if (Array.isArray(apiDetails) && apiDetails.length > 0) {
        setErrorMessage(apiDetails.join(' '));
      } else if (apiError) {
        setErrorMessage(apiError);
      } else {
        setErrorMessage('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      }
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

      {/* Área Central - Formulário */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-medium text-[#6b46c1]">Realize seu login</h2>
          </div>

          {/* Alerta de Erro */}
          {errorMessage && (
            <div
              data-testid="error-alert"
              className="flex items-start gap-3 p-3 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in fade-in duration-200"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campo Login/Email */}
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Login (E-mail)"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full pl-11 pr-11 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#6b46c1] transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botão de Entrar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#6b46c1] hover:bg-[#553699] active:bg-[#442b7a] disabled:bg-purple-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </div>
          </form>

          {/* Links Auxiliares */}
          <div className="mt-6 flex flex-col items-center space-y-4">
            <button type="button" className="text-sm font-medium text-gray-500 hover:text-[#6b46c1] transition-colors">
              Esqueceu a senha?
            </button>
            
            <div className="w-full flex items-center gap-3">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">ou</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <p className="text-sm text-gray-500">
              Não possui conta?{' '}
              <Link to="/cadastro" className="text-[#6b46c1] hover:text-[#553699] font-semibold transition-colors">
                Cadastre-se aqui
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default LoginPage;