import React, { useState, useEffect } from 'react';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  onLogout: () => void;
}

interface CurrentUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

export default function Sidebar({ activeMenu, onMenuChange, onLogout }: SidebarProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // Leer datos del usuario desde localStorage
    const stored = localStorage.getItem('current_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const menuItems = [
    { id: 'horario', label: 'Horario' },
    { id: 'profesores', label: 'Profesores' },
    { id: 'materias', label: 'Materias' },
    { id: 'aulas', label: 'Aulas' },
    { id: 'grupos', label: 'Grupos' },
  ];

  const getRolLabel = (rol: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      coordinador: 'Coordinador',
      docente: 'Docente',
      estudiante: 'Estudiante',
    };
    return roles[rol] || rol;
  };

  return (
    <aside className="w-64 bg-blue-700 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-blue-600">
        <h1 className="text-2xl font-bold">SPH System</h1>
        <p className="text-blue-100 text-sm mt-1">Gestión de Horarios</p>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-blue-600 bg-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg">
              {user.nombre.charAt(0)}{user.apellido.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user.nombre} {user.apellido}</p>
              <p className="text-blue-200 text-xs truncate">{getRolLabel(user.rol)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="p-4">
        <p className="text-blue-200 text-xs uppercase font-semibold mb-4 px-2">Gestión</p>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onMenuChange(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${activeMenu === item.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-blue-100 hover:bg-blue-600'
                  }`}
              >
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-600">
        {user && (
          <p className="text-blue-200 text-xs truncate mb-2">{user.email}</p>
        )}
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
