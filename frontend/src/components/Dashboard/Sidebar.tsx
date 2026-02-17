import React, { useState } from 'react';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeMenu, onMenuChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'horario', label: 'Horario' },
    { id: 'profesores', label: 'Profesores' },
    { id: 'materias', label: 'Materias' },
    { id: 'aulas', label: 'Aulas' },
    { id: 'grupos', label: 'Grupos' },
  ];

  return (
    <aside className="w-64 bg-blue-700 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-blue-600">
        <h1 className="text-2xl font-bold">SPH System</h1>
        <p className="text-blue-100 text-sm mt-1">Gestión de Horarios</p>
      </div>

      {/* Menu */}
      <nav className="p-4">
        <p className="text-blue-200 text-xs uppercase font-semibold mb-4 px-2">Gestión</p>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onMenuChange(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
                  activeMenu === item.id
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
