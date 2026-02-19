import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Docente } from './ProfesoresLayout';

interface DisponibilidadModalProps {
  isOpen: boolean;
  docente: Docente | null;
  onClose: () => void;
}

type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
type TimeSlot = string;

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const TIME_SLOTS: TimeSlot[] = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
  '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00',
  '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00',
  '17:00 - 18:00',
];
const BREAK_SLOTS = ['13:00 - 14:00'];

export default function DisponibilidadModal({ isOpen, docente, onClose }: DisponibilidadModalProps) {
  const [disponibilidad, setDisponibilidad] = useState<Record<string, Record<string, boolean>>>({});

  // Resetear al abrir con nuevo docente
  useEffect(() => {
    if (!isOpen) return;
    setDisponibilidad({});
  }, [isOpen, docente]);

  const toggleSlot = (day: DayOfWeek, time: TimeSlot) => {
    setDisponibilidad((prev) => ({
      ...prev,
      [day]: { ...prev[day], [time]: !prev[day]?.[time] },
    }));
  };

  const countSelected = () =>
    Object.values(disponibilidad).reduce(
      (total, day) => total + Object.values(day).filter(Boolean).length,
      0
    );

  const handleSave = () => {
    console.log('Disponibilidad guardada:', disponibilidad);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen && !!docente} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />

        {/* Contenido — ancho grande para la tabla */}
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
                  {docente.codigo_docente}
                  {docente.departamento ? ` — ${docente.departamento}` : ''}
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

            {/* Contador */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Haz clic en las celdas para marcar los horarios disponibles.
              </p>
              <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {countSelected()} horas seleccionadas
              </span>
            </div>

            {/* Tabla de disponibilidad */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-36">
                      Horario
                    </th>
                    {DAYS.map((day) => (
                      <th key={day} className="text-center py-3 px-4 font-semibold text-gray-600">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, i) => {
                    const isBreak = BREAK_SLOTS.includes(slot);
                    return (
                      <tr
                        key={slot}
                        className={`border-b border-gray-100 ${isBreak ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className={`py-3 px-4 font-medium text-xs ${isBreak ? 'text-amber-700' : 'text-gray-700'}`}>
                          {slot}
                        </td>
                        {DAYS.map((day) => {
                          const isSelected = disponibilidad[day]?.[slot];
                          return (
                            <td key={`${day}-${slot}`} className="text-center py-2 px-3">
                              {isBreak ? (
                                <span className="text-amber-600 text-xs font-medium">Descanso</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleSlot(day, slot)}
                                  className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${isSelected
                                      ? 'bg-blue-500 text-white shadow-sm scale-105'
                                      : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 border border-gray-200'
                                    }`}
                                  title={isSelected ? 'Disponible — clic para quitar' : 'No disponible — clic para marcar'}
                                >
                                  {isSelected ? '✓' : '–'}
                                </button>
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded" />
                <span>Descanso</span>
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
              type="button" onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              Guardar disponibilidad
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
