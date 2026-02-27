import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, X } from 'lucide-react';
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

interface DisponibilidadViewModalProps {
  isOpen:  boolean;
  docente: Docente | null;
  onClose: () => void;
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

const TIME_SLOTS: { label: string; inicio: string }[] = [];
for (let h = 7; h < 21; h++) {
  const pad = (n: number) => String(n).padStart(2, '0');
  TIME_SLOTS.push({ label: `${pad(h)}:00 – ${pad(h + 1)}:00`, inicio: `${pad(h)}:00:00` });
}

function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCENTES}`;

function buildSelectedSet(disponibilidades: Disponibilidad[]): Set<string> {
  return new Set(disponibilidades.map(d => `${d.dia_semana}|${d.hora_inicio}`));
}

/* ─── Componente ────────────────────────────────────────────── */
export default function DisponibilidadViewModal({ isOpen, docente, onClose }: DisponibilidadViewModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [ocupacionesData, setOcupacionesData] = useState<Ocupacion[]>([]);
  const [hoveredOcupacion, setHoveredOcupacion] = useState<Ocupacion | null>(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!isOpen || !docente) return;
    setSelected(buildSelectedSet(docente.disponibilidades ?? []));
    
    // Cargar ocupaciones
    loadOcupaciones();
  }, [isOpen, docente]);

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

  const maxHoras      = docente?.horas_maximas_semana ?? 40;
  const horasSel      = selected.size;
  const pct           = Math.min((horasSel / maxHoras) * 100, 100);
  const nombreDocente = docente?.user
    ? `${docente.user.nombre} ${docente.user.apellido}`
    : docente?.codigo_docente ?? '';

  return (
    <Dialog.Root open={isOpen && !!docente} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />

        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]
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
                <Dialog.Title className="flex items-center gap-2 text-white font-bold text-base leading-tight">
                  Disponibilidad del Docente
                  <span className="text-[10px] font-semibold tracking-wide uppercase
                                   bg-indigo-400/20 text-indigo-300 border border-indigo-400/30
                                   px-2 py-0.5 rounded-full">
                    Solo lectura
                  </span>
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
                <p className="text-lg font-bold text-white leading-none">
                  {horasSel}<span className="text-white/50 text-sm font-normal">/{maxHoras}h</span>
                </p>
                <div className="w-24 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
              <Dialog.Close onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
          </div>

          {/* ── Subtítulo ── */}
          <div className="px-6 py-2.5 border-b border-white/10 shrink-0">
            <p className="text-white/40 text-xs">
              Bloques en <span className="text-blue-400 font-semibold">azul</span> = disponibilidad. Bloques en <span className="text-yellow-400 font-semibold">amarillo</span> = ocupados por sesiones asignadas. Esta vista es de solo lectura.
            </p>
          </div>

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
                        const isAvail = selected.has(key);
                        const isOcupada = ocupadas.has(key);
                        const ocupacion = isOcupada ? getOcupacionForSlot(day.value, slot.inicio) : null;
                        
                        return (
                          <td key={key} className="py-1.5 px-2 text-center relative">
                            <div
                              onMouseEnter={() => ocupacion && setHoveredOcupacion(ocupacion)}
                              onMouseLeave={() => setHoveredOcupacion(null)}
                              className={`w-full py-1.5 rounded-lg text-xs font-semibold select-none cursor-${isOcupada ? 'help' : 'default'}
                                ${isOcupada
                                  ? 'bg-yellow-500/40 text-yellow-300 border border-yellow-400/50 hover:bg-yellow-500/50'
                                  : isAvail
                                  ? 'bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.5)]'
                                  : 'bg-white/5 text-white/15 border border-white/10'}`}
                              title={isOcupada 
                                ? 'Ocupado — sesión asignada' 
                                : isAvail 
                                ? 'Disponible' 
                                : 'No disponible'}
                            >
                              {isOcupada ? '⊗' : isAvail ? '✓' : '–'}
                            </div>
                            
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
            <div className="mt-4 flex gap-5 text-xs text-white/40">
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
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end px-6 py-4 border-t border-white/15 bg-white/5 rounded-b-2xl shrink-0">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/25 text-white/80
                         hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
              Cerrar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
