import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ScheduleTable from './ScheduleTable';
import AssignmentModal from './AssignmentModal';
import ProfesoresLayout from './ProfesoresLayout';
import AulasLayout from './AulasLayout';

export default function DashboardLayout() {
  const [activeMenu, setActiveMenu] = useState('horario');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
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
      </main>

      {/* Modal */}
      <AssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
