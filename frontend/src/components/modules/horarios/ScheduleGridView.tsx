import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Loader2, ChevronLeft, ChevronRight, History, LayoutGrid, Info } from 'lucide-react';
import { useToast } from '../../common/Toast';
import { API_CONFIG } from '../../../services/config';

/* ── Tipos ────────────────────────────────────────────────────────── */
interface GridHorario {
  id: number;
  materia: string;
  docente: string;
  grupo: string;
  aula: string;
  tipo_sesion: string;
  hora_fin: string;
}

interface GridData {
  snapshot_id: number;
  ciclo_escolar: string;
  version_numero: number;
  created_at: string;
  dias: string[];
  horas: string[];
  grid: Record<string, Record<string, GridHorario[]>>;
}

interface VersionInfo {
  id: number;
  version_numero: number;
  tipo_version: string;
  descripcion: string;
  created_at: string;
  usuario_nombre: string | null;
  num_horarios: number;
}

interface Props {
  cicloEscolar: string;
}

const ScheduleGridView: React.FC<Props> = ({ cicloEscolar }) => {
  const { addToast } = useToast();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  // Cargar versiones
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/schedule/${cicloEscolar}/versions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setVersions(data);
          if (data.length > 0) {
            setSelectedVersionId(data[0].id);
            setCurrentVersionIndex(0);
          }
        } else {
          setError('No se pudieron cargar las versiones');
        }
      } catch (err) {
        setError('Error al cargar versiones');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [cicloEscolar]);

  // Cargar grid cuando cambia la versión seleccionada
  useEffect(() => {
    if (!selectedVersionId) return;

    const fetchGrid = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/schedule/versions/${selectedVersionId}/grid`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setGridData(data);
          setError(null);
        } else {
          setError('No se pudo cargar el horario');
        }
      } catch (err) {
        setError('Error al cargar el horario');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrid();
  }, [selectedVersionId]);

  useEffect(() => {
    if (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error,
        duration: 4000
      });
    }
  }, [error, addToast]);

  const handlePrevVersion = () => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      setSelectedVersionId(versions[newIndex].id);
    }
  };

  const handleNextVersion = () => {
    if (currentVersionIndex < versions.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      setSelectedVersionId(versions[newIndex].id);
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // "HH:MM"
  };

  const getSessionColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'teorica':
        return 'bg-blue-500/20 border-l-4 border-blue-500 text-blue-200';
      case 'practica':
        return 'bg-emerald-500/20 border-l-4 border-emerald-500 text-emerald-200';
      case 'laboratorio':
        return 'bg-violet-500/20 border-l-4 border-violet-500 text-violet-200';
      default:
        return 'bg-gray-500/20 border-l-4 border-gray-500 text-gray-200';
    }
  };

  if (loading && !gridData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 animate-pulse">
           <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
        <span className="text-gray-400 font-bold tracking-widest uppercase text-xs">Cargando horario...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Selector de Versiones */}
      {versions.length > 0 && (
        <div className="bg-[#0a1532]/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <History className="text-blue-500" size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Historial de Versiones</h3>
                  <p className="text-blue-400/60 text-xs font-bold tracking-widest uppercase mt-0.5">Control de Auditoría</p>
               </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                <button
                  onClick={handlePrevVersion}
                  disabled={currentVersionIndex === 0}
                  className="p-2.5 bg-white/5 text-white rounded-xl disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-all border border-white/5 active:scale-90"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <div className="px-4 text-center min-w-[120px]">
                   <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Estado</p>
                   <p className="text-sm font-bold text-white">{currentVersionIndex + 1} de {versions.length}</p>
                </div>
                <button
                  onClick={handleNextVersion}
                  disabled={currentVersionIndex === versions.length - 1}
                  className="p-2.5 bg-white/5 text-white rounded-xl disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-all border border-white/5 active:scale-90"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
            </div>
          </div>

          {gridData && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Versión</p>
                  <p className="text-lg font-black text-blue-400">v{gridData.version_numero}</p>
               </div>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Ciclo Escolar</p>
                  <p className="text-base font-bold text-white">{gridData.ciclo_escolar}</p>
               </div>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 lg:col-span-2">
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Fecha de Registro</p>
                  <p className="text-base font-bold text-white">
                    {gridData.created_at
                      ? new Date(gridData.created_at).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </p>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Grid de Horarios */}
      {gridData && (
        <div className="bg-[#0a1532]/20 backdrop-blur-xl rounded-3xl border border-white/5 p-6 shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <LayoutGrid className="text-emerald-500" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Vista General del Campus</h3>
              <p className="text-emerald-400/60 text-xs font-bold tracking-widest uppercase mt-0.5">Planificación Semanal</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/20 custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-[#0d1b3e] border-b border-r border-white/5 px-4 py-5 text-left text-[11px] font-black text-white/40 uppercase tracking-[0.2em] min-w-24">
                    Hora
                  </th>
                  {gridData.dias.map((dia) => (
                    <th
                      key={dia}
                      className="bg-[#0d1b3e] border-b border-white/5 px-4 py-5 text-center text-[13px] font-black text-white uppercase tracking-widest min-w-56"
                    >
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {gridData.horas.map((hora) => (
                  <tr key={hora} className="hover:bg-white/[0.02] transition-colors">
                    <td className="sticky left-0 z-10 bg-[#0d1b3e]/95 backdrop-blur-sm border-r border-white/5 px-4 py-6 text-xs font-black text-white/60 tracking-widest text-center">
                      {formatTime(hora)}
                    </td>
                    {gridData.dias.map((dia) => {
                      const sessions = gridData.grid[dia.toUpperCase()]?.[hora] || [];
                      return (
                        <td
                          key={`${dia}-${hora}`}
                          className="px-2 py-3 align-top min-w-56"
                        >
                          <div className="space-y-2">
                            {sessions.map((session, idx) => (
                              <div
                                key={idx}
                                className={`p-4 rounded-2xl backdrop-blur-md shadow-lg border border-white/5 transition-all hover:scale-[1.03] hover:shadow-2xl ${getSessionColor(
                                  session.tipo_sesion
                                )}`}
                              >
                                <div className="font-black text-[13px] mb-1 leading-tight">
                                  {session.materia}
                                </div>
                                <div className="text-[11px] font-bold opacity-80 mb-2">
                                  {session.docente}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                   <span className="px-2 py-0.5 bg-black/20 rounded-md text-[10px] font-black uppercase tracking-tighter">
                                     {session.grupo}
                                   </span>
                                   <span className="px-2 py-0.5 bg-black/20 rounded-md text-[10px] font-black uppercase tracking-tighter">
                                     {session.aula}
                                   </span>
                                </div>
                                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                                   <span>{session.tipo_sesion}</span>
                                   <Clock size={10} />
                                </div>
                              </div>
                            ))}
                            {sessions.length === 0 && (
                              <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/[0.03] rounded-2xl group transition-all hover:bg-white/[0.01]">
                                <span className="text-[10px] font-black text-white/5 uppercase tracking-[0.3em] group-hover:text-white/10 transition-colors">Disponible</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="mt-10 p-6 rounded-3xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 mb-6">
               <Info size={16} className="text-white/40" />
               <h4 className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em]">Guía Visual de Sesiones</h4>
            </div>
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg bg-blue-500/20 border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Teórica</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg bg-emerald-500/20 border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Práctica</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-lg bg-violet-500/20 border-2 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Laboratorio</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleGridView;
