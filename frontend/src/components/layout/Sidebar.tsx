import React, { useState, useEffect } from 'react';
import {
  Home, Calendar, GraduationCap, BookOpen, Building2, Users, LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onLogout: () => void;
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
];

const rolLabel: Record<string, string> = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  docente: 'Docente',
};

export default function Sidebar({ activeMenu, onLogout }: SidebarProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('current_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  return (
    <aside className="w-64 bg-blue-700 text-white h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-600">
        <h1 className="text-2xl font-bold tracking-tight">SPH System</h1>
        <p className="text-blue-200 text-xs mt-1">Gestión de Horarios UTEC</p>
      </div>

      {/* Usuario */}
      {user && (
        <div className="px-4 py-3 border-b border-blue-600 bg-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm shrink-0">
              {user.nombre.charAt(0)}{user.apellido.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user.nombre} {user.apellido}</p>
              <p className="text-blue-200 text-xs truncate">{rolLabel[user.rol] ?? user.rol}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-blue-300 text-xs uppercase font-semibold mb-3 px-2 tracking-wider">
          Menú
        </p>
        <ul className="space-y-1">
          {menuItems.map(({ id, label, Icon, href }) => (
            <li key={id}>
              <a
                href={href}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 text-sm font-medium ${activeMenu === id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:bg-blue-600'
                  }`}
              >
                <Icon size={17} strokeWidth={2} />
                <span>{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-600">
        {user && (
          <p className="text-blue-300 text-xs truncate mb-3">{user.email}</p>
        )}
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition text-sm flex items-center justify-center gap-2"
        >
          <LogOut size={15} strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
