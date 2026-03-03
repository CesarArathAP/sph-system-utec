import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import HomeDashboard from '../layout/HomeDashboard';
import { ScheduleTable } from '../modules/horarios';
import { AssignmentModal, AsignacionesLayout } from '../modules/asignaciones';
import { ProfesoresLayout } from '../modules/profesores';
import { AulasLayout } from '../modules/aulas';
import { MateriasLayout } from '../modules/materias';
import { GruposLayout } from '../modules/grupos';
import { ToastProvider } from '../common/Toast';

interface DashboardLayoutProps {
  section?: string;
}

export default function DashboardLayout({ section = 'inicio' }: DashboardLayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    window.location.replace('/');
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeMenu={section}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-lg border-b border-blue-600/50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></div>
            <h1 className="font-bold text-sm truncate">SPH System</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              sidebarOpen
                ? 'bg-blue-600/50 text-white'
                : 'hover:bg-blue-600/50 text-blue-100'
            } shrink-0`}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {section === 'inicio' && <HomeDashboard />}
          {section === 'horarios' && (
            <ScheduleTable
              onAssignClick={() => setIsModalOpen(true)}
              refreshKey={refreshKey}
            />
          )}
          {section === 'docentes' && <ProfesoresLayout />}
          {section === 'aulas' && <AulasLayout />}
          {section === 'materias' && <MateriasLayout />}
          {section === 'grupos' && <GruposLayout />}
          {section === 'asignaciones' && <AsignacionesLayout />}
        </div>
      </main>

      {/* Modal de nuevo horario */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => { setRefreshKey((k) => k + 1); setIsModalOpen(false); }}
      />
      </div>
    </ToastProvider>
  );
}
