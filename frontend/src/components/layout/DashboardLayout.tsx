import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import HomeDashboard from '../layout/HomeDashboard';
import { ScheduleTable } from '../modules/horarios';
import { AssignmentModal } from '../modules/asignaciones';
import { ProfesoresLayout } from '../modules/profesores';
import { AulasLayout } from '../modules/aulas';
import { MateriasLayout } from '../modules/materias';
import { GruposLayout } from '../modules/grupos';

export default function DashboardLayout() {
  const [activeMenu, setActiveMenu] = useState('inicio');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Escuchar evento de navegación desde HomeDashboard (accesos rápidos)
  useEffect(() => {
    const handler = (e: Event) => {
      const menu = (e as CustomEvent<string>).detail;
      setActiveMenu(menu);
    };
    window.addEventListener('dashboard-navigate', handler);
    return () => window.removeEventListener('dashboard-navigate', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    window.location.replace('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="ml-64 flex-1 overflow-auto">
        {activeMenu === 'inicio' && <HomeDashboard />}
        {activeMenu === 'horarios' && <ScheduleTable onAssignClick={() => setIsModalOpen(true)} />}
        {activeMenu === 'profesores' && <ProfesoresLayout />}
        {activeMenu === 'aulas' && <AulasLayout />}
        {activeMenu === 'materias' && <MateriasLayout />}
        {activeMenu === 'grupos' && <GruposLayout />}
      </main>

      {/* Modal de asignación */}
      <AssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
