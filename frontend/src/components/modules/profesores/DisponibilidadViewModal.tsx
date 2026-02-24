import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays } from 'lucide-react';
import type { Docente, Disponibilidad } from './ProfesoresLayout';

interface DisponibilidadViewModalProps {
  isOpen: boolean;
  docente: Docente | null;
  onClose: () => void;
}

/* ── Constantes del grid ────────────────────────────────────────────── */
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
  TIME_SLOTS.push({
    label: `${pad(h)}:00 – ${pad(h + 1)}:00`,
    inicio: `${pad(h)}:00:00`,
  });
}

/** Construye un Set de claves "dia|inicio" a partir de disponibilidades */
function buildSelectedSet(disponibilidades: Disponibilidad[]): Set<string> {
  return new Set(disponibilidades.map((d) => `${d.dia_semana}|${d.hora_inicio}`));
}

/* ── Componente ─────────────────────────────────────────────────────── */
export default function DisponibilidadViewModal({
  isOpen,
  docente,
  onClose,
}: DisponibilidadViewModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /* Reconstruir el grid cada vez que se abre o cambia el docente */
  useEffect(() => {
    if (!isOpen || !docente) return;
    setSelected(buildSelectedSet(docente.disponibilidades ?? []));
  }, [isOpen, docente]);

  const countSelected = selected.size;
  const maxHoras = docente?.horas_maximas_semana ?? 40;
  const nombreDocente = docente?.user
    ? `${docente.user.nombre} ${docente.user.apellido}`
    : docente?.codigo_docente ?? '';

  return (
    <Dialog.Root open={isOpen && !!docente} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />

        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]
                     bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh]
                     overflow-y-auto focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-start sticky top-0 bg-white rounded-t-xl">
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CalendarDays size={20} className="text-indigo-500" />
                Disponibilidad del Docente
                <span className="text-xs font-normal text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full ml-1">
                  Solo lectura
                </span>
              </Dialog.Title>
              {docente && (
                <p className="text-sm text-blue-600 font-medium mt-0.5">
                  {nombreDocente}
                  {docente.codigo_docente ? ` — ${docente.codigo_docente}` : ''}
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
            {/* Contador  */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Bloques disponibles marcados en{' '}
                <span className="font-semibold text-blue-600">azul</span>.
                Esta vista es de solo lectura.
              </p>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                {countSelected} / {maxHoras}h
              </span>
            </div>

            {/* Tabla de disponibilidad — solo lectura */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-36">
                      Horario
                    </th>
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
                        const isAvailable = selected.has(key);
                        return (
                          <td key={key} className="text-center py-2 px-3">
                            <div
                              className={`w-full py-2 rounded-lg text-xs font-semibold select-none
                                ${isAvailable
                                  ? 'bg-blue-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-300 border border-gray-200'
                                }`}
                              title={isAvailable ? 'Disponible' : 'No disponible'}
                            >
                              {isAvailable ? '✓' : '–'}
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
            <div className="mt-4 flex gap-6 text-xs text-gray-500">
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
          <div className="flex justify-end border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
