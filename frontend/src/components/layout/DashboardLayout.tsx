import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import { ScheduleTable } from '../modules/horarios';
import { AssignmentModal } from '../modules/asignaciones';
import { ProfesoresLayout } from '../modules/profesores';
import { AulasLayout } from '../modules/aulas';
import { MateriasLayout } from '../modules/materias';
import { GruposLayout } from '../modules/grupos';

export default function DashboardLayout() {
  const [activeMenu, setActiveMenu] = useState('horario');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    window.location.href = '/';
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
        {activeMenu === 'horario' && <ScheduleTable onAssignClick={() => setIsModalOpen(true)} />}
        {activeMenu === 'profesores' && <ProfesoresLayout />}
        {activeMenu === 'aulas' && <AulasLayout />}
        {activeMenu === 'materias' && <MateriasLayout />}
        {activeMenu === 'grupos' && <GruposLayout />}
      </main>

      {/* Modal */}
      <AssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
