import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, Filter, Plus, Eye, History, List, Grid, AlertCircle, X } from 'lucide-react';
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

/* ── Constantes del grid ────────────────────────────────────────────── */
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
  teorica: 'bg-blue-100 border-blue-300 text-blue-800',
  practica: 'bg-purple-100 border-purple-300 text-purple-800',
  laboratorio: 'bg-green-100 border-green-300 text-green-800',
};

const TIPO_LABEL: Record<string, string> = {
  teorica: 'Teórica', practica: 'Práctica', laboratorio: 'Lab.',
};

const CONFLICTO_COLORS: Record<string, string> = {
  aula_ocupada: 'bg-red-100 text-red-800',
  docente_ocupado: 'bg-orange-100 text-orange-800',
  grupo_ocupado: 'bg-yellow-100 text-yellow-800',
  disponibilidad_docente: 'bg-purple-100 text-purple-800',
};

/* ── Helpers ────────────────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('auth_token') ?? ''; }

const BASE = API_CONFIG.BASE_URL;

function timeToHour(t: string): number {
  return parseInt(t.split(':')[0], 10);
}

/* ── Componente principal ───────────────────────────────────────────── */
interface ScheduleTableProps {
  onAssignClick: () => void;
  refreshKey?: number;   // incrementar para forzar recarga
}

