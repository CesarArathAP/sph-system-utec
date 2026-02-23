import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RefreshCw, Trash2 } from 'lucide-react';
import type { Docente, Disponibilidad } from './ProfesoresLayout';
import { API_CONFIG } from '../../../services/config';

interface DisponibilidadModalProps {
  isOpen: boolean;
  docente: Docente | null;
  onClose: () => void;
  onSaved?: () => void;   // callback para refrescar la lista tras guardar
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

// Franjas horarias de 1 hora: 07:00 → 21:00
const TIME_SLOTS: { label: string; inicio: string; fin: string }[] = [];
for (let h = 7; h < 21; h++) {
  const pad = (n: number) => String(n).padStart(2, '0');
  TIME_SLOTS.push({
    label: `${pad(h)}:00 – ${pad(h + 1)}:00`,
    inicio: `${pad(h)}:00:00`,
    fin: `${pad(h + 1)}:00:00`,
  });
}

// No hay franja de descanso fija — todas las horas son seleccionables

/* ── Helpers ────────────────────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCENTES}`;

/** Convierte la lista de disponibilidades a un Set de claves "dia|inicio" */
function buildSelectedSet(disponibilidades: Disponibilidad[]): Set<string> {
  return new Set(
    disponibilidades.map((d) => `${d.dia_semana}|${d.hora_inicio}`)
  );
}

/* ── Componente ─────────────────────────────────────────────────────── */
export default function DisponibilidadModal({ isOpen, docente, onClose, onSaved }: DisponibilidadModalProps) {
  // Estado local: copia mutable del grid
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Cargar disponibilidades actuales del docente al abrir */
  useEffect(() => {
    if (!isOpen || !docente) return;
    setSelected(buildSelectedSet(docente.disponibilidades ?? []));
    setError(null);
  }, [isOpen, docente]);

  /* Toggle de una celda */
  const toggleSlot = (day: string, inicio: string) => {
    const key = `${day}|${inicio}`;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  /* Llenar todo (respetando horas máximas del docente) */
  const handleFillAll = () => {
    if (!docente) return;
    
    const maxHoras = docente.horas_maximas_semana || 40;
    const newSelected = new Set<string>();
    
    // Estrategia: Llenar primero horario central (9-17), luego mañana/tarde
    // Distribuir uniformemente entre L-V
    
    // Definir categorías de horarios por preferencia
    const centralHours = TIME_SLOTS.filter(s => {
      const h = parseInt(s.inicio);
      return h >= 9 && h < 17; // 09:00 - 17:00
    }); // 8 slots
    
    const morningHours = TIME_SLOTS.filter(s => {
      const h = parseInt(s.inicio);
      return h >= 7 && h < 9; // 07:00 - 09:00
    }); // 2 slots
    
    const eveningHours = TIME_SLOTS.filter(s => {
      const h = parseInt(s.inicio);
      return h >= 17 && h < 21; // 17:00 - 21:00
    }); // 4 slots
    
    let totalHorasLlenadas = 0;
    const horasMaxPorDia = Math.ceil(maxHoras / 5); // Distribuir entre 5 días hábiles
    
    // Llenar cada día
    for (const day of DAYS) {
      if (totalHorasLlenadas >= maxHoras) break;
      
      let horasDelDia = 0;
      
      // Primero: Horario central (9-17)
      for (const slot of centralHours) {
        if (horasDelDia >= horasMaxPorDia || totalHorasLlenadas >= maxHoras) break;
        const key = `${day.value}|${slot.inicio}`;
        newSelected.add(key);
        horasDelDia++;
        totalHorasLlenadas++;
      }
      
      // Segundo: Mañana temprana (7-9)
      for (const slot of morningHours) {
        if (horasDelDia >= horasMaxPorDia || totalHorasLlenadas >= maxHoras) break;
        const key = `${day.value}|${slot.inicio}`;
        newSelected.add(key);
        horasDelDia++;
        totalHorasLlenadas++;
      }
      
      // Tercero: Tarde/Noche (17-21)
      for (const slot of eveningHours) {
        if (horasDelDia >= horasMaxPorDia || totalHorasLlenadas >= maxHoras) break;
        const key = `${day.value}|${slot.inicio}`;
        newSelected.add(key);
        horasDelDia++;
        totalHorasLlenadas++;
      }
    }
    
    setSelected(newSelected);
  };

  /* Limpiar todo */
  const handleClearAll = () => {
    if (window.confirm('¿Seguro que deseas limpiar toda la disponibilidad?')) {
      setSelected(new Set());
    }
  };

  /* DELETE de todas las disponibilidades actuales + POST de las nuevas */
  const handleSave = async () => {
    if (!docente?.id) return;
    setSaving(true);
    setError(null);

    // Construir el array que espera el endpoint
    const payload = Array.from(selected).map((key) => {
      const [dia_semana, hora_inicio] = key.split('|');
      const slot = TIME_SLOTS.find((s) => s.inicio === hora_inicio)!;
      return { dia_semana, hora_inicio, hora_fin: slot.fin };
    });

    try {
      // PUT reemplaza TODA la disponibilidad (borra las anteriores e inserta las nuevas)
      const res = await fetch(`${BASE}/${docente.id}/disponibilidad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? `Error ${res.status}`);
      }

      onSaved?.();   // refrescar la lista de docentes
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar disponibilidad');
    } finally {
      setSaving(false);
    }
  };

  const countSelected = selected.size;
  
  // Validar que no supere horas máximas
  const maxHoras = docente?.horas_maximas_semana || 40;
  const horasSeleccionadas = countSelected;
  const exceedsMaxHours = horasSeleccionadas > maxHoras;
  const horasExcedidas = horasSeleccionadas - maxHoras;

  return (
    <Dialog.Root open={isOpen && !!docente} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />

        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh]
                     overflow-y-auto focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-start sticky top-0 bg-white rounded-t-xl">
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-800">
                Disponibilidad del Docente
              </Dialog.Title>
              {docente && (
                <p className="text-sm text-blue-600 font-medium mt-0.5">
                  {docente.user
                    ? `${docente.user.nombre} ${docente.user.apellido} — `
                    : ''}
                  {docente.codigo_docente}
                  {docente.departamento ? ` · ${docente.departamento}` : ''}
                </p>
              )}
            </div>
            <Dialog.Close
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition mt-1"
              aria-label="Cerrar"
            >
              ×
            </Dialog.Close>
          </div>

          {/* Cuerpo */}
          <div className="p-6">
            {/* Contador + acciones rápidas */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Haz clic en las celdas para marcar los horarios disponibles.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                  title="Llenar todo respetando horas máximas"
                >
                  <RefreshCw size={13} /> Llenar todo
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                  title="Limpiar toda la disponibilidad"
                >
                  <Trash2 size={13} /> Limpiar todo
                </button>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ml-2 ${
                  exceedsMaxHours 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {horasSeleccionadas} / {maxHoras}h
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Advertencia de horas excedidas */}
            {exceedsMaxHours && (
              <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
                ⚠️ Excedes el límite máximo en {horasExcedidas} {horasExcedidas === 1 ? 'hora' : 'horas'}. 
                Máximo permitido: {maxHoras}h
              </div>
            )}

            {/* Tabla de disponibilidad */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-36">Horario</th>
                    {DAYS.map((day) => (
                      <th key={day.value} className="text-center py-3 px-4 font-semibold text-gray-600">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, i) => (
                    <tr
                      key={slot.inicio}
                      className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="py-3 px-4 font-medium text-xs text-gray-700">
                        {slot.label}
                      </td>
                      {DAYS.map((day) => {
                        const key = `${day.value}|${slot.inicio}`;
                        const isSelected = selected.has(key);
                        return (
                          <td key={key} className="text-center py-2 px-3">
                            <button
                              type="button"
                              onClick={() => toggleSlot(day.value, slot.inicio)}
                              className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${isSelected
                                ? 'bg-blue-500 text-white shadow-sm scale-105'
                                : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 border border-gray-200'
                                }`}
                              title={isSelected ? 'Disponible — clic para quitar' : 'No disponible — clic para marcar'}
                            >
                              {isSelected ? '✓' : '–'}
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
            <div className="mt-4 flex gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded" />
                <span>No disponible</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-4 justify-end border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
            <Dialog.Close asChild>
              <button
                type="button" onClick={onClose}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
              >
                Cancelar
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || exceedsMaxHours}
              title={exceedsMaxHours ? `No puedes exceder ${maxHoras}h. Quita ${horasExcedidas} ${horasExcedidas === 1 ? 'hora' : 'horas'}.` : ''}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
                exceedsMaxHours
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60'
              }`}
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
