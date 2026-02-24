import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, Filter, Plus, Eye, History } from 'lucide-react';
import { API_CONFIG } from '../../../services/config';
import HorarioDetailModal from './HorarioDetailModal';
import VersionHistoryModal from './VersionHistoryModal';

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
    <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full text-xs sm:text-sm border-collapse min-w-max">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-2 sm:px-4 py-3 font-semibold text-gray-600">Día</th>
            <th className="text-left px-2 sm:px-4 py-3 font-semibold text-gray-600">Hora</th>
            <th className="text-left px-2 sm:px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Materia</th>
            <th className="text-left px-2 sm:px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Grupo</th>
            <th className="text-left px-2 sm:px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Docente</th>
            <th className="text-left px-2 sm:px-4 py-3 font-semibold text-gray-600">Aula</th>
            <th className="text-center px-2 sm:px-4 py-3 font-semibold text-gray-600">Tipo</th>
            <th className="text-center px-2 sm:px-4 py-3 font-semibold text-gray-600">Versión</th>
            <th className="text-center px-2 sm:px-4 py-3 font-semibold text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {horariosFiltrados.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-8 sm:py-12 text-gray-400 px-4">No hay horarios que coincidan con los filtros</td>
            </tr>
          ) : (
            [...horariosFiltrados].sort((a, b) => {
              const di = DAYS.findIndex(d => d.value === a.dia_semana) - DAYS.findIndex(d => d.value === b.dia_semana);
              return di !== 0 ? di : a.hora_inicio.localeCompare(b.hora_inicio);
            }).map((h) => (
              <tr key={h.id}
                onClick={() => setDetailId(h.id)}
                className={`hover:bg-blue-50 cursor-pointer transition ${!h.activo ? 'opacity-40' : ''}`}>
                <td className="px-2 sm:px-4 py-3 capitalize text-gray-700 font-medium text-xs sm:text-sm">{h.dia_semana}</td>
                <td className="px-2 sm:px-4 py-3 text-gray-600 font-mono text-[11px] sm:text-xs whitespace-nowrap">
                  {h.hora_inicio.slice(0, 5)} – {h.hora_fin.slice(0, 5)}
                </td>
                <td className="px-2 sm:px-4 py-3 font-medium text-gray-800 hidden sm:table-cell truncate">
                  {h.asignacion?.materia?.nombre ?? <span className="text-gray-400">—</span>}
                  {h.asignacion?.materia?.codigo_materia && (
                    <span className="ml-1 text-xs text-gray-400 block sm:inline">({h.asignacion.materia.codigo_materia})</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-3 text-gray-700 hidden md:table-cell text-xs sm:text-sm">{h.asignacion?.grupo?.nombre ?? '—'}</td>
                <td className="px-2 sm:px-4 py-3 text-gray-700 text-xs hidden lg:table-cell">
                  {h.asignacion?.docente?.user
                    ? `${h.asignacion.docente.user.nombre} ${h.asignacion.docente.user.apellido}`
                    : h.asignacion?.docente?.codigo_docente ?? '—'}
                </td>
                <td className="px-2 sm:px-4 py-3 text-gray-600 text-[11px] sm:text-xs truncate">{h.aula?.nombre ?? '—'}</td>
                <td className="px-2 sm:px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border whitespace-nowrap inline-block ${TIPO_COLORS[h.tipo_sesion] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {TIPO_LABEL[h.tipo_sesion] ?? h.tipo_sesion}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3 text-center">
                  {horarioVersiones[h.id] ? (
                    <div className="space-y-1">
                      <div className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-300">
                        v{horarioVersiones[h.id].version}
                      </div>
                      <p className="text-xs text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs" title={horarioVersiones[h.id].cambios}>
                        {horarioVersiones[h.id].cambios}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVersionHistoryHorarioId(h.id);
                      setShowVersionHistory(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-xs font-semibold"
                    title="Ver histórico de cambios"
                  >
                    <History size={16} />
                    Ver
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
    <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-x-auto">
      <table className="text-xs border-collapse min-w-full sm:min-w-[700px]">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-semibold text-gray-600 w-16 sm:w-20 sticky left-0 bg-gray-50 z-10 text-xs sm:text-sm">Hora</th>
            {DAYS.map(({ label, value }) =>
              (!filterDia || filterDia === value) ? (
                <th key={value} className="px-1 sm:px-2 py-2 sm:py-3 text-center font-semibold text-gray-600 min-w-[100px] sm:min-w-[130px] text-xs sm:text-sm">
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.slice(0, 3)}</span>
                </th>
              ) : null
            )}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hourStr, i) => {
            const hourInt = parseInt(hourStr, 10);
            return (
              <tr key={hourStr} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                <td className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-gray-500 text-[10px] sm:text-[11px] border-r border-gray-200 sticky left-0 bg-inherit z-10 whitespace-nowrap">
                  {hourStr}
                </td>
                {DAYS.map(({ value }) => {
                  if (filterDia && filterDia !== value) return null;
                  const cellItems = gridMap.get(value)?.get(hourInt) ?? [];
                  return (
                    <td key={value} className="px-0.5 sm:px-1 py-0.5 sm:py-1 border-r border-gray-100 align-top min-h-[28px] sm:min-h-[36px]">
                      {cellItems.map((h, idx) => (
                        <div
                          key={`${h.id}-${idx}`}
                          onClick={() => setDetailId(h.id)}
                          className={`rounded border px-1 sm:px-1.5 py-0.5 sm:py-1 mb-0.5 leading-tight cursor-pointer hover:brightness-95 transition-all text-[10px] sm:text-xs ${TIPO_COLORS[h.tipo_sesion] ?? 'bg-gray-100 border-gray-200 text-gray-700'}`}
                          title={`${h.asignacion?.materia?.nombre ?? ''} · ${h.asignacion?.grupo?.nombre ?? ''} · ${h.aula?.nombre ?? ''}`}
                        >
                          <div className="font-semibold truncate max-w-[90px] sm:max-w-[120px]">
                            {h.asignacion?.materia?.nombre ?? 'Sin materia'}
                          </div>
                          <div className="text-[9px] sm:text-[10px] opacity-75 truncate max-w-[90px] sm:max-w-[120px]">
                            {h.asignacion?.grupo?.codigo_grupo} · {h.aula?.codigo_aula ?? '—'}
                          </div>
                          {h.asignacion?.docente?.user && (
                            <div className="text-[8px] sm:text-[10px] opacity-60 truncate max-w-[90px] sm:max-w-[120px]">
                              {h.asignacion.docente.user.nombre} {h.asignacion.docente.user.apellido.charAt(0)}.
                            </div>
                          )}
                        </div>
                      ))}
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
    <div className="p-4 sm:p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Calendar className="text-blue-600 shrink-0" size={24} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Horarios</h1>
            <p className="text-gray-500 text-xs sm:text-sm">{horarios.length} sesiones registradas</p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
          <button onClick={fetchHorarios}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition shrink-0" title="Actualizar">
            <RefreshCw size={14} className={`${loading ? 'animate-spin text-blue-500' : 'text-gray-500'} w-4 h-4 sm:w-5 sm:h-5`} />
          </button>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition text-gray-600 font-medium">
            {viewMode === 'grid' ? '☰ Lista' : '⊞ Cuad.'}
          </button>
          <button onClick={onAssignClick}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-xs sm:text-sm">
            <Plus size={14} /> <span className="hidden sm:inline">Nuevo horario</span><span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5 flex-wrap items-center">
        {/* Icono filtro */}
        <Filter size={14} className="text-gray-400 shrink-0" />

        {/* Día */}
        <select
          value={filterDia}
          onChange={(e) => setFilterDia(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Filtrar por día"
        >
          <option value="">Todos los días</option>
          {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        {/* Ciclo */}
        <input
          type="text"
          value={cicloInput}
          onChange={(e) => setCicloInput(e.target.value)}
          placeholder="Ciclo (ej. 2026-1)"
          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 sm:w-40 min-w-0"
          title="Filtrar por ciclo escolar"
        />

        {/* Docente */}
        <select
          value={filterDocente}
          onChange={(e) => setFilterDocente(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[160px] sm:max-w-[200px]"
          title="Filtrar por docente"
        >
          <option value="">Todos los docentes</option>
          {uniqueDocentes.map(([codigo, nombre]) => (
            <option key={codigo} value={codigo}>{nombre}</option>
          ))}
        </select>

        {/* Aula */}
        <select
          value={filterAula}
          onChange={(e) => setFilterAula(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px]"
          title="Filtrar por aula"
        >
          <option value="">Todas las aulas</option>
          {uniqueAulas.map(([codigo, nombre]) => (
            <option key={codigo} value={codigo}>{nombre}</option>
          ))}
        </select>

        {/* Grupo */}
        <select
          value={filterGrupo}
          onChange={(e) => setFilterGrupo(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px]"
          title="Filtrar por grupo"
        >
          <option value="">Todos los grupos</option>
          {uniqueGrupos.map(([codigo, nombre]) => (
            <option key={codigo} value={codigo}>{nombre}</option>
          ))}
        </select>

        {/* Materia */}
        <select
          value={filterMateria}
          onChange={(e) => setFilterMateria(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px]"
          title="Filtrar por materia"
        >
          <option value="">Todas las materias</option>
          {uniqueMaterias.map(([codigo, nombre]) => (
            <option key={codigo} value={codigo}>{nombre}</option>
          ))}
        </select>

        {/* Departamento */}
        <select
          value={filterDepartamento}
          onChange={(e) => setFilterDepartamento(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px]"
          title="Filtrar por departamento"
        >
          <option value="">Todos los departamentos</option>
          {uniqueDepartamentos.map((dep) => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>

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
            className="text-xs text-gray-500 hover:text-red-500 underline transition shrink-0"
            title="Limpiar todos los filtros"
          >
            × Limpiar filtros
          </button>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm mb-4">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {!loading && !error && (
        <div className="flex gap-4 items-start">
          {/* ── Tabla principal ── */}
          <div className="flex-1 min-w-0">
            {viewMode === 'grid' ? renderGrid() : renderList()}
          </div>

          {/* ── Panel de conflictos ── */}
          <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-red-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <AlertTriangle size={15} />
                Conflictos detectados
              </div>
              <div className="flex items-center gap-2">
                {loadingConf || clearing
                  ? <RefreshCw size={13} className="animate-spin text-red-200" />
                  : (
                    <button onClick={fetchConflictos} title="Refrescar conflictos"
                      className="text-red-200 hover:text-white transition">
                      <RefreshCw size={13} />
                    </button>
                  )
                }
                {/* Dropdown Limpiar */}
                <div className="relative group">
                  <button
                    title="Limpiar historial"
                    disabled={clearing || conflictos.length === 0}
                    className="text-red-200 hover:text-white transition text-xs font-semibold px-2 py-0.5 rounded border border-red-400 hover:border-red-200 disabled:opacity-40"
                  >
                    Limpiar ▾
                  </button>
                  {/* Menú desplegable */}
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50
                                  invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <button
                      type="button"
                      onClick={() => clearConflicts(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                    >
                      <span className="text-green-500">✓</span>
                      Limpiar resueltos
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => clearConflicts(true)}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg font-medium"
                    >
                      <span>⚠</span>
                      Limpiar todo el historial
                    </button>
                  </div>
                </div>
                {conflictos.length > 0 && (
                  <span className="bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {conflictos.length}
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {conflictos.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-gray-400">
                  <CheckCircle size={28} className="text-green-400" />
                  Sin conflictos registrados
                </div>
              ) : (
                conflictos.map((c) => (
                  <div key={c.id} className={`px-3 py-3 transition ${c.resuelto ? 'bg-green-50' : 'bg-white'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${c.resuelto
                        ? 'bg-green-100 text-green-700'
                        : CONFLICTO_COLORS[c.tipo_conflicto] ?? 'bg-gray-100 text-gray-600'
                        }`}>
                        {c.tipo_conflicto.replace('_', ' ')}
                      </span>
                      {/* Botón Resolver */}
                      {!c.resuelto && (
                        <button
                          type="button"
                          onClick={() => resolveConflict(c.id)}
                          title="Marcar como resuelto"
                          className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                        >
                          ✓ Resolver
                        </button>
                      )}
                      {c.resuelto && (
                        <span className="shrink-0 text-[10px] text-green-600 font-semibold">✓ Resuelto</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 leading-tight">{c.descripcion}</p>
                    {c.horario_id && (
                      <button
                        onClick={() => setDetailId(c.horario_id!)}
                        className="text-[10px] text-blue-500 hover:underline mt-1 flex items-center gap-1"
                      >
                        <Eye size={10} /> Ver horario #{c.horario_id}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-500 flex justify-between">
              <span>Total: {conflictos.length}</span>
              <span className={conflictos.filter(c => !c.resuelto).length > 0 ? 'text-red-500 font-medium' : 'text-green-600'}>
                {conflictos.filter(c => !c.resuelto).length > 0
                  ? `⚠ ${conflictos.filter(c => !c.resuelto).length} pendiente(s)`
                  : '✓ Todo OK'}
              </span>
            </div>
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

    </div>
  );
}
