import React, { useState, useEffect } from 'react';

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

interface AulasModalProps {
  isOpen: boolean;
  aula: Aula | null;
  onClose: () => void;
  onSave: (aula: Aula) => void;
}

export default function AulasModal({ isOpen, aula, onClose, onSave }: AulasModalProps) {
  const [formData, setFormData] = useState<Aula>({
    codigo: '',
    capacidad: 0,
    nombre: '',
    tipo: '',
    edificio: '',
    piso: '',
    equipamiento: '',
  });

  useEffect(() => {
    if (aula) {
      setFormData(aula);
    } else {
      setFormData({
        codigo: '',
        capacidad: 0,
        nombre: '',
        tipo: '',
        edificio: '',
        piso: '',
        equipamiento: '',
      });
    }
  }, [aula, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacidad' ? parseInt(value) || 0 : value,
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
          <div className="border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 bg-white">
            <h2 className="text-2xl font-bold text-gray-800">
              {aula?.id ? 'Editar Aula' : 'Crear Aula'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Código de Aula */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de aula
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  placeholder="ej. A-101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Capacidad y Piso en una fila */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad(estudiantes)
                  </label>
                  <input
                    type="number"
                    name="capacidad"
                    value={formData.capacidad}
                    onChange={handleChange}
                    placeholder="ej. 30"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piso
                  </label>
                  <input
                    type="text"
                    name="piso"
                    value={formData.piso}
                    onChange={handleChange}
                    placeholder="ej. 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
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
                  placeholder="ej. Aula 101 - Edificio A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <input
                  type="text"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  placeholder="ej. Teoría, Laboratorio, Computo, Auditorio"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Edificio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edificio
                </label>
                <input
                  type="text"
                  name="edificio"
                  value={formData.edificio}
                  onChange={handleChange}
                  placeholder="ej. Edificio A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Equipamiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipamiento
                </label>
                <input
                  type="text"
                  name="equipamiento"
                  value={formData.equipamiento}
                  onChange={handleChange}
                  placeholder="ej. Computadoras, Proyector, pizarra acondicionable"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 justify-end border-t border-gray-200 pt-6">
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
