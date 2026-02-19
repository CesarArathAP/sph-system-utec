import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import HomeDashboard from '../layout/HomeDashboard';
import { ScheduleTable } from '../modules/horarios';
import { AssignmentModal } from '../modules/asignaciones';
import { ProfesoresLayout } from '../modules/profesores';
import { AulasLayout } from '../modules/aulas';
import { MateriasLayout } from '../modules/materias';
import { GruposLayout } from '../modules/grupos';

interface DashboardLayoutProps {
  section?: string;
}

export default function DashboardLayout({ section = 'inicio' }: DashboardLayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    window.location.replace('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        activeMenu={section}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="ml-64 flex-1 overflow-auto">
        {section === 'inicio' && <HomeDashboard />}
        {section === 'horarios' && <ScheduleTable onAssignClick={() => setIsModalOpen(true)} />}
        {section === 'profesores' && <ProfesoresLayout />}
        {section === 'aulas' && <AulasLayout />}
        {section === 'materias' && <MateriasLayout />}
        {section === 'grupos' && <GruposLayout />}
      </main>

      {/* Modal de asignación */}
      <AssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
