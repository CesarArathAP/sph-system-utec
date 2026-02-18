import React, { useState } from 'react';
import ProfesoresModal from './ProfesoresModal';
import DisponibilidadModal from './DisponibilidadModal';

interface Profesor {
  id?: string;
  codigo: string;
  nombre: string;
  departamento: string;
  horasMaximas: number;
}

export default function ProfesoresLayout() {
  const [profesores, setProfesores] = useState<Profesor[]>([
    {
      id: '1',
      codigo: 'DOC001',
      nombre: 'Dr. Juan García',
      departamento: 'Ingeniería de Software',
      horasMaximas: 24,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isGestionarOpen, setIsGestionarOpen] = useState(false);
  const [isDisponibilidadOpen, setIsDisponibilidadOpen] = useState(false);
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(null);

  const handleGestionar = () => {
    setSelectedProfesor(null);
    setIsGestionarOpen(true);
  };

  const handleDisponibilidad = (profesor: Profesor) => {
    setSelectedProfesor(profesor);
    setIsDisponibilidadOpen(true);
  };

  const handleSaveProfesor = (profesor: Profesor) => {
    if (selectedProfesor?.id) {
      setProfesores(
        profesores.map((p) => (p.id === profesor.id ? { ...profesor, id: p.id } : p))
      );
    } else {
      setProfesores([
        ...profesores,
        { ...profesor, id: Date.now().toString() } as Profesor,
      ]);
    }
    setIsGestionarOpen(false);
  };

  const handleDeleteProfesor = (id: string | undefined) => {
    if (id) {
      setProfesores(profesores.filter((p) => p.id !== id));
    }
  };

  const filteredProfesores = profesores.filter(
    (profesor) =>
      profesor.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profesor.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Docentes</h1>
        <p className="text-gray-600">Gestión de profesores del sistema</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar docente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-3 text-gray-400 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={handleGestionar}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          Crear
        </button>
      </div>

      {/* Professors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfesores.map((profesor) => (
          <div
            key={profesor.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{profesor.codigo}</h3>
                <p className="text-sm text-gray-500 mt-1">{profesor.nombre}</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-blue-600" />
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Departamento:</span> {profesor.departamento}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-semibold">Horas máximas:</span> {profesor.horasMaximas}h
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedProfesor(profesor);
                  setIsGestionarOpen(true);
                }}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Editar
              </button>
              <button
                onClick={() => handleDisponibilidad(profesor as Profesor)}
                className="flex-1 px-3 py-2 text-sm border-2 border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition"
              >
                Ver Disponibilidad
              </button>
              <button
                onClick={() => handleDeleteProfesor(profesor.id)}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <ProfesoresModal
        isOpen={isGestionarOpen}
        profesor={selectedProfesor}
        onClose={() => setIsGestionarOpen(false)}
        onSave={handleSaveProfesor}
      />

      <DisponibilidadModal
        isOpen={isDisponibilidadOpen}
        profesor={selectedProfesor}
        onClose={() => setIsDisponibilidadOpen(false)}
      />
    </div>
  );
}
