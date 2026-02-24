import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, Filter, Plus, Eye, History, List, Grid, AlertCircle, X, Clock, Bookmark, Search } from 'lucide-react';
import { useToast } from '../../common/Toast';
import { API_CONFIG } from '../../../services/config';
import HorarioDetailModal from './HorarioDetailModal';
import VersionHistoryModal from './VersionHistoryModal';
import ConflictosModal from './ConflictosModal';

/* ── Tipos ─────────────────────────────────────────────────────────── */
interface HorarioResponse {
  id: number;
  asignacion_id: number;
  aula_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_sesion: string;
  activo: boolean;
  asignacion?: {
    id: number;
    ciclo_escolar: string;
    grupo?: { nombre: string; codigo_grupo: string };
    materia?: { nombre: string; codigo_materia: string };
    docente?: { codigo_docente: string; departamento?: string | null; user?: { nombre: string; apellido: string } };
  };
  aula?: { nombre: string; codigo_aula: string };
}

interface ConflictoRegistrado {
  id: number;
  horario_id?: number | null;
  tipo_conflicto: string;
  descripcion: string;
  resuelto: boolean;
  created_at: string;
  resolved_at?: string | null;
}

/* ── Constantes Visuales Dark Premium ───────────────────────────────── */
const DAYS = [
  { label: 'Lunes', value: 'lunes' },
  { label: 'Martes', value: 'martes' },
  { label: 'Miércoles', value: 'miercoles' },
  { label: 'Jueves', value: 'jueves' },
  { label: 'Viernes', value: 'viernes' },
  { label: 'Sábado', value: 'sabado' },
];