export default function ScheduleTable({ onAssignClick, refreshKey = 0 }: ScheduleTableProps) {
  const [horarios, setHorarios] = useState<HorarioResponse[]>([]);
  const [conflictos, setConflictos] = useState<ConflictoRegistrado[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConf, setLoadingConf] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDia, setFilterDia] = useState<string>('');
  const [cicloInput, setCicloInput] = useState('');
  const [filterDocente, setFilterDocente] = useState('');
  const [filterAula, setFilterAula] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');
  const [filterMateria, setFilterMateria] = useState('');
  const [filterDepartamento, setFilterDepartamento] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [versionHistoryHorarioId, setVersionHistoryHorarioId] = useState<number | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showConflictosModal, setShowConflictosModal] = useState(false);
  const [horarioVersiones, setHorarioVersiones] = useState<Record<number, { version: number; cambios: string }>>({}); // horario_id -> {version, cambios} // horario_id -> {version, cambios}

  /* ── Fetch horarios ───────────────────────────────────────────────── */
  const fetchHorarios = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: '1', page_size: '100' });
      if (filterDia) params.set('dia_semana', filterDia);
      const res = await fetch(`${BASE}/horarios?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setHorarios(data.horarios ?? []);
      
      // Obtener versiones de cada horario
      if (data.horarios && data.horarios.length > 0) {
        const versiones: Record<number, { version: number; cambios: string }> = {};
        for (const h of data.horarios) {
          try {
            const versionRes = await fetch(`${BASE}/horarios/${h.id}/versiones?page=1&page_size=100`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (versionRes.ok) {
              const versionData = await versionRes.json();
              const allVersions = versionData.versiones || [];
              if (allVersions.length > 0) {
                const maxVersion = Math.max(...allVersions.map((v: any) => v.version_numero));
                // Obtener la última versión para mostrar el cambio
                const lastVersion = allVersions.find((v: any) => v.version_numero === maxVersion);
                
                let cambioTexto = '';
                if (lastVersion && lastVersion.estado_anterior) {
                  // Extraer cambios específicos
                  const cambios = [];
                  const oldState = lastVersion.estado_anterior;
                  const newState = lastVersion.estado_nuevo;
                  
                  // Verificar cambios comunes
                  if (oldState.hora_inicio !== newState.hora_inicio || oldState.hora_fin !== newState.hora_fin) {
                    cambios.push(`Hora: ${oldState.hora_inicio}-${oldState.hora_fin} → ${newState.hora_inicio}-${newState.hora_fin}`);
                  }
                  if (oldState.aula_id !== newState.aula_id) {
                    cambios.push(`Aula: ${oldState.aula_id} → ${newState.aula_id}`);
                  }
                  if (oldState.dia_semana !== newState.dia_semana) {
                    cambios.push(`Día: ${oldState.dia_semana} → ${newState.dia_semana}`);
                  }
                  if (oldState.tipo_sesion !== newState.tipo_sesion) {
                    cambios.push(`Tipo: ${oldState.tipo_sesion} → ${newState.tipo_sesion}`);
                  }
                  
                  cambioTexto = cambios.length > 0 ? cambios.join(' | ') : 'Modificado';
                } else {
                  cambioTexto = 'Creado';
                }
                
                versiones[h.id] = { version: maxVersion, cambios: cambioTexto };
              }
            }
          } catch {
            // Ignorar errores de versiones individuales
          }
        }
        setHorarioVersiones(versiones);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterDia, refreshKey]);

  /* ── Fetch conflictos registrados ───────────────────────────────────── */
  const fetchConflictos = useCallback(async () => {
    setLoadingConf(true);
    try {
      // Usamos el endpoint de conflictos REGISTRADOS (tienen ID para poder resolverlos)
      const res = await fetch(`${BASE}/horarios/registered-conflicts/list?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConflictos(data.conflictos ?? []);
    } catch {
      setConflictos([]);
    } finally {
      setLoadingConf(false);
    }
  }, []);

  /* ── Marcar conflicto como resuelto ─────────────────────────────────── */
  const resolveConflict = async (conflictoId: number) => {
    try {
      const res = await fetch(`${BASE}/horarios/conflicts/${conflictoId}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      fetchConflictos();   // refrescar panel
    } catch {
      alert('Error al resolver el conflicto');
    }
  };  /* ── Limpiar historial de conflictos ───────────────────────────────── */
  const clearConflicts = async (todos = false) => {
    const msg = todos
      ? '¿Eliminar TODOS los conflictos (resueltos y pendientes)? Esta acción no se puede deshacer.'
      : '¿Eliminar solo los conflictos ya resueltos del historial?';
    if (!confirm(msg)) return;

    setClearing(true);
    try {
      const res = await fetch(
        `${BASE}/horarios/conflicts/clear${todos ? '?todos=true' : ''}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      alert(data.mensaje);
      fetchConflictos();
    } catch {
      alert('Error al limpiar el historial de conflictos');
    } finally {
      setClearing(false);
    }
  };


  useEffect(() => { fetchHorarios(); }, [fetchHorarios]);
  useEffect(() => { fetchConflictos(); }, [fetchConflictos]);

  /* ── Listas únicas para los selects de filtro ─────────────────────── */
  const uniqueDocentes = Array.from(
    new Map(
      horarios
        .filter(h => h.asignacion?.docente)
        .map(h => {
          const d = h.asignacion!.docente!;
          const label = d.user ? `${d.user.nombre} ${d.user.apellido}` : d.codigo_docente;
          return [d.codigo_docente, label];
        })
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const uniqueAulas = Array.from(
    new Map(
      horarios
        .filter(h => h.aula)
        .map(h => [h.aula!.codigo_aula, h.aula!.nombre])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const uniqueGrupos = Array.from(
    new Map(
      horarios
        .filter(h => h.asignacion?.grupo)
        .map(h => [
          h.asignacion!.grupo!.codigo_grupo,
          h.asignacion!.grupo!.nombre,
        ])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const uniqueMaterias = Array.from(
    new Map(
      horarios
        .filter(h => h.asignacion?.materia)
        .map(h => [
          h.asignacion!.materia!.codigo_materia,
          h.asignacion!.materia!.nombre,
        ])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const uniqueDepartamentos = Array.from(
    new Set(
      horarios
        .map(h => h.asignacion?.docente?.departamento)
        .filter((d): d is string => !!d)
    )
  ).sort((a, b) => a.localeCompare(b));

  /* ── Horarios filtrados (ciclo + docente + aula + grupo + materia + departamento) ── */
  const horariosFiltrados = horarios.filter(h => {
    if (cicloInput && !h.asignacion?.ciclo_escolar?.toLowerCase().includes(cicloInput.toLowerCase())) return false;
    if (filterDocente && h.asignacion?.docente?.codigo_docente !== filterDocente) return false;
    if (filterAula && h.aula?.codigo_aula !== filterAula) return false;
    if (filterGrupo && h.asignacion?.grupo?.codigo_grupo !== filterGrupo) return false;
    if (filterMateria && h.asignacion?.materia?.codigo_materia !== filterMateria) return false;
    if (filterDepartamento && h.asignacion?.docente?.departamento !== filterDepartamento) return false;
    return true;
  });

  /* ── Construir mapa del grid: dia → hora → horarios ──────────────── */
  const gridMap = new Map<string, Map<number, HorarioResponse[]>>();
  DAYS.forEach(({ value }) => gridMap.set(value, new Map()));

  horariosFiltrados.filter((h) => h.activo).forEach((h) => {
    const dayMap = gridMap.get(h.dia_semana);
    if (!dayMap) return;
    const startH = timeToHour(h.hora_inicio);
    const endH = timeToHour(h.hora_fin);
    for (let hh = startH; hh < endH; hh++) {
      const key = hh;
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push(h);
    }
  });

  /* ── Vista lista (tabla simple) ───────────────────────────────────── */
  const renderList = () => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-x-auto">
      <table className="w-full text-xs sm:text-sm border-collapse min-w-max">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
          <tr>
            <th className="text-left px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Día</th>
            <th className="text-left px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Hora</th>
            <th className="text-left px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px] hidden sm:table-cell">Materia</th>
            <th className="text-left px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px] hidden md:table-cell">Grupo</th>
            <th className="text-left px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px] hidden lg:table-cell">Docente</th>
            <th className="text-left px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Aula</th>
            <th className="text-center px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Tipo</th>
            <th className="text-center px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Versión</th>
            <th className="text-center px-4 sm:px-5 py-3.5 font-bold text-gray-700 uppercase tracking-wider text-[11px]">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {horariosFiltrados.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-12 sm:py-16 text-gray-400 px-4">
                <p className="text-sm">📭 No hay horarios que coincidan con los filtros</p>
              </td>
            </tr>
          ) : (
            [...horariosFiltrados].sort((a, b) => {
              const di = DAYS.findIndex(d => d.value === a.dia_semana) - DAYS.findIndex(d => d.value === b.dia_semana);
              return di !== 0 ? di : a.hora_inicio.localeCompare(b.hora_inicio);
            }).map((h) => (
              <tr key={h.id}
                onClick={() => setDetailId(h.id)}
                className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition duration-200 border-l-4 border-transparent group-hover:border-blue-500 ${!h.activo ? 'opacity-50 bg-gray-50' : 'hover:shadow-md'}`}>
                <td className="px-4 sm:px-5 py-3.5 capitalize text-gray-800 font-semibold text-xs sm:text-sm group-hover:text-blue-700 transition">{h.dia_semana}</td>
                <td className="px-4 sm:px-5 py-3.5 text-gray-700 font-mono font-bold text-[11px] sm:text-xs whitespace-nowrap group-hover:text-blue-600">
                  {h.hora_inicio.slice(0, 5)} – {h.hora_fin.slice(0, 5)}
                </td>
                <td className="px-4 sm:px-5 py-3.5 font-semibold text-gray-900 hidden sm:table-cell truncate group-hover:text-blue-800">
                  {h.asignacion?.materia?.nombre ?? <span className="text-gray-400 font-normal">—</span>}
                  {h.asignacion?.materia?.codigo_materia && (
                    <span className="ml-1 text-xs text-gray-500 block sm:inline font-normal">({h.asignacion.materia.codigo_materia})</span>
                  )}
                </td>
                <td className="px-4 sm:px-5 py-3.5 text-gray-800 hidden md:table-cell text-xs sm:text-sm font-medium group-hover:text-blue-700">{h.asignacion?.grupo?.nombre ?? '—'}</td>
                <td className="px-4 sm:px-5 py-3.5 text-gray-700 text-xs hidden lg:table-cell font-medium group-hover:text-blue-600">
                  {h.asignacion?.docente?.user
                    ? `${h.asignacion.docente.user.nombre} ${h.asignacion.docente.user.apellido}`
                    : h.asignacion?.docente?.codigo_docente ?? '—'}
                </td>
                <td className="px-4 sm:px-5 py-3.5 text-gray-700 text-[11px] sm:text-xs truncate font-medium group-hover:text-blue-600">{h.aula?.nombre ?? '—'}</td>
                <td className="px-4 sm:px-5 py-3.5 text-center">
                  <span className={`text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg whitespace-nowrap inline-block transition ${TIPO_COLORS[h.tipo_sesion] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                    {TIPO_LABEL[h.tipo_sesion] ?? h.tipo_sesion}
                  </span>
                </td>
                <td className="px-4 sm:px-5 py-3.5 text-center">
                  {horarioVersiones[h.id] ? (
                    <div className="space-y-1 flex flex-col items-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full text-xs font-bold border border-purple-400 shadow-md group-hover:shadow-lg group-hover:scale-110 transition duration-200">
                        v{horarioVersiones[h.id].version}
                      </div>
                      <p className="text-xs text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs group-hover:text-gray-800" title={horarioVersiones[h.id].cambios}>
                        {horarioVersiones[h.id].cambios}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">—</span>
                  )}
                </td>
                <td className="px-4 sm:px-5 py-3.5 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVersionHistoryHorarioId(h.id);
                      setShowVersionHistory(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-md hover:scale-105 active:scale-95 transition duration-200 text-xs font-bold"
                    title="Ver histórico de cambios"
                  >
                    <History size={14} className="opacity-90" />
                    Historial
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /* ── Vista grid ───────────────────────────────────────────────────── */
  const renderGrid = () => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-x-auto">
      <table className="text-xs border-collapse min-w-full sm:min-w-[700px]">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <th className="px-3 sm:px-4 py-3.5 text-left font-bold text-gray-700 uppercase tracking-wider w-16 sm:w-20 sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10 text-xs sm:text-sm">Hora</th>
            {DAYS.map(({ label, value }) =>
              (!filterDia || filterDia === value) ? (
                <th key={value} className="px-2 sm:px-3 py-3.5 text-center font-bold text-gray-700 uppercase tracking-wider min-w-[100px] sm:min-w-[130px] text-xs sm:text-sm">
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.slice(0, 3)}</span>
                </th>
              ) : null
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {HOURS.map((hourStr, i) => {
            const hourInt = parseInt(hourStr, 10);
            return (
              <tr key={hourStr} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/30 transition duration-200`}>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono font-bold text-gray-700 text-[11px] sm:text-xs border-r-2 border-gray-200 sticky left-0 bg-gradient-to-r from-gray-50 to-white z-10 whitespace-nowrap">
                  {hourStr}
                </td>
                {DAYS.map(({ value }) => {
                  if (filterDia && filterDia !== value) return null;
                  const cellItems = gridMap.get(value)?.get(hourInt) ?? [];
                  return (
                    <td key={value} className="px-1 sm:px-2 py-1.5 sm:py-2 border-r border-gray-100 align-top min-h-[32px] sm:min-h-[44px] bg-gradient-to-b from-transparent to-gray-50/30">
                      {cellItems.length === 0 ? (
                        <div className="text-gray-300 text-[10px] font-light italic">—</div>
                      ) : (
                        cellItems.map((h, idx) => (
                          <div
                            key={`${h.id}-${idx}`}
                            onClick={() => setDetailId(h.id)}
                            className={`rounded-lg border-2 px-1.5 sm:px-2 py-1 mb-1 leading-tight cursor-pointer transition-all duration-200 text-[10px] sm:text-xs font-medium group hover:shadow-md hover:scale-105 hover:z-20 transform ${TIPO_COLORS[h.tipo_sesion] ?? 'bg-gray-100 border-gray-300 text-gray-700'} ${!h.activo ? 'opacity-50 line-through' : ''}`}
                            title={`${h.asignacion?.materia?.nombre ?? ''} · ${h.asignacion?.grupo?.nombre ?? ''} · ${h.aula?.nombre ?? ''}`}
                          >
                            <div className="font-bold truncate max-w-[85px] sm:max-w-[120px] group-hover:text-opacity-100">
                              {h.asignacion?.materia?.nombre ?? 'Sin materia'}
                            </div>
                            <div className="text-[8px] sm:text-[10px] opacity-80 truncate max-w-[85px] sm:max-w-[120px] group-hover:opacity-100">
                              {h.asignacion?.grupo?.codigo_grupo} · {h.aula?.codigo_aula ?? '—'}
                            </div>
                            {h.asignacion?.docente?.user && (
                              <div className="text-[7px] sm:text-[9px] opacity-70 truncate max-w-[85px] sm:max-w-[120px] group-hover:opacity-90 font-normal">
                                👤 {h.asignacion.docente.user.nombre} {h.asignacion.docente.user.apellido.charAt(0)}.
                              </div>
                            )}
                          </div>
                        ))
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
  );

  /* ── UI ─────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 h-full overflow-auto bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="space-y-5 sm:space-y-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition">
              <Calendar className="text-white" size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Horarios</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 font-medium">📅 {horarios.length} sesiones registradas</p>
            </div>
          </div>
          <div className="flex gap-2.5 items-center flex-wrap sm:flex-nowrap">
            <button onClick={fetchHorarios}
              className="p-2.5 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition duration-200 shrink-0 group" title="Actualizar">
              <RefreshCw size={16} className={`${loading ? 'animate-spin text-blue-600' : 'text-gray-500 group-hover:text-blue-600'} w-5 h-5 transition`} />
            </button>
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 border-2 border-gray-200 rounded-lg text-xs sm:text-sm hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-md transition duration-200 text-gray-700 font-bold group">
              {viewMode === 'grid' ? (
                <>
                  <List size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Vista Lista</span>
                  <span className="sm:hidden">Lista</span>
                </>
              ) : (
                <>
                  <Grid size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Vista Grid</span>
                  <span className="sm:hidden">Grid</span>
                </>
              )}
            </button>
            <button onClick={() => setShowConflictosModal(true)}
              className="relative inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 border-2 border-red-300 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 hover:border-red-400 hover:shadow-md font-bold transition duration-200 text-xs sm:text-sm group">
              <AlertTriangle size={16} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Conflictos</span>
              <span className="sm:hidden">Conf.</span>
              {conflictos.filter(c => !c.resuelto).length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {conflictos.filter(c => !c.resuelto).length}
                </span>
              )}
            </button>
            <button onClick={onAssignClick}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 font-bold transition duration-200 text-xs sm:text-sm group transform">
              <Plus size={16} className="group-hover:scale-110 transition-transform" /> 
              <span className="hidden sm:inline">Nuevo horario</span>
              <span className="sm:hidden">+Horario</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Filter size={16} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Filtros avanzados</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Ciclo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Ciclo</label>
              <input
                type="text"
                value={cicloInput}
                onChange={(e) => setCicloInput(e.target.value)}
                placeholder="Ej: 2026-1"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition duration-200"
              />
            </div>

            {/* Día */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Día</label>
              <select
                value={filterDia}
                onChange={(e) => setFilterDia(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition duration-200 bg-white"
              >
                <option value="">Todos los días</option>
                {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Docente */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Docente</label>
              <select
                value={filterDocente}
                onChange={(e) => setFilterDocente(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition duration-200 bg-white"
              >
                <option value="">Todos los docentes</option>
                {uniqueDocentes.map(([codigo, nombre]) => (
                  <option key={codigo} value={codigo}>{nombre}</option>
                ))}
              </select>
            </div>

            {/* Aula */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Aula</label>
              <select
                value={filterAula}
                onChange={(e) => setFilterAula(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition duration-200 bg-white"
              >
                <option value="">Todas las aulas</option>
                {uniqueAulas.map(([codigo, nombre]) => (
                  <option key={codigo} value={codigo}>{nombre}</option>
                ))}
              </select>
            </div>

            {/* Grupo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Grupo</label>
              <select
                value={filterGrupo}
                onChange={(e) => setFilterGrupo(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition duration-200 bg-white"
              >
                <option value="">Todos los grupos</option>
                {uniqueGrupos.map(([codigo, nombre]) => (
                  <option key={codigo} value={codigo}>{nombre}</option>
                ))}
              </select>
            </div>

            {/* Materia */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Materia</label>
              <select
                value={filterMateria}
                onChange={(e) => setFilterMateria(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition duration-200 bg-white"
              >
                <option value="">Todas las materias</option>
                {uniqueMaterias.map(([codigo, nombre]) => (
                  <option key={codigo} value={codigo}>{nombre}</option>
                ))}
              </select>
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Departamento</label>
              <select
                value={filterDepartamento}
                onChange={(e) => setFilterDepartamento(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition duration-200 bg-white"
              >
                <option value="">Todos los departamentos</option>
                {uniqueDepartamentos.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón limpiar filtros (solo si hay alguno activo) */}
          {(filterDia || cicloInput || filterDocente || filterAula || filterGrupo || filterMateria || filterDepartamento) && (
            <button
              onClick={() => {
                setFilterDia('');
                setCicloInput('');
                setFilterDocente('');
                setFilterAula('');
                setFilterGrupo('');
                setFilterMateria('');
                setFilterDepartamento('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-3.5 py-2 rounded-lg transition duration-200 border border-orange-200 hover:border-orange-300"
              title="Limpiar todos los filtros"
            >
              <X size={14} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 rounded-lg px-4 sm:px-5 py-3 text-xs sm:text-sm mb-4 font-medium flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative w-12 h-12">
            <RefreshCw size={40} className="animate-spin text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-semibold">Cargando horarios...</p>
            <p className="text-xs text-gray-500 mt-1">Por favor espere</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="flex gap-4 items-start">
          {/* ── Tabla principal ── */}
          <div className="flex-1 min-w-0">
            {viewMode === 'grid' ? renderGrid() : renderList()}
          </div>
        </div>
      )}

      {/* Modal de detalle de horario */}
      <HorarioDetailModal
        horarioId={detailId}
        onClose={() => setDetailId(null)}
        onSaved={() => { setDetailId(null); fetchHorarios(); }}
      />

      {/* Modal de histórico de versiones */}
      <VersionHistoryModal
        horarioId={versionHistoryHorarioId || 0}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
      />

      {/* Modal de conflictos */}
      <ConflictosModal
        isOpen={showConflictosModal}
        onClose={() => setShowConflictosModal(false)}
        conflictos={conflictos}
        loading={loadingConf}
        clearing={clearing}
        onRefresh={fetchConflictos}
        onResolve={resolveConflict}
        onClearResolved={() => clearConflicts(false)}
        onClearAll={() => clearConflicts(true)}
        onViewHorario={(id) => setDetailId(id)}
      />

    </div>
  );
}
