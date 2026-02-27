import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RefreshCw, Trash2, CalendarDays, X, AlertTriangle, CheckCircle2, Clock, BookOpen, Users, Building2 } from 'lucide-react';
import type { Docente, Disponibilidad } from './logic/types';
import { API_CONFIG } from '../../../services/config';

interface Ocupacion {
  id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  materia_nombre: string;
  grupo_nombre: string;
  aula_nombre: string;
}

interface Horario {
  id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_sesion: string;
  activo: boolean;
  asignacion?: {
    id: number;
    ciclo_escolar: string;
    materia?: { nombre: string; codigo: string };
    grupo?:   { nombre: string; codigo_grupo: string };
    docente?: { codigo_docente: string };
  };
  aula?: { nombre: string; codigo_aula: string };
}

interface DisponibilidadModalProps {
  isOpen:    boolean;
  docente:   Docente | null;
  onClose:   () => void;
  onSaved?:  () => void;
}

/* ─── Grid constantes ───────────────────────────────────────── */
const DAYS = [
  { label: 'Lunes',     value: 'lunes'     },
  { label: 'Martes',    value: 'martes'    },
  { label: 'Miércoles', value: 'miercoles' },
  { label: 'Jueves',    value: 'jueves'    },
  { label: 'Viernes',   value: 'viernes'   },
  { label: 'Sábado',    value: 'sabado'    },
];

const TIME_SLOTS: { label: string; inicio: string; fin: string }[] = [];
for (let h = 7; h < 21; h++) {
  const pad = (n: number) => String(n).padStart(2, '0');
  TIME_SLOTS.push({ label: `${pad(h)}:00 – ${pad(h + 1)}:00`, inicio: `${pad(h)}:00:00`, fin: `${pad(h + 1)}:00:00` });
}

const DIAS_ORDEN = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIAS_LABEL: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb',
};

const TIPO_CARD: Record<string, string> = {
  teorica:     'bg-blue-500/20   border-blue-400/30   text-blue-100',
  practica:    'bg-emerald-500/20 border-emerald-400/30 text-emerald-100',
  laboratorio: 'bg-violet-500/20  border-violet-400/30  text-violet-100',
};
const TIPO_BADGE: Record<string, string> = {
  teorica:     'bg-blue-400/20   text-blue-300',
  practica:    'bg-emerald-400/20 text-emerald-300',
  laboratorio: 'bg-violet-400/20  text-violet-300',
};

