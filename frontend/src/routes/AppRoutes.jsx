// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import ProtectedRoute from './ProtectedRoute';
// import useAuth from '../hooks/useAuth';

// // Páginas de Autenticação
// import LoginPage from '../pages/auth/LoginPage';
// import RegisterPage from '../pages/auth/RegisterPage';

// // Módulos Operacionais e de Gestão
// import HomePage from '../pages/HomePage';
// import OrderTrackingPage from '../pages/OrderTrackingPage';
// import ComprarCombustivelPage from '../pages/ComprarCombustivelPage';
// import EnderecosPage from '../pages/EnderecosPage';

// const PublicRoute = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();
//   if (isLoading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-950">
//         <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
//       </div>
//     );
//   }
//   return isAuthenticated ? <Navigate to="/" replace /> : children;
// };

// export const AppRoutes = () => {
//   return (
//     <Routes>
//       {/* Fluxo de Autenticação */}
//       <Route
//         path="/login"
//         element={
//           <PublicRoute>
//             <LoginPage />
//           </PublicRoute>
//         }
//       />
      
//       <Route
//         path="/cadastro"
//         element={
//           <PublicRoute>
//             <RegisterPage />
//           </PublicRoute>
//         }
//       />

//       {/* Módulos Operacionais Protegidos */}
//       <Route
//         path="/"
//         element={
//           <ProtectedRoute>
//             <HomePage />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/comprar"
//         element={
//           <ProtectedRoute>
//             <ComprarCombustivelPage />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/rastreio"
//         element={
//           <ProtectedRoute>
//             <OrderTrackingPage />
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/enderecos"
//         element={
//           <ProtectedRoute>
//             <EnderecosPage />
//           </ProtectedRoute>
//         }
//       />

//       {/* Redirecionamento Padrão (Fallback) */}
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// };

// export default AppRoutes;
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Páginas de Autenticação
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Módulos Operacionais e de Gestão
import HomePage from '../pages/HomePage';
import OrderTrackingPage from '../pages/OrderTrackingPage';
import ComprarCombustivelPage from '../pages/ComprarCombustivelPage';
import EnderecosPage from '../pages/EnderecosPage';

export const AppRoutesTest = () => {
  return (
    <Routes>
      {/* Rotas de Acesso (Livres para teste) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />

      {/* Módulos Operacionais (Livres para teste) */}
      <Route path="/" element={<HomePage />} />
      <Route path="/comprar" element={<ComprarCombustivelPage />} />
      <Route path="/rastreio" element={<OrderTrackingPage />} />
      <Route path="/enderecos" element={<EnderecosPage />} />

      {/* Redirecionamento Padrão */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutesTest;