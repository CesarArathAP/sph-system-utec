/**
 * Componente de alerta para guiar al usuario newbie en la configuración inicial
 */

import React from 'react';
import {
  AlertTriangle, CheckCircle2, BookOpen, GraduationCap,
  Building2, Users, Layers, ChevronRight
} from 'lucide-react';
import type { SetupStatus } from './logic/useScheduleSetupStatus';

interface SetupGuideAlertProps {
  status: SetupStatus;
  onNavigate?: (section: string) => void;
}

export default function SetupGuideAlert({ status, onNavigate }: SetupGuideAlertProps) {
  if (status.isReady) return null;

  const modules = [
    { key: 'materias', label: 'Materias', icon: BookOpen, href: '/auth/dashboard/materias' },
    { key: 'docentes', label: 'Docentes', icon: GraduationCap, href: '/auth/dashboard/docentes' },
    { key: 'aulas', label: 'Aulas', icon: Building2, href: '/auth/dashboard/aulas' },
    { key: 'grupos', label: 'Grupos', icon: Users, href: '/auth/dashboard/grupos' },
    { key: 'asignaciones', label: 'Asignaciones', icon: Layers, href: '/auth/dashboard/asignaciones' },
  ];

  const missingModuleNames = status.missingModules;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-[2rem] p-8 shadow-2xl mb-8 backdrop-blur-md animate-in slide-in-from-top-4 duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3.5 bg-amber-500/20 rounded-xl border border-amber-500/30 shrink-0">
            <AlertTriangle size={24} className="text-amber-400" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Bienvenida(o) a SPH System
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Antes de generar horarios, necesitas configurar los datos básicos del sistema. 
              Aquí está lo que falta:
            </p>
          </div>
        </div>

        {/* Missing Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {modules.map(({ key, label, icon: Icon, href }) => {
            const isMissing = missingModuleNames.includes(label);
            const moduleData = status[key as keyof Omit<SetupStatus, 'isReady' | 'missingModules'>] as { count: number; label: string; icon: string };
            const count = moduleData?.count || 0;

            return (
              <a
                key={key}
                href={href}
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate(key);
                  }
                }}
                className={`group relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 cursor-pointer ${
                  isMissing
                    ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/15 hover:border-red-500/50'
                    : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/50'
                }`}
              >
                <div className="relative z-10 flex flex-col items-center text-center gap-3">
                  <span className={`p-2.5 rounded-lg transition-transform duration-300 group-hover:scale-110 ${
                    isMissing
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Icon size={20} strokeWidth={2.5} />
                  </span>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">{label}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1.5">
                      {isMissing ? (
                        <span className="text-[10px] font-black px-2 py-1 rounded bg-red-500/30 text-red-300 uppercase tracking-tighter">
                          Requerido
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-300">{count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h4 className="font-black text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            Pasos para comenzar:
          </h4>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">1</span>
              <span className="text-sm text-white/70">Crea <strong className="text-white">Materias</strong> - cursos que serán impartidos</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">2</span>
              <span className="text-sm text-white/70">Registra <strong className="text-white">Docentes</strong> - profesores disponibles</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">3</span>
              <span className="text-sm text-white/70">Define <strong className="text-white">Aulas</strong> - espacios físicos disponibles</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">4</span>
              <span className="text-sm text-white/70">Agrega <strong className="text-white">Grupos</strong> - secciones de estudiantes</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">5</span>
              <span className="text-sm text-white/70">Crea <strong className="text-white">Asignaciones</strong> - docente + materia + grupo</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-black text-emerald-400 shrink-0">✓</span>
              <span className="text-sm text-white/70">¡Ahora sí! Genera tu horario en <strong className="text-white">Gestión de Horarios</strong></span>
            </li>
          </ol>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-white/50 uppercase tracking-widest">
            Progreso: {5 - status.missingModules.length} de 5 configurado
          </p>
          <div className="flex gap-1">
            {modules.map(({ key, label }) => (
              <div
                key={key}
                className={`h-1.5 rounded-full ${
                  missingModuleNames.includes(label)
                    ? 'bg-red-500/30'
                    : 'bg-emerald-500'
                } transition-all`}
                style={{ width: '20%' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