/* ─── Helpers ───────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCENTES}`;
const BASE_HORARIOS = API_CONFIG.BASE_URL;

function buildSelectedSet(disponibilidades: Disponibilidad[]): Set<string> {
  return new Set(disponibilidades.map(d => `${d.dia_semana}|${d.hora_inicio}`));
}

async function fetchHorariosDocente(docenteId: number): Promise<Horario[]> {
  const asigRes = await fetch(
    `${BASE_HORARIOS}/asignaciones?docente_id=${docenteId}&page=1&page_size=100`,
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  if (!asigRes.ok) throw new Error(`Error fetching asignaciones: ${asigRes.status}`);
  const asigData = await asigRes.json();
  const asignaciones: { id: number }[] = asigData.asignaciones ?? [];
  if (asignaciones.length === 0) return [];

  const results = await Promise.all(
    asignaciones.map(async a => {
      const r = await fetch(
        `${BASE_HORARIOS}/horarios?asignacion_id=${a.id}&page=1&page_size=50&activo=true`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!r.ok) return [];
      const d = await r.json();
      return (d.horarios ?? []) as Horario[];
    })
  );
  return results.flat();
}

/* ─── Componente ────────────────────────────────────────────── */
export default function DisponibilidadModal({ isOpen, docente, onClose, onSaved }: DisponibilidadModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [ocupacionesData, setOcupacionesData] = useState<Ocupacion[]>([]);
  const [hoveredOcupacion, setHoveredOcupacion] = useState<Ocupacion | null>(null);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !docente) return;
    setSelected(buildSelectedSet(docente.disponibilidades ?? []));
    setError(null);
    
    // Cargar ocupaciones y horarios
    loadOcupaciones();
    loadHorarios();
  }, [isOpen, docente]);

  const loadHorarios = async () => {
    if (!docente?.id) return;
    try {
      const h = await fetchHorariosDocente(docente.id);
      setHorarios(h);
    } catch (e: any) {
      console.error("Error loading horarios:", e);
    }
  };

  const loadOcupaciones = async () => {
    if (!docente?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/${docente.id}/ocupaciones`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      
      const ocupaciones: Ocupacion[] = await res.json();
      setOcupacionesData(ocupaciones);
      
      const ocupadasSet = new Set<string>();
      
      // Construir set de ocupaciones - marcar TODOS los slots dentro del rango
      for (const ocu of ocupaciones) {
        const horaInicioObj = new Date(`2000-01-01T${ocu.hora_inicio}`);
        const horaFinObj = new Date(`2000-01-01T${ocu.hora_fin}`);
        
        // Iterar a través de TODOS los TIME_SLOTS
        for (const slot of TIME_SLOTS) {
          const slotInicioObj = new Date(`2000-01-01T${slot.inicio}`);
          
          // Si el slot está dentro del rango [hora_inicio, hora_fin), marcarlo como ocupado
          if (slotInicioObj >= horaInicioObj && slotInicioObj < horaFinObj) {
            const key = `${ocu.dia_semana}|${slot.inicio}`;
            ocupadasSet.add(key);
          }
        }
      }
      
      setOcupadas(ocupadasSet);
    } catch (e: any) {
      // No mostrar error si falla cargar ocupaciones, solo continuar sin ellas
      console.error("Error loading ocupaciones:", e);
    } finally {
      setLoading(false);
    }
  };

  // Obtener la ocupación para un slot específico
  const getOcupacionForSlot = (dia: string, slotInicio: string): Ocupacion | null => {
    return ocupacionesData.find(ocu => {
      const horaInicioObj = new Date(`2000-01-01T${ocu.hora_inicio}`);
      const horaFinObj = new Date(`2000-01-01T${ocu.hora_fin}`);
      const slotInicioObj = new Date(`2000-01-01T${slotInicio}`);
      
      return ocu.dia_semana === dia && 
             slotInicioObj >= horaInicioObj && 
             slotInicioObj < horaFinObj;
    }) || null;
  };

  const toggleSlot = (day: string, inicio: string) => {
    const key = `${day}|${inicio}`;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleFillAll = () => {
    if (!docente) return;
    const maxHoras = docente.horas_maximas_semana || 40;
    const newSelected = new Set<string>();
    const centralHours  = TIME_SLOTS.filter(s => { const h = parseInt(s.inicio); return h >= 9 && h < 17; });
    const morningHours  = TIME_SLOTS.filter(s => { const h = parseInt(s.inicio); return h >= 7 && h < 9; });
    const eveningHours  = TIME_SLOTS.filter(s => { const h = parseInt(s.inicio); return h >= 17 && h < 21; });
    let total = 0;
    const maxDia = Math.ceil(maxHoras / 5);
    for (const day of DAYS) {
      if (total >= maxHoras) break;
      let dia = 0;
      for (const slot of [...centralHours, ...morningHours, ...eveningHours]) {
        if (dia >= maxDia || total >= maxHoras) break;
        newSelected.add(`${day.value}|${slot.inicio}`);
        dia++; total++;
      }
    }
    setSelected(newSelected);
  };

  const handleClearAll = () => setSelected(new Set());

  const handleSave = async () => {
    if (!docente?.id) return;
    setSaving(true); setError(null);
    const payload = Array.from(selected).map(key => {
      const [dia_semana, hora_inicio] = key.split('|');
      const slot = TIME_SLOTS.find(s => s.inicio === hora_inicio)!;
      return { dia_semana, hora_inicio, hora_fin: slot.fin };
    });
    try {
      const res = await fetch(`${BASE}/${docente.id}/disponibilidad`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? `Error ${res.status}`);
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const maxHoras          = docente?.horas_maximas_semana || 40;
  const horasSel          = selected.size;
  const exceedsMax        = horasSel > maxHoras;
  const horasExcedidas    = horasSel - maxHoras;
  const pct               = Math.min((horasSel / maxHoras) * 100, 100);
  const nombreDocente     = docente?.user
    ? `${docente.user.nombre} ${docente.user.apellido}`
    : docente?.codigo_docente ?? '';

  return (
    <Dialog.Root open={isOpen && !!docente} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />

        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col
                     rounded-2xl shadow-2xl focus:outline-none
                     bg-[linear-gradient(145deg,#081d54ee,#0d3494ee)]
                     backdrop-blur-xl border border-white/20"
          onEscapeKeyDown={onClose}
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 flex items-start justify-between border-b border-white/15
                          bg-[linear-gradient(135deg,#0a2a6e,#0d3494)] rounded-t-2xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 border border-white/25">
                <CalendarDays size={18} className="text-white" />
              </div>
              <div>
                <Dialog.Title className="text-white font-bold text-base leading-tight">
                  Disponibilidad del Docente
                </Dialog.Title>
                {docente && (
                  <p className="text-blue-200 text-xs mt-0.5">
                    {nombreDocente}
                    {docente.codigo_docente ? ` — ${docente.codigo_docente}` : ''}
                    {docente.departamento   ? ` · ${docente.departamento}`   : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Contador */}
              <div className="text-right">
                <p className={`text-lg font-bold leading-none ${exceedsMax ? 'text-red-400' : 'text-white'}`}>
                  {horasSel}<span className="text-white/50 text-sm font-normal">/{maxHoras}h</span>
                </p>
                <div className="w-24 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${exceedsMax ? 'bg-red-400' : 'bg-emerald-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <Dialog.Close onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="px-6 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
            <p className="text-white/50 text-xs">Haz clic en las celdas para marcar tu disponibilidad horaria.</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleFillAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                           bg-emerald-500/20 text-emerald-300 border border-emerald-400/30
                           hover:bg-emerald-500/30 transition cursor-pointer">
                <CheckCircle2 size={12} /> Llenar todo
              </button>
              <button type="button" onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                           bg-red-500/20 text-red-300 border border-red-400/30
                           hover:bg-red-500/30 transition cursor-pointer">
                <Trash2 size={12} /> Limpiar
              </button>
            </div>
          </div>

          {/* ── Alertas ── */}
          {(error || exceedsMax) && (
            <div className="px-6 pt-3 shrink-0 space-y-2">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-2.5 text-sm">
                  <AlertTriangle size={15} className="shrink-0" />{error}
                </div>
              )}
              {exceedsMax && (
                <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-xl px-4 py-2.5 text-sm">
                  <AlertTriangle size={15} className="shrink-0" />
                  Excedes el límite en <strong>{horasExcedidas}h</strong>. Máximo permitido: {maxHoras}h.
                </div>
              )}
            </div>
          )}

          {/* ── Tabla ── */}
          <div className="overflow-auto flex-1 p-6">
            <div className="rounded-xl overflow-hidden border border-white/15 min-w-max">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/10">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-white/60 w-36 whitespace-nowrap">Horario</th>
                    {DAYS.map(day => (
                      <th key={day.value} className="text-center py-3 px-4 text-xs font-semibold text-white/80 whitespace-nowrap">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, i) => (
                    <tr key={slot.inicio}
                      className={`border-t border-white/[0.06] ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.03]'}`}>
                      <td className="py-2 px-4 text-xs font-medium text-white/50 whitespace-nowrap">{slot.label}</td>
                      {DAYS.map(day => {
                        const key = `${day.value}|${slot.inicio}`;
                        const isSel = selected.has(key);
                        const isOcupada = ocupadas.has(key);
                        const ocupacion = isOcupada ? getOcupacionForSlot(day.value, slot.inicio) : null;
                        
                        return (
                          <td key={key} className="py-1.5 px-2 text-center relative">
                            <button
                              type="button"
                              onClick={() => toggleSlot(day.value, slot.inicio)}
                              disabled={isOcupada}
                              onMouseEnter={() => ocupacion && setHoveredOcupacion(ocupacion)}
                              onMouseLeave={() => setHoveredOcupacion(null)}
                              className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer
                                ${isOcupada
                                  ? 'bg-yellow-500/40 text-yellow-300 border border-yellow-400/50 cursor-not-allowed hover:bg-yellow-500/50'
                                  : isSel
                                  ? 'bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.5)] scale-105'
                                  : 'bg-white/5 text-white/20 hover:bg-white/15 hover:text-white/60 border border-white/10'}`}
                              title={isOcupada 
                                ? 'Ocupado — esta sesión ya está asignada' 
                                : isSel 
                                ? 'Disponible — clic para quitar' 
                                : 'No disponible — clic para marcar'}
                            >
                              {isOcupada ? '⊗' : isSel ? '✓' : '–'}
                            </button>
                            
                            {/* Tooltip con info de sesión */}
                            {hoveredOcupacion && ocupacion === hoveredOcupacion && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                                <div className="bg-gray-900 border border-yellow-400/50 rounded-lg px-3 py-2 whitespace-nowrap text-xs shadow-lg">
                                  <p className="text-yellow-300 font-semibold">{ocupacion.materia_nombre}</p>
                                  <p className="text-white/80">Grupo: {ocupacion.grupo_nombre}</p>
                                  <p className="text-white/80">Aula: {ocupacion.aula_nombre}</p>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-yellow-400/50 -rotate-45"></div>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex gap-5 text-xs text-white/40 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-md shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500/40 border border-yellow-400/50 rounded-md" />
                <span>Ocupado (sesión asignada)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white/10 border border-white/15 rounded-md" />
                <span>No disponible</span>
              </div>
            </div>

            {/* SECCIÓN DE HORARIOS */}
            {horarios.length > 0 && (
              <>
                <div className="border-t border-white/10 mt-6 pt-6">
                  <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-4">Horarios de la semana</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {DIAS_ORDEN.map(dia => {
                      const sesionesDelDia = horarios.filter(h => h.dia_semana?.toLowerCase() === dia);
                      const tieneS = sesionesDelDia.length > 0;
                      
                      return (
                        <div key={dia} className="flex flex-col gap-2">
                          {/* Cabecera día */}
                          <div className={`text-center py-2 px-1 rounded-xl text-xs font-bold uppercase tracking-wider
                            ${tieneS
                              ? 'bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)] text-white shadow-[0_2px_12px_rgba(15,63,196,0.35)]'
                              : 'bg-white/5 text-white/25 border border-white/10'}`}>
                            {DIAS_LABEL[dia]}
                            {tieneS && (
                              <span className="block text-[10px] font-normal text-blue-200 mt-0.5">
                                {sesionesDelDia.length} sesión{sesionesDelDia.length !== 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>

                          {/* Sesiones */}
                          {sesionesDelDia.length === 0 ? (
                            <div className="flex-1 border border-dashed border-white/10 rounded-xl flex items-center justify-center min-h-[80px]">
                              <span className="text-xs text-white/20">Libre</span>
                            </div>
                          ) : (
                            sesionesDelDia.map(h => {
                              const cardCls  = TIPO_CARD[h.tipo_sesion]  ?? 'bg-white/10 border-white/15 text-white/70';
                              const badgeCls = TIPO_BADGE[h.tipo_sesion] ?? 'bg-white/10 text-white/50';
                              
                              return (
                                <div key={h.id} className={`border rounded-xl p-3 space-y-1.5 ${cardCls}`}>
                                  {/* Hora */}
                                  <div className="flex items-center gap-1 text-xs font-bold">
                                    <Clock size={10} className="shrink-0 opacity-70" />
                                    {h.hora_inicio.slice(0, 5)} – {h.hora_fin.slice(0, 5)}
                                  </div>
                                  {/* Materia */}
                                  {h.asignacion?.materia && (
                                    <div className="flex items-start gap-1 text-[11px] leading-tight">
                                      <BookOpen size={9} className="shrink-0 mt-0.5 opacity-70" />
                                      <span className="font-semibold line-clamp-2">{h.asignacion.materia.nombre}</span>
                                    </div>
                                  )}
                                  {/* Grupo */}
                                  {h.asignacion?.grupo && (
                                    <div className="flex items-center gap-1 text-[11px] opacity-80">
                                      <Users size={9} className="shrink-0" />
                                      <span>{h.asignacion.grupo.nombre}</span>
                                    </div>
                                  )}
                                  {/* Aula */}
                                  {h.aula && (
                                    <div className="flex items-center gap-1 text-[11px] opacity-80">
                                      <Building2 size={9} className="shrink-0" />
                                      <span>{h.aula.codigo_aula}</span>
                                    </div>
                                  )}
                                  {/* Badge tipo */}
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeCls}`}>
                                    {h.tipo_sesion}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex gap-3 justify-end px-6 py-4 border-t border-white/15 shrink-0
                          bg-white/5 rounded-b-2xl">
            <Dialog.Close asChild>
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/25 text-white/80
                           hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || exceedsMax}
              title={exceedsMax ? `Quita ${horasExcedidas}h para poder guardar` : ''}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer
                ${exceedsMax
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'text-white bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)] hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)] hover:-translate-y-px'
                } disabled:opacity-60`}
            >
              {saving && <RefreshCw size={14} className="animate-spin" />}
              {saving ? 'Guardando...' : 'Guardar disponibilidad'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
