import React, { useState } from 'react';

interface Profesor {
  id?: string;
  codigo: string;
  nombre: string;
  departamento: string;
  horasMaximas: number;
}

interface DisponibilidadModalProps {
  isOpen: boolean;
  profesor: Profesor | null;
  onClose: () => void;
}

type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
type TimeSlot = string;

export default function DisponibilidadModal({ isOpen, profesor, onClose }: DisponibilidadModalProps) {
  const daysOfWeek: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const timeSlots: TimeSlot[] = [
    '09:00 - 09:30',
    '09:30 - 10:30',
    '10:30 - 11:00',
    '11:00 - 12:00',
    '12:00 - 12:30',
    '12:30 - 13:30',
    '13:30 - 14:00',
    '14:00 - 15:00',
    '15:00 - 15:30',
    '15:30 - 16:00',
    '16:00 - 17:00',
  ];

  const breakTimes = ['12:30 - 13:30'];

  const [disponibilidad, setDisponibilidad] = useState<Record<string, Record<string, boolean>>>({});

  const toggleDisponibilidad = (day: DayOfWeek, time: TimeSlot) => {
    setDisponibilidad((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: !prev[day]?.[time],
      },
    }));
  };

  if (!isOpen || !profesor) return null;

  return (
    <>
      {/* Backdrop - Transparent */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 bg-white">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Disponibilidad por profesor</h2>
              <p className="text-gray-600 text-sm mt-1">{profesor.nombre}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 w-40">
                      Horario
                    </th>
                    {daysOfWeek.map((day) => (
                      <th
                        key={day}
                        className="text-center py-3 px-4 font-semibold text-gray-700"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot) => (
                    <tr key={timeSlot} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-800">{timeSlot}</td>
                      {daysOfWeek.map((day) => {
                        const isBreak = breakTimes.includes(timeSlot);
                        const isSelected = disponibilidad[day]?.[timeSlot];

                        return (
                          <td key={`${day}-${timeSlot}`} className="text-center py-4 px-4">
                            {isBreak ? (
                              <div className="text-gray-500 font-medium">Break</div>
                            ) : (
                              <button
                                onClick={() => toggleDisponibilidad(day as DayOfWeek, timeSlot)}
                                className={`w-full px-3 py-2 rounded transition ${
                                  isSelected
                                    ? 'bg-blue-500 text-white border-2 border-blue-600'
                                    : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {isSelected ? '✓' : '-'}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Nota:</span> Selecciona los horarios en los que el
                profesor está disponible para impartir clases.
              </p>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-4 justify-end border-t border-gray-200 p-6 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
            >
              Cancelar
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
