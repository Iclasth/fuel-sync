import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Home,
  Fuel,
  MapPin,
  Clock,
  Shield,
  Building2,
  DollarSign,
  Truck,
  Layers,
  Users,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export const AppLayout = ({ children, activePageTitle = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin_geral':
        return 'Admin Geral';
      case 'posto_admin':
        return 'Admin Posto';
      case 'entregador':
        return 'Entregador';
      case 'cliente':
      default:
        return 'Cliente B2C';
    }
  };

  // Base customer navigation items
  const customerNav = [
    { to: '/', label: 'Visão Geral', icon: Home },
    { to: '/comprar', label: 'Abastecimento', icon: Fuel },
    { to: '/enderecos', label: 'Endereços', icon: MapPin },
    { to: '/rastreio', label: 'Meus Pedidos', icon: Clock },
  ];

  // Station admin navigation items
  const stationAdminNav = [
    { to: '/', label: 'Visão Geral', icon: Home },
    { to: '/posto/dados', label: 'Meu Posto', icon: Building2 },
    { to: '/posto/precos', label: 'Tabela de Preços', icon: DollarSign },
    { to: '/posto/pedidos', label: 'Fila de Pedidos', icon: Layers },
    { to: '/posto/entregadores', label: 'Entregadores', icon: Truck },
  ];

  // General admin navigation items (abrange TODAS as opções da aplicação)
  const generalAdminNav = [
    { section: 'Visão Geral' },
    { to: '/', label: 'Painel Geral', icon: Home },

    { section: 'Rede & Governança' },
    { to: '/admin/postos', label: 'Postos Cadastrados', icon: Building2 },
    { to: '/admin/vinculos', label: 'Vínculos de Gestores', icon: Layers },
    { to: '/admin/usuarios', label: 'Gestão de Usuários', icon: Users },
    { to: '/admin/auditoria', label: 'Auditoria de Preços', icon: Shield },

    { section: 'Operações de Posto' },
    { to: '/posto/pedidos', label: 'Fila de Pedidos', icon: Layers },
    { to: '/posto/precos', label: 'Tabela de Preços', icon: DollarSign },
    { to: '/posto/entregadores', label: 'Entregadores', icon: Truck },
    { to: '/posto/dados', label: 'Dados do Posto', icon: Building2 },

    { section: 'Operações do Cliente' },
    { to: '/comprar', label: 'Abastecimento', icon: Fuel },
    { to: '/enderecos', label: 'Endereços', icon: MapPin },
    { to: '/rastreio', label: 'Meus Pedidos', icon: Clock },
  ];

  // Courier navigation items
  const courierNav = [
    { to: '/', label: 'Minhas Entregas', icon: Truck },
    { to: '/rastreio', label: 'Rastreamento', icon: Clock },
  ];

  const getNavItems = () => {
    if (user?.role === 'admin_geral') return generalAdminNav;
    if (user?.role === 'posto_admin') return stationAdminNav;
    if (user?.role === 'entregador') return courierNav;
    return customerNav;
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900 antialiased">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-gray-900 text-gray-300 border-r border-gray-800 shrink-0 select-none">
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">
              NAV<span className="text-blue-500">ROTAS</span>
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            if (item.section) {
              return (
                <div
                  key={`section-${index}`}
                  className="pt-4 pb-1 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none"
                >
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-gray-800">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-semibold text-white truncate">
              {user?.name || 'Operador'}
            </p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email || '—'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-gray-800/70 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-gray-900 text-white border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white">
              NAV<span className="text-blue-500">ROTAS</span>
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
              {getRoleLabel(user?.role)}
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white rounded-lg focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Alternar menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-none flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-4/5 max-w-xs bg-gray-900 h-full p-4 flex flex-col text-gray-300 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
                <span className="text-lg font-bold text-white">
                  NAV<span className="text-blue-500">ROTAS</span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-gray-400 hover:text-white"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
                {navItems.map((item, index) => {
                  if (item.section) {
                    return (
                      <div
                        key={`m-section-${index}`}
                        className="pt-3 pb-1 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none"
                      >
                        {item.section}
                      </div>
                    );
                  }

                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-lg text-sm min-h-[44px] transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-gray-800">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-3 text-sm font-semibold text-red-400 hover:bg-gray-800 rounded-lg min-h-[44px]"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Encerrar Sessão</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body with strict overflow handling */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
