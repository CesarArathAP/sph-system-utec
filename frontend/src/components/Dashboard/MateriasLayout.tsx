import React, { useState } from 'react';
import MateriasModal from './MateriasModal';

interface Materia {
  id?: string;
  codigo: string;
  nombre: string;
  creditos: number;
  horasPorSemana: number;
  requiereLaboratorio: boolean;
  tipoAula: string;
  descripcion: string;
}

export default function MateriasLayout() {
  const [materias, setMaterias] = useState<Materia[]>([
    {
      id: '1',
      codigo: 'MAT101',
      nombre: 'Español',
      creditos: 3,
      horasPorSemana: 4,
      requiereLaboratorio: false,
      tipoAula: 'Teoría',
      descripcion: 'Curso de español general',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  const handleCrear = () => {
    setSelectedMateria(null);
    setIsModalOpen(true);
  };

  const handleSaveMateria = (materia: Materia) => {
    if (selectedMateria?.id) {
      setMaterias(materias.map((m) => (m.id === materia.id ? { ...materia, id: m.id } : m)));
    } else {
      setMaterias([...materias, { ...materia, id: Date.now().toString() } as Materia]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteMateria = (id: string | undefined) => {
    if (id) {
      setMaterias(materias.filter((m) => m.id !== id));
    }
  };

  const filteredMaterias = materias.filter(
    (materia) =>
      materia.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      materia.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Materia</h1>
        <p className="text-gray-600">Gestión de materias del sistema</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar profesor"
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
          onClick={handleCrear}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          Crear
        </button>
      </div>

      {/* Materias Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterias.map((materia) => (
          <div
            key={materia.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{materia.codigo}</h3>
                <p className="text-sm text-gray-500 mt-1">{materia.nombre}</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-blue-600" />
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Créditos:</span> {materia.creditos}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Horas/Semana:</span> {materia.horasPorSemana}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Tipo de Aula:</span> {materia.tipoAula}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Laboratorio:</span>{' '}
                {materia.requiereLaboratorio ? 'Sí' : 'No'}
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedMateria(materia);
                  setIsModalOpen(true);
                }}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Editar
              </button>
              <button
                onClick={() => handleDeleteMateria(materia.id)}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <MateriasModal
        isOpen={isModalOpen}
        materia={selectedMateria}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMateria}
      />
    </div>
  );
}
