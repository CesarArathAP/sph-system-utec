import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Home, Calendar, GraduationCap, BookOpen, Building2, Users, LogOut, BookCopy,
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface CurrentUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

const menuItems = [
  { id: 'inicio', label: 'Inicio', Icon: Home, href: '/auth/dashboard' },
  { id: 'horarios', label: 'Horarios', Icon: Calendar, href: '/auth/dashboard/horarios' },
  { id: 'docentes', label: 'Docentes', Icon: GraduationCap, href: '/auth/dashboard/docentes' },
  { id: 'materias', label: 'Materias', Icon: BookOpen, href: '/auth/dashboard/materias' },
  { id: 'aulas', label: 'Aulas', Icon: Building2, href: '/auth/dashboard/aulas' },
  { id: 'grupos', label: 'Grupos', Icon: Users, href: '/auth/dashboard/grupos' },
  { id: 'asignaciones', label: 'Asignaciones', Icon: BookCopy, href: '/auth/dashboard/asignaciones' },
];

const rolLabel: Record<string, string> = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  docente: 'Docente',
};

export default function Sidebar({ activeMenu, onLogout, isOpen = false, onClose }: SidebarProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('current_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Tu sesión actual se cerrará y tendrás que iniciar sesión de nuevo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
      }
    });
  };

  const handleMenuClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`w-64 bg-gradient-to-b from-blue-700 via-blue-700 to-blue-800 text-white h-screen fixed left-0 top-0 flex flex-col z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-blue-600/50 shadow-2xl ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:relative'
    }`}>
      {/* Logo Section */}
      <div className="p-5 sm:p-6 border-b border-blue-600/50 bg-gradient-to-r from-blue-700 to-blue-600">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              SPH System
            </h1>
          </div>
          <p className="text-blue-200 text-xs font-medium ml-4.5">
            Gestión de Horarios UTEC
          </p>
        </div>
      </div>

      {/* Usuario Profile Card */}
      {user && (
        <div className="px-4 py-4 mx-2 mt-4 rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-600/40 to-blue-700/40 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg">
              {user.nombre.charAt(0)}{user.apellido.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-white">{user.nombre} {user.apellido}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2 py-0.5 bg-cyan-500/30 text-cyan-100 text-xs font-medium rounded-full border border-cyan-400/30">
                  {rolLabel[user.rol] ?? user.rol}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-3 py-5 sm:px-4 overflow-y-auto">
        <p className="text-blue-300 text-xs uppercase font-bold mb-4 px-3 tracking-widest opacity-70">
          → Navegación
        </p>
        <ul className="space-y-2">
          {menuItems.map(({ id, label, Icon, href }) => (
            <li key={id}>
              <a
                href={href}
                onClick={handleMenuClick}
                className={`
                  w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm font-medium
                  group relative overflow-hidden
                  ${activeMenu === id
                    ? 'bg-white text-blue-700 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'text-blue-100 hover:bg-blue-600/50 hover:text-white hover:translate-x-1'
                  }
                `}
              >
                {/* Fondo animado para items activos */}
                {activeMenu === id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-white opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl"></div>
                )}
                
                <Icon 
                  size={20} 
                  strokeWidth={2} 
                  className={`shrink-0 transition-transform duration-200 ${activeMenu === id ? 'text-blue-600' : 'group-hover:scale-110'}`} 
                />
                <span className="truncate">{label}</span>
                
                {/* Indicador de activo */}
                {activeMenu === id && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/50"></div>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 sm:p-5 border-t border-blue-600/50 bg-gradient-to-b from-transparent to-blue-800/50 space-y-4">
        {user && (
          <div className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/20">
            <p className="text-blue-200 text-xs truncate break-words font-medium">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`
            w-full px-4 py-2.5 rounded-lg text-white font-semibold transition-all duration-200
            flex items-center justify-center gap-2
            bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600
            hover:shadow-lg hover:shadow-red-500/30 active:scale-95
            group
          `}
        >
          <LogOut size={18} strokeWidth={2.5} className="shrink-0 group-hover:rotate-180 transition-transform duration-300" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
