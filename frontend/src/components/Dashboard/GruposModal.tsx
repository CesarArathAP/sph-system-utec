import React, { useState, useEffect } from 'react';

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

interface GruposModalProps {
  isOpen: boolean;
  grupo: Grupo | null;
  onClose: () => void;
  onSave: (grupo: Grupo) => void;
}

export default function GruposModal({ isOpen, grupo, onClose, onSave }: GruposModalProps) {
  const [formData, setFormData] = useState<Grupo>({
    codigo: '',
    nombre: '',
    carrera: '',
    semestre: 0,
    turno: '',
    numeroEstudiantes: 0,
    cicloEscolar: '',
  });

  useEffect(() => {
    if (grupo) {
      setFormData(grupo);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        carrera: '',
        semestre: 0,
        turno: '',
        numeroEstudiantes: 0,
        cicloEscolar: '',
      });
    }
  }, [grupo, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'semestre' || name === 'numeroEstudiantes'
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Transparent */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="border-b border-gray-200 p-6 sticky top-0 bg-white">
            {grupo ? (
              <h2 className="text-2xl font-bold text-gray-800 text-center">Editar Grupo</h2>
            ) : (
              <h2 className="text-2xl font-bold text-gray-800 text-center">Crear Grupo</h2>
            )}
          </div>

          {/* Modal Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Box container */}
            <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codigo
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  placeholder="ej. IDyGS-3A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="ej. Ingeniería en Desarrollo y gestión de software - 3er Semestre A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Carrera */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrera
                </label>
                <input
                  type="text"
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  placeholder="ej. Ingeniería en Sistemas Computacionales"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Semestre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semestre
                </label>
                <input
                  type="number"
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleChange}
                  placeholder="ej. 3"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Turno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turno
                </label>
                <input
                  type="text"
                  name="turno"
                  value={formData.turno}
                  onChange={handleChange}
                  placeholder="ej. Matutino, Vespertino"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Número de estudiantes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero de estudiantes
                </label>
                <input
                  type="number"
                  name="numeroEstudiantes"
                  value={formData.numeroEstudiantes}
                  onChange={handleChange}
                  placeholder="ej. 28"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Ciclo escolar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciclo escolar
                </label>
                <input
                  type="text"
                  name="cicloEscolar"
                  value={formData.cicloEscolar}
                  onChange={handleChange}
                  placeholder="ej. 2026-1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 justify-end pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