const HOURS: string[] = [];
for (let h = 7; h < 22; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}:00`);
}

const TIPO_COLORS: Record<string, string> = {
  teorica: 'bg-blue-500/20 border-blue-500/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
  practica: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
  laboratorio: 'bg-violet-500/20 border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]',
};

const TIPO_LABEL: Record<string, string> = {
  teorica: 'Teórica', practica: 'Práctica', laboratorio: 'Lab.',
};

/* ── Helpers ────────────────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = API_CONFIG.BASE_URL;
function timeToHour(t: string): number { return parseInt(t.split(':')[0], 10); }

/* ── Componente principal ───────────────────────────────────────────── */
interface ScheduleTableProps {
  onAssignClick: () => void;
  refreshKey?: number;
}

export default function ScheduleTable({ onAssignClick, refreshKey = 0 }: ScheduleTableProps) {
  const { addToast } = useToast();
  const [horarios, setHorarios] = useState<HorarioResponse[]>([]);
  const [conflictos, setConflictos] = useState<ConflictoRegistrado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConf, setLoadingConf] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filterDia, setFilterDia] = useState<string>('');
  const [cicloInput, setCicloInput] = useState('');
  const [filterDocente, setFilterDocente] = useState('');
  const [filterAula, setFilterAula] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');
  const [filterMateria, setFilterMateria] = useState('');
  const [filterDepartamento, setFilterDepartamento] = useState('');
  
  // Vistas y Modales
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [versionHistoryHorarioId, setVersionHistoryHorarioId] = useState<number | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showConflictosModal, setShowConflictosModal] = useState(false);
  const [horarioVersiones, setHorarioVersiones] = useState<Record<number, { version: number; cambios: string }>>({});

  /* ── Fetch horarios ───────────────────────────────────────────────── */
  const fetchHorarios = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: '1', page_size: '100' });
      if (filterDia) params.set('dia_semana', filterDia);
      const res = await fetch(`${BASE}/horarios?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error de Conexión: ${res.status}`);
      const data = await res.json();
      const rawHorarios = data.horarios ?? [];
      setHorarios(rawHorarios);
      
      // Obtener versiones (Lógica de auditoría original)
      if (rawHorarios.length > 0) {
        const versionesMap: Record<number, { version: number; cambios: string }> = {};
        // Para no saturar el servidor, obtenemos versiones para los que estamos mostrando
        const slice = rawHorarios.slice(0, 100); 
        
        await Promise.all(slice.map(async (h: HorarioResponse) => {
          try {
            const vRes = await fetch(`${BASE}/horarios/${h.id}/versiones?page=1&page_size=100`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (vRes.ok) {
              const vData = await vRes.json();
              const allVersions = vData.versiones || [];
              if (allVersions.length > 0) {
                const maxVersion = Math.max(...allVersions.map((v: any) => v.version_numero));
                const lastVersion = allVersions.find((v: any) => v.version_numero === maxVersion);
                
                let cambioTexto = '';
                if (lastVersion && lastVersion.estado_anterior) {
                  const cambios = [];
                  const oldState = lastVersion.estado_anterior;
                  const newState = lastVersion.estado_nuevo;
                  if (oldState.hora_inicio !== newState.hora_inicio || oldState.hora_fin !== newState.hora_fin) {
                    cambios.push(`Hora: ${oldState.hora_inicio.slice(0,5)}→${newState.hora_inicio.slice(0,5)}`);
                  }
                  if (oldState.aula_id !== newState.aula_id) cambios.push(`Aula`);
                  if (oldState.dia_semana !== newState.dia_semana) cambios.push(`Día`);
                  if (oldState.tipo_sesion !== newState.tipo_sesion) cambios.push(`Tipo`);
                  cambioTexto = cambios.length > 0 ? cambios.join(' | ') : 'Modificado';
                } else {
                  cambioTexto = 'Creado';
                }
                versionesMap[h.id] = { version: maxVersion, cambios: cambioTexto };
              }
            }
          } catch {}
        }));
        setHorarioVersiones(versionesMap);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterDia, refreshKey]);

  /* ── Conflictos ── */
  const fetchConflictos = useCallback(async () => {
    setLoadingConf(true);
    try {
      const res = await fetch(`${BASE}/horarios/registered-conflicts/list?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConflictos(data.conflictos ?? []);
      }
    } catch {
      setConflictos([]);
    } finally {
      setLoadingConf(false);
    }
  }, []);

  const resolveConflict = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/horarios/conflicts/${id}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        fetchConflictos();
        addToast({
          type: 'success', 
          title: 'Resuelto', 
          message: 'El conflicto ha sido marcado como resuelto.',
          duration: 3000
        });
      }
    } catch {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: 'No se pudo resolver el conflicto.',
        duration: 3000
      });
    }
  };

  const clearConflicts = async (todos = false) => {
    const result = confirm(todos ? '¿Está seguro que desea borrar todo el historial de conflictos?' : '¿Está seguro que desea limpiar los conflictos resueltos?');

    if (!result) return;

    setClearing(true);
    try {
      const res = await fetch(`${BASE}/horarios/conflicts/clear${todos ? '?todos=true' : ''}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${getToken()}` } 
      });
      if (res.ok) {
        fetchConflictos();
        addToast({ 
          type: 'success', 
          title: 'Historial Limpio',
          duration: 3000
        });
      }
    } catch {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: 'No se pudo limpiar el historial.',
        duration: 3000
      });
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => { fetchHorarios(); }, [fetchHorarios]);
  useEffect(() => { fetchConflictos(); }, [fetchConflictos]);

  /* ── Listas para filtros ── */
  const uniqueDocentes = Array.from(new Map(horarios.filter(h => h.asignacion?.docente).map(h => {
    const d = h.asignacion!.docente!;
    return [d.codigo_docente, d.user ? `${d.user.nombre} ${d.user.apellido}` : d.codigo_docente];
  })).entries()).sort((a,b) => a[1].localeCompare(b[1]));

  const uniqueAulas = Array.from(new Map(horarios.filter(h => h.aula).map(h => [h.aula!.codigo_aula, h.aula!.nombre])).entries()).sort((a,b) => a[1].localeCompare(b[1]));
  const uniqueGrupos = Array.from(new Map(horarios.filter(h => h.asignacion?.grupo).map(h => [h.asignacion!.grupo!.codigo_grupo, h.asignacion!.grupo!.nombre])).entries()).sort((a,b) => a[1].localeCompare(b[1]));
  const uniqueMaterias = Array.from(new Map(horarios.filter(h => h.asignacion?.materia).map(h => [h.asignacion!.materia!.codigo_materia, h.asignacion!.materia!.nombre])).entries()).sort((a,b) => a[1].localeCompare(b[1]));
  const uniqueDepartamentos = Array.from(new Set(horarios.map(h => h.asignacion?.docente?.departamento).filter((d): d is string => !!d))).sort();

  const horariosFiltrados = horarios.filter(h => {
    if (cicloInput && !h.asignacion?.ciclo_escolar?.toLowerCase().includes(cicloInput.toLowerCase())) return false;
    if (filterDocente && h.asignacion?.docente?.codigo_docente !== filterDocente) return false;
    if (filterAula && h.aula?.codigo_aula !== filterAula) return false;
    if (filterGrupo && h.asignacion?.grupo?.codigo_grupo !== filterGrupo) return false;
    if (filterMateria && h.asignacion?.materia?.codigo_materia !== filterMateria) return false;
    if (filterDepartamento && h.asignacion?.docente?.departamento !== filterDepartamento) return false;
    return true;
  });

  /* ── Construcción del Grid Map con rowSpan ──────────────────────────
     Estructura: dia → hora → lista de { horario, rowSpan, isStart, blocked }
     - isStart=true  → se renderiza la celda (con rowSpan indicado)
     - isStart=false → esa hora está "bloqueada" por una celda anterior (no se renderiza)
  ── */
  interface GridCell { horario: HorarioResponse; rowSpan: number; isStart: boolean; }

  // Para cada día, mapeamos hora → lista de celdas
  const gridMap = new Map<string, Map<number, GridCell[]>>();
  DAYS.forEach(({ value }) => gridMap.set(value, new Map()));

  // Rastreamos qué celdas están bloqueadas (hora ya cubierta por un rowSpan anterior)
  // blocked: dia → hora → Set de horario_ids ya pintados
  const blocked = new Map<string, Map<number, Set<number>>>();
  DAYS.forEach(({ value }) => blocked.set(value, new Map()));

  horariosFiltrados.filter(h => h.activo).forEach(h => {
    const dayMap   = gridMap.get(h.dia_semana)!;
    const blockMap = blocked.get(h.dia_semana)!;
    const startH   = timeToHour(h.hora_inicio);
    const endH     = timeToHour(h.hora_fin);
    const span     = Math.max(1, endH - startH);

    // Registrar la celda de inicio (rowSpan real)
    if (!dayMap.has(startH)) dayMap.set(startH, []);
    dayMap.get(startH)!.push({ horario: h, rowSpan: span, isStart: true });

    // Marcar las horas siguientes como bloqueadas
    for (let hh = startH + 1; hh < endH; hh++) {
      if (!blockMap.has(hh)) blockMap.set(hh, new Set());
      blockMap.get(hh)!.add(h.id);
    }
  });

  /* ── Renderizado: Vista Listado ── */
  const renderList = () => (
    <div className="bg-[#0a1532]/40 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden mt-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="text-left px-6 py-5 font-black text-white/30 uppercase tracking-[0.2em] text-[10px]">Agenda / Ciclo</th>
              <th className="text-left px-6 py-5 font-black text-white/30 uppercase tracking-[0.2em] text-[10px]">Horario Académico</th>
              <th className="text-left px-6 py-5 font-black text-white/30 uppercase tracking-[0.2em] text-[10px]">Materia / Grupo</th>
              <th className="text-left px-6 py-5 font-black text-white/30 uppercase tracking-[0.2em] text-[10px]">Docente Asignado</th>
              <th className="text-left px-6 py-5 font-black text-white/30 uppercase tracking-[0.2em] text-[10px]">Espacio Físico</th>
              <th className="text-center px-6 py-5 font-black text-white/30 uppercase tracking-[0.2em] text-[10px]">Histórico</th>
              <th className="text-center px-6 py-5 font-black text-white/30 uppercase tracking-[0.2em] text-[10px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {horariosFiltrados.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-20 opacity-20"><Bookmark size={48} className="mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-widest">No se encontraron sesiones</p></td></tr>
            ) : (
              [...horariosFiltrados].sort((a,b) => {
                const di = DAYS.findIndex(d => d.value === a.dia_semana) - DAYS.findIndex(d => d.value === b.dia_semana);
                return di !== 0 ? di : a.hora_inicio.localeCompare(b.hora_inicio);
              }).map((h) => (
                <tr key={h.id} onClick={() => setDetailId(h.id)} className={`group hover:bg-white/[0.03] cursor-pointer transition-all duration-300 ${!h.activo ? 'opacity-40' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="text-xs font-black text-white uppercase tracking-widest capitalize">{h.dia_semana}</div>
                    <div className="text-[10px] text-white/30 font-bold mt-1 tracking-wider">{h.asignacion?.ciclo_escolar}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <Clock size={12} className="text-blue-400 opacity-70" />
                       <span className="text-sm font-black text-white font-mono tracking-tight">{h.hora_inicio.slice(0,5)} – {h.hora_fin.slice(0,5)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[220px]">{h.asignacion?.materia?.nombre}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                       <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-black text-white/40 uppercase tracking-widest border border-white/5">{h.asignacion?.grupo?.nombre}</span>
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${TIPO_COLORS[h.tipo_sesion] || 'bg-white/10 text-white/40 border-white/5'}`}>{TIPO_LABEL[h.tipo_sesion] || h.tipo_sesion}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-white/80">{h.asignacion?.docente?.user ? `${h.asignacion.docente.user.nombre} ${h.asignacion.docente.user.apellido}` : h.asignacion?.docente?.codigo_docente}</div>
                    <div className="text-[10px] text-white/20 font-black uppercase tracking-widest truncate max-w-[150px] mt-0.5">{h.asignacion?.docente?.departamento || 'Sin Departamento'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-black text-emerald-400/90">{h.aula?.nombre || '—'}</div>
                    <div className="text-[10px] text-white/30 font-black uppercase tracking-widest">{h.aula?.codigo_aula}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {horarioVersiones[h.id] ? (
                      <div className="flex flex-col items-center gap-1 group/audit relative">
                         <div className="w-7 h-7 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">v{horarioVersiones[h.id].version}</div>
                         <div className="text-[8px] text-white/20 font-bold max-w-[90px] truncate uppercase tracking-tighter" title={horarioVersiones[h.id].cambios}>{horarioVersiones[h.id].cambios}</div>
                      </div>
                    ) : <span className="text-white/5">—</span>}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); setVersionHistoryHorarioId(h.id); setShowVersionHistory(true); }} className="p-2.5 bg-white/5 hover:bg-white/10 text-white/30 hover:text-white rounded-xl border border-white/10 transition-all active:scale-95" title="Auditoría de cambios"><History size={16} /></button>
                       <button className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/10 transition-all active:scale-95" title="Expediente de sesión"><Eye size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Renderizado: Vista Malla (con rowSpan por duración real) ── */
  const renderGrid = () => (
    <div className="bg-[#0a1532]/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden mt-6 animate-in zoom-in-95 duration-500">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="text-xs border-collapse min-w-full">
          <thead>
            <tr className="bg-white/[0.01] border-b border-white/5">
              <th className="px-8 py-6 text-left font-black text-white/30 uppercase tracking-[0.25em] text-[10px] sticky left-0 bg-[#0a1532] z-20">Cronos</th>
              {DAYS.map(({ label, value }) => (!filterDia || filterDia === value) && (
                <th key={value} className="px-4 py-6 text-center font-black text-white uppercase tracking-[0.2em] text-[11px] min-w-[180px]">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hourStr) => {
              const hInt = parseInt(hourStr, 10);
              return (
                <tr key={hourStr} className="border-b border-white/5 hover:bg-white/[0.005]">
                  {/* Columna de hora — altura fija de 80px por franja horaria */}
                  <td
                    className="px-8 font-mono font-black text-white/30 text-xs border-r border-white/5 sticky left-0 bg-[#0a1532]/95 backdrop-blur-md z-10 text-center whitespace-nowrap align-middle"
                    style={{ height: '80px' }}
                  >
                    {hourStr}
                  </td>

                  {DAYS.map(({ value: dayVal }) => {
                    if (filterDia && filterDia !== dayVal) return null;

                    const blockMap   = blocked.get(dayVal)!;
                    const dayMap     = gridMap.get(dayVal)!;
                    const cells      = dayMap.get(hInt) ?? [];
                    const blockedIds = blockMap.get(hInt) ?? new Set<number>();
                    const startCells = cells.filter(c => c.isStart);

                    // Si esta hora está cubierta por el rowSpan de una celda anterior,
                    // NO renderizamos <td> — el navegador fusiona la celda automáticamente.
                    if (startCells.length === 0 && blockedIds.size > 0) return null;

                    return (
                      // rowSpan nativo: 1h → 80px, 2h → 160px, etc.
                      // El browser fusiona las filas; style height fuerza la expansión
                      <td
                        key={dayVal}
                        rowSpan={startCells.length > 0 ? startCells[0].rowSpan : 1}
                        className="px-2 border-r border-white/5 align-stretch"
                        style={startCells.length > 0
                          ? { height: `${startCells[0].rowSpan * 80}px`, verticalAlign: 'stretch', padding: '6px' }
                          : { height: '80px' }}
                      >
                        {startCells.length === 0 ? null : (
                          <div className="flex flex-col gap-1.5" style={{ height: '100%' }}>
                            {startCells.map((cell) => (
                              <div
                                key={cell.horario.id}
                                onClick={() => setDetailId(cell.horario.id)}
                                style={{ flex: 1, minHeight: 0 }}
                                className={`p-3 rounded-[1.5rem] border transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-95 hover:shadow-2xl hover:z-30 relative flex flex-col justify-between overflow-hidden ${
                                  TIPO_COLORS[cell.horario.tipo_sesion] || 'bg-white/5 border-white/10 text-white/60'
                                }`}
                              >
                                <div>
                                  <div className="font-black text-[11px] uppercase tracking-tight leading-tight mb-1.5">
                                    {cell.horario.asignacion?.materia?.nombre}
                                  </div>
                                  <div className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">
                                    {cell.horario.hora_inicio.slice(0,5)} – {cell.horario.hora_fin.slice(0,5)}
                                  </div>
                                  {cell.horario.asignacion?.docente && (
                                    <div className="text-[9px] font-bold opacity-70 mt-1 truncate">
                                      {cell.horario.asignacion.docente.user
                                        ? `${cell.horario.asignacion.docente.user.nombre} ${cell.horario.asignacion.docente.user.apellido}`
                                        : cell.horario.asignacion.docente.codigo_docente}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-black opacity-40 uppercase tracking-tighter mt-1">
                                  <span className="truncate max-w-[65px]">{cell.horario.asignacion?.grupo?.codigo_grupo}</span>
                                  <span className="truncate max-w-[65px] text-right">{cell.horario.aula?.codigo_aula}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── UI Principal ── */
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold shadow-inner";
  const labelClass = "text-[10px] font-black text-white/25 uppercase tracking-[0.3em] mb-2.5 ms-2 block";

  return (
    <div className="p-6 h-full overflow-auto bg-[#081028] text-white custom-scrollbar animate-in fade-in duration-500">
      
      {/* Dynamic Navigation Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 mb-12">
        <div className="flex items-center gap-8">
           <div className="w-16 h-16 bg-blue-600/10 rounded-[1.8rem] border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.1)] flex items-center justify-center group overflow-hidden relative">
              <div className="absolute inset-0 bg-blue-500/5 scale-0 group-hover:scale-100 transition-transform duration-700"></div>
              <Calendar size={32} className="text-blue-500 group-hover:scale-110 transition-transform relative z-10" strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-3">Gestión de Horarios</h1>
              <div className="flex items-center gap-5">
                 <div className="flex items-center gap-2.5 group cursor-pointer" onClick={fetchHorarios}>
                    <RefreshCw size={15} className={`${loading ? 'animate-spin' : ''} text-blue-400/60 group-hover:text-blue-300 transition-colors`} />
                    <span className="text-[11px] font-black text-blue-400/60 uppercase tracking-widest group-hover:text-blue-300">Sincronizar Panel</span>
                 </div>
                 <span className="w-1.5 h-1.5 rounded-full bg-white/5"></span>
                 <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.25em]">{horarios.length} Sesiones Detectadas</p>
              </div>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white/5 p-2.5 rounded-[2.2rem] border border-white/5 shadow-2xl backdrop-blur-md">
          <button onClick={() => setViewMode('grid')} className={`px-7 py-3.5 rounded-[1.4rem] flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-white/35 hover:text-white hover:bg-white/10'}`}>
            <Grid size={18} strokeWidth={2.5} /> Malla
          </button>
          <button onClick={() => setViewMode('list')} className={`px-7 py-3.5 rounded-[1.4rem] flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-white/35 hover:text-white hover:bg-white/10'}`}>
            <List size={18} strokeWidth={2.5} /> Listado
          </button>
          <div className="w-px h-10 bg-white/10 mx-2 hidden sm:block"></div>
          <button onClick={() => setShowConflictosModal(true)} className="px-7 py-3.5 rounded-[1.4rem] flex items-center gap-3 text-xs font-black uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/10 relative group">
            <AlertTriangle size={18} className="group-hover:animate-bounce" /> Conflictos
            {conflictos.filter(c => !c.resuelto).length > 0 && <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse border-2 border-[#0a1532]">{conflictos.filter(c => !c.resuelto).length}</span>}
          </button>
          <button onClick={onAssignClick} className="px-8 py-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[1.4rem] font-black uppercase tracking-widest text-xs hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
            <Plus size={20} strokeWidth={3} /> Nueva Sesión
          </button>
        </div>
      </div>

      {/* Advanced Filter Suite */}
      <div className="bg-[#0a1532]/60 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 shadow-2xl mb-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-48 -mt-48 blur-[100px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000"></div>
        <div className="flex items-center gap-4 mb-10 relative z-10">
           <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner"><Filter size={20} className="text-blue-500" /></div>
           <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.45em]">Módulo de Filtrado Estratégico</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-8 relative z-10">
            {[ 
              { label: 'Ciclo', value: cicloInput, setter: setCicloInput, placeholder: '2026-X', type: 'input' },
              { label: 'Día', value: filterDia, setter: setFilterDia, options: DAYS, type: 'select' },
              { label: 'Docente', value: filterDocente, setter: setFilterDocente, map: uniqueDocentes, type: 'select' },
              { label: 'Aula', value: filterAula, setter: setFilterAula, map: uniqueAulas, type: 'select' },
              { label: 'Grupo', value: filterGrupo, setter: setFilterGrupo, map: uniqueGrupos, type: 'select' },
              { label: 'Materia', value: filterMateria, setter: setFilterMateria, map: uniqueMaterias, type: 'select' },
              { label: 'Departamento', value: filterDepartamento, setter: setFilterDepartamento, options: uniqueDepartamentos, type: 'select' }
            ].map((f, i) => (
              <div key={i}>
                <label className={labelClass}>{f.label}</label>
                {f.type === 'input' ? (
                  <input type="text" value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} className={inputClass} />
                ) : (
                  <select value={f.value} onChange={e => f.setter(e.target.value)} className={inputClass}>
                    <option value="" className="bg-[#0f172a]">Todos</option>
                    {f.options?.map((o: any) => typeof o === 'string' ? <option key={o} value={o} className="bg-[#0f172a]">{o}</option> : <option key={o.value} value={o.value} className="bg-[#0f172a]">{o.label}</option>)}
                    {f.map?.map(([c, n]) => <option key={c} value={c} className="bg-[#0f172a]">{n}</option>)}
                  </select>
                )}
              </div>
            ))}
        </div>
        {(filterDia || cicloInput || filterDocente || filterAula || filterGrupo || filterMateria || filterDepartamento) && (
          <button onClick={() => { setFilterDia(''); setCicloInput(''); setFilterDocente(''); setFilterAula(''); setFilterGrupo(''); setFilterMateria(''); setFilterDepartamento(''); }} className="mt-10 text-[11px] font-black uppercase tracking-widest text-white/20 hover:text-orange-400 transition-all flex items-center gap-3 ms-2 relative z-10 group"><X size={16} className="group-hover:rotate-90 transition-transform duration-500" /> Reiniciar configuración de filtrado</button>
        )}
      </div>

      {/* Main Content Render */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-10 animate-pulse">
          <div className="p-10 bg-blue-500/10 rounded-[3.5rem] border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.1)] relative overflow-hidden group">
             <RefreshCw size={64} className="animate-spin text-blue-500/80" />
             <div className="absolute inset-0 bg-blue-500/5 blur-[40px]"></div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-black uppercase tracking-tight text-white/90 mb-3">Sincronizando Módulo</h3>
            <p className="text-[11px] font-black uppercase tracking-widest text-white/15">Sincronizando con el servidor central y registros de auditoría...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 rounded-[3.5rem] p-16 text-center max-w-2xl mx-auto shadow-[0_0_60px_rgba(239,68,68,0.05)] animate-in zoom-in-95 backdrop-blur-md">
          <AlertCircle size={56} className="mx-auto mb-8 text-red-600/60" />
          <p className="font-black text-2xl uppercase tracking-tighter mb-4">Error de Integridad</p>
          <p className="text-sm opacity-40 leading-relaxed font-bold mb-10 max-w-md mx-auto">{error}</p>
          <button onClick={fetchHorarios} className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-900/20">Reintentar Conexión</button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
           {viewMode === 'grid' ? renderGrid() : renderList()}
        </div>
      )}

      {/* Professional Aesthetics Inject */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 30px; border: 3px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.25); background-clip: content-box; }
      `}</style>

      {/* Modals & Portals */}
      <HorarioDetailModal horarioId={detailId} onClose={() => setDetailId(null)} onSaved={() => { setDetailId(null); fetchHorarios(); }} />
      <VersionHistoryModal horarioId={versionHistoryHorarioId || 0} isOpen={showVersionHistory} onClose={() => setShowVersionHistory(false)} />
      <ConflictosModal
        isOpen={showConflictosModal} onClose={() => setShowConflictosModal(false)}
        conflictos={conflictos} loading={loadingConf} clearing={clearing}
        onRefresh={fetchConflictos} onResolve={resolveConflict}
        onClearResolved={() => clearConflicts(false)} onClearAll={() => clearConflicts(true)}
        onViewHorario={(id) => setDetailId(id)}
      />
    </div>
  );
}
