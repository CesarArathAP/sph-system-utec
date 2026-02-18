import React, { useState } from 'react';

interface Conflicto {
  id: number;
  horario_id: number;
  tipo_conflicto: string;
  descripcion: string;
  resuelto: boolean;
  created_at: string;
  updated_at: string;
}

interface ScheduleTableProps {
  onAssignClick: () => void;
}

// Datos de ejemplo basados en el esquema de la tabla conflictos
const mockConflictos: Conflicto[] = [
  {
    id: 1,
    horario_id: 1,
    tipo_conflicto: 'Falta asignada',
    descripcion: 'Materia sin asignado',
    resuelto: false,
    created_at: '2026-02-18T10:00:00Z',
    updated_at: '2026-02-18T10:00:00Z',
  },
  {
    id: 2,
    horario_id: 1,
    tipo_conflicto: 'Profesor duplicado',
    descripcion: 'Prof. Martínez González',
    resuelto: true,
    created_at: '2026-02-18T10:05:00Z',
    updated_at: '2026-02-18T10:10:00Z',
  },
  {
    id: 3,
    horario_id: 1,
    tipo_conflicto: 'Grupo repetido',
    descripcion: 'Grupo A1 tiene dos clases',
    resuelto: false,
    created_at: '2026-02-18T10:15:00Z',
    updated_at: '2026-02-18T10:15:00Z',
  },
];

const tipoColor: Record<string, string> = {
  'Falta asignada': 'bg-yellow-100 text-yellow-800',
  'Profesor duplicado': 'bg-red-100 text-red-800',
  'Grupo repetido': 'bg-orange-100 text-orange-800',
};

export default function ScheduleTable({ onAssignClick }: ScheduleTableProps) {
  const [conflictos, setConflictos] = useState<Conflicto[]>(mockConflictos);

  const hours = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
  ];

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const scheduleData = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['Break', 'Break', 'Break', 'Break', 'Break'],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
  ];

  const toggleResuelto = (id: number) => {
    setConflictos((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, resuelto: !c.resuelto, updated_at: new Date().toISOString() } : c
      )
    );
  };

  const pendientes = conflictos.filter((c) => !c.resuelto).length;

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Horario</h2>
        <button
          onClick={onAssignClick}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
        >
          Asignar
        </button>
      </div>

      {/* Contenedor principal: tabla de horario + tabla de conflictos */}
      <div className="flex gap-4 items-start">
        {/* Tabla de horarios */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-x-auto min-w-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-28 text-sm">
                  Hora
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[100px] text-sm"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour, index) => (
                <tr key={hour} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-3 text-xs font-medium text-gray-600 border-r border-gray-200 whitespace-nowrap">
                    {hour}
                  </td>
                  {scheduleData[index].map((cell, dayIndex) => (
                    <td
                      key={`${hour}-${dayIndex}`}
                      className="px-2 py-4 text-center border-r border-gray-200 text-sm"
                    >
                      {cell && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium text-xs">
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

        {/* Tabla de conflictos detectados */}
        <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow overflow-hidden">
          {/* Encabezado de la tabla de conflictos */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Conflictos detectados</h3>
            {pendientes > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendientes}
              </span>
            )}
          </div>

          {/* Cabecera de columnas */}
          <div className="grid grid-cols-[1fr_1.6fr_0.8fr_0.6fr] bg-gray-100 border-b border-gray-200 px-3 py-2">
            <span className="text-xs font-semibold text-gray-600">Tipo</span>
            <span className="text-xs font-semibold text-gray-600">Descripción</span>
            <span className="text-xs font-semibold text-gray-600">Estado</span>
            <span className="text-xs font-semibold text-gray-600">Acción</span>
          </div>

          {/* Filas de conflictos */}
          <div className="divide-y divide-gray-100">
            {conflictos.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Sin conflictos detectados
              </div>
            ) : (
              conflictos.map((conflicto) => (
                <div
                  key={conflicto.id}
                  className={`grid grid-cols-[1fr_1.6fr_0.8fr_0.6fr] items-center px-3 py-2.5 gap-1 transition-colors ${
                    conflicto.resuelto ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Tipo */}
                  <div>
                    <span
                      className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-tight ${
                        tipoColor[conflicto.tipo_conflicto] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {conflicto.tipo_conflicto}
                    </span>
                  </div>

                  {/* Descripción */}
                  <div className="text-xs text-gray-700 leading-tight truncate" title={conflicto.descripcion}>
                    {conflicto.descripcion}
                  </div>

                  {/* Estado */}
                  <div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        conflicto.resuelto
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {conflicto.resuelto ? 'Resuelto' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Acción: toggle resuelto */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleResuelto(conflicto.id)}
                      title={conflicto.resuelto ? 'Marcar como pendiente' : 'Marcar como resuelto'}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                        conflicto.resuelto ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                          conflicto.resuelto ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con resumen */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex justify-between text-xs text-gray-500">
            <span>Total: {conflictos.length}</span>
            <span className="text-red-500 font-medium">Pendientes: {pendientes}</span>
            <span className="text-green-600 font-medium">
              Resueltos: {conflictos.length - pendientes}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
