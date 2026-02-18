import React, { useState } from 'react';
import AulasModal from './AulasModal';

interface Aula {
  id?: string;
  codigo: string;
  capacidad: number;
  nombre: string;
  tipo: string;
  edificio: string;
  piso: string;
  equipamiento: string;
}

export default function AulasLayout() {
  const [aulas, setAulas] = useState<Aula[]>([
    {
      id: '1',
      codigo: 'A-101',
      capacidad: 30,
      nombre: 'Aula 101 - Edificio A',
      tipo: 'Teoría',
      edificio: 'Edificio A',
      piso: 'Piso 1',
      equipamiento: 'Proyector, Pizarra inteligente',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);

  const handleGestionar = () => {
    setSelectedAula(null);
    setIsModalOpen(true);
  };

  const handleSaveAula = (aula: Aula) => {
    if (selectedAula?.id) {
      setAulas(aulas.map((a) => (a.id === aula.id ? { ...aula, id: a.id } : a)));
    } else {
      setAulas([...aulas, { ...aula, id: Date.now().toString() } as Aula]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteAula = (id: string | undefined) => {
    if (id) {
      setAulas(aulas.filter((a) => a.id !== id));
    }
  };

  const filteredAulas = aulas.filter(
    (aula) =>
      aula.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aula.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Aulas</h1>
        <p className="text-gray-600">Gestión de aulas del sistema</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar aula"
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

      {/* Aulas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAulas.map((aula) => (
          <div
            key={aula.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{aula.codigo}</h3>
                <p className="text-sm text-gray-500 mt-1">{aula.nombre}</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-blue-600" />
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Capacidad:</span> {aula.capacidad} estudiantes
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Tipo:</span> {aula.tipo}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Ubicación:</span> {aula.edificio}, {aula.piso}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Equipamiento:</span> {aula.equipamiento}
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedAula(aula);
                  setIsModalOpen(true);
                }}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Editar
              </button>
              <button
                onClick={() => handleDeleteAula(aula.id)}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AulasModal
        isOpen={isModalOpen}
        aula={selectedAula}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAula}
      />
    </div>
  );
}
