import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RefreshCw, Trash2, CalendarDays, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Docente, Disponibilidad } from './ProfesoresLayout';
import { API_CONFIG } from '../../../services/config';

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

/* ─── Helpers ───────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCENTES}`;

function buildSelectedSet(disponibilidades: Disponibilidad[]): Set<string> {
  return new Set(disponibilidades.map(d => `${d.dia_semana}|${d.hora_inicio}`));
}

/* ─── Componente ────────────────────────────────────────────── */
export default function DisponibilidadModal({ isOpen, docente, onClose, onSaved }: DisponibilidadModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !docente) return;
    setSelected(buildSelectedSet(docente.disponibilidades ?? []));
    setError(null);
  }, [isOpen, docente]);

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
                        return (
                          <td key={key} className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSlot(day.value, slot.inicio)}
                              className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer
                                ${isSel
                                  ? 'bg-blue-500 text-white shadow-[0_2px_8px_rgba(59,130,246,0.5)] scale-105'
                                  : 'bg-white/5 text-white/20 hover:bg-white/15 hover:text-white/60 border border-white/10'}`}
                              title={isSel ? 'Disponible — clic para quitar' : 'No disponible — clic para marcar'}
                            >
                              {isSel ? '✓' : '–'}
                            </button>
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
                <div className="w-4 h-4 bg-white/10 border border-white/15 rounded-md" />
                <span>No disponible</span>
              </div>
            </div>
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
