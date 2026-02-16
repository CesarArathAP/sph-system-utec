import React from 'react';

interface ScheduleTableProps {
  onAssignClick: () => void;
}

export default function ScheduleTable({ onAssignClick }: ScheduleTableProps) {
  const hours = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 1:00',
    '1:00 - 2:00',
    '2:00 - 3:00',
    '3:00 - 4:00',
    '5:00 - 6:00',
  ];

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const scheduleData = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
  ];

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header con botones */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Horario</h2>
        <button
          onClick={onAssignClick}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
        >
          Asignar
        </button>
      </div>

      {/* Tabla de horarios */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">Hora</th>
              {days.map((day) => (
                <th key={day} className="px-4 py-3 text-center font-semibold text-gray-700 min-w-32">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour, index) => (
              <tr key={hour} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm font-medium text-gray-600 border-r border-gray-200">
                  {hour}
                </td>
                {scheduleData[index].map((cell, dayIndex) => (
                  <td
                    key={`${hour}-${dayIndex}`}
                    className="px-4 py-6 text-center border-r border-gray-200 text-sm"
                  >
                    {cell && (
                      <div className="bg-blue-100 text-blue-800 p-2 rounded font-medium">
                        {cell}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
