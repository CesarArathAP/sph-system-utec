import React, { useState } from 'react';
import GruposModal from './GruposModal';

interface Grupo {
  id?: string;
  codigo: string;
  nombre: string;
  carrera: string;
  semestre: number;
  turno: string;
  numeroEstudiantes: number;
  cicloEscolar: string;
}

export default function GruposLayout() {
  const [grupos, setGrupos] = useState<Grupo[]>([
    {
      id: '1',
      codigo: 'ISC-3A',
      nombre: 'Ingeniería en Desarrollo y gestión de software - 3er Semestre A',
      carrera: 'Ingeniería en Sistemas Computacionales',
      semestre: 3,
      turno: 'Matutino',
      numeroEstudiantes: 30,
      cicloEscolar: '2026-1',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);

  const handleCrear = () => {
    setSelectedGrupo(null);
    setIsModalOpen(true);
  };

  const handleSaveGrupo = (grupo: Grupo) => {
    if (selectedGrupo?.id) {
      setGrupos(grupos.map((g) => (g.id === grupo.id ? { ...grupo, id: g.id } : g)));
    } else {
      setGrupos([...grupos, { ...grupo, id: Date.now().toString() } as Grupo]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteGrupo = (id: string | undefined) => {
    if (id) {
      setGrupos(grupos.filter((g) => g.id !== id));
    }
  };

  const filteredGrupos = grupos.filter(
    (grupo) =>
      grupo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Grupos</h1>
        <p className="text-gray-600">Gestión de grupos del sistema</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar grupo"
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

      {/* Grupos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGrupos.map((grupo) => (
          <div
            key={grupo.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{grupo.codigo}</h3>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-blue-600" />
            </div>

            <div className="mb-4 space-y-2">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                {grupo.nombre}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                  {grupo.numeroEstudiantes} estudiantes
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                  {grupo.cicloEscolar}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedGrupo(grupo);
                  setIsModalOpen(true);
                }}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Editar
              </button>
              <button
                onClick={() => handleDeleteGrupo(grupo.id)}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <GruposModal
        isOpen={isModalOpen}
        grupo={selectedGrupo}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGrupo}
      />
    </div>
  );
}
