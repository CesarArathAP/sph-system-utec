import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, Filter, Plus } from 'lucide-react';
import { API_CONFIG } from '../../../services/config';

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
    docente?: { codigo_docente: string; user?: { nombre: string; apellido: string } };
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  /* ── Construir mapa del grid: dia → hora → horarios ──────────────── */
  const gridMap = new Map<string, Map<number, HorarioResponse[]>>();
  DAYS.forEach(({ value }) => gridMap.set(value, new Map()));

  horarios.filter((h) => h.activo).forEach((h) => {
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Día</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Hora</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Materia</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Grupo</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Docente</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Aula</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">Tipo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {horarios.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-gray-400">No hay horarios registrados</td>
            </tr>
          ) : (
            [...horarios].sort((a, b) => {
              const di = DAYS.findIndex(d => d.value === a.dia_semana) - DAYS.findIndex(d => d.value === b.dia_semana);
              return di !== 0 ? di : a.hora_inicio.localeCompare(b.hora_inicio);
            }).map((h) => (
              <tr key={h.id} className={`hover:bg-gray-50 transition ${!h.activo ? 'opacity-40' : ''}`}>
                <td className="px-4 py-3 capitalize text-gray-700">{h.dia_semana}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                  {h.hora_inicio.slice(0, 5)} – {h.hora_fin.slice(0, 5)}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {h.asignacion?.materia?.nombre ?? <span className="text-gray-400">—</span>}
                  {h.asignacion?.materia?.codigo_materia && (
                    <span className="ml-1 text-xs text-gray-400">({h.asignacion.materia.codigo_materia})</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{h.asignacion?.grupo?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700 text-sm">
                  {h.asignacion?.docente?.user
                    ? `${h.asignacion.docente.user.nombre} ${h.asignacion.docente.user.apellido}`
                    : h.asignacion?.docente?.codigo_docente ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{h.aula?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIPO_COLORS[h.tipo_sesion] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {TIPO_LABEL[h.tipo_sesion] ?? h.tipo_sesion}
                  </span>
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
      <table className="text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="px-3 py-3 text-left font-semibold text-gray-600 w-20 sticky left-0 bg-gray-50 z-10">Hora</th>
            {DAYS.map(({ label, value }) =>
              (!filterDia || filterDia === value) ? (
                <th key={value} className="px-2 py-3 text-center font-semibold text-gray-600 min-w-[130px]">
                  {label}
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
                <td className="px-3 py-2 font-mono text-gray-500 text-[11px] border-r border-gray-200 sticky left-0 bg-inherit z-10 whitespace-nowrap">
                  {hourStr}
                </td>
                {DAYS.map(({ value }) => {
                  if (filterDia && filterDia !== value) return null;
                  const cellItems = gridMap.get(value)?.get(hourInt) ?? [];
                  return (
                    <td key={value} className="px-1 py-1 border-r border-gray-100 align-top min-h-[36px]">
                      {cellItems.map((h, idx) => (
                        <div
                          key={`${h.id}-${idx}`}
                          className={`rounded border px-1.5 py-1 mb-0.5 leading-tight cursor-default ${TIPO_COLORS[h.tipo_sesion] ?? 'bg-gray-100 border-gray-200 text-gray-700'}`}
                          title={`${h.asignacion?.materia?.nombre ?? ''} · ${h.asignacion?.grupo?.nombre ?? ''} · ${h.aula?.nombre ?? ''}`}
                        >
                          <div className="font-semibold truncate max-w-[120px]">
                            {h.asignacion?.materia?.nombre ?? 'Sin materia'}
                          </div>
                          <div className="text-[10px] opacity-75 truncate max-w-[120px]">
                            {h.asignacion?.grupo?.codigo_grupo} · {h.aula?.codigo_aula ?? '—'}
                          </div>
                          {h.asignacion?.docente?.user && (
                            <div className="text-[10px] opacity-60 truncate max-w-[120px]">
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
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Calendar className="text-blue-600" size={26} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Horarios</h1>
            <p className="text-gray-500 text-sm">{horarios.length} sesiones registradas</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={fetchHorarios}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition" title="Actualizar">
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
          </button>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition text-gray-600 font-medium">
            {viewMode === 'grid' ? '☰ Lista' : '⊞ Cuadrícula'}
          </button>
          <button onClick={onAssignClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-sm">
            <Plus size={15} /> Nuevo horario
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={filterDia}
            onChange={(e) => setFilterDia(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los días</option>
            {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <input
          type="text"
          value={cicloInput}
          onChange={(e) => setCicloInput(e.target.value)}
          placeholder="Ciclo escolar (p.ej. 2026-1)"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
        />
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
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
                      <p className="text-[10px] text-gray-400 mt-1">Horario #{c.horario_id}</p>
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
    </div>
  );
}
