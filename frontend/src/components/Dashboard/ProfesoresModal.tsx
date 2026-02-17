import React, { useState, useEffect } from 'react';

interface Profesor {
  id?: string;
  codigo: string;
  nombre: string;
  departamento: string;
  horasMaximas: number;
}

interface ProfesoresModalProps {
  isOpen: boolean;
  profesor: Profesor | null;
  onClose: () => void;
  onSave: (profesor: Profesor) => void;
}

export default function ProfesoresModal({ isOpen, profesor, onClose, onSave }: ProfesoresModalProps) {
  const [formData, setFormData] = useState<Profesor>({
    codigo: '',
    nombre: '',
    departamento: '',
    horasMaximas: 0,
  });

  useEffect(() => {
    if (profesor) {
      setFormData(profesor);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        departamento: '',
        horasMaximas: 0,
      });
    }
  }, [profesor, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'horasMaximas' ? parseInt(value) || 0 : value,
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
              {profesor?.id ? 'Editar Profesor' : 'Crear Profesor'}
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
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
              <p className="text-gray-600 text-sm mb-6">
                Completa los datos del profesor para darlo de alta en el sistema
              </p>

              <div className="space-y-4">
                {/* Código */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleChange}
                    placeholder="ej. DOC001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="ej. Dr. Juan García"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Departamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
                    placeholder="ej. Ingeniería de Software"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Horas Máximas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas máximas a la semana
                  </label>
                  <input
                    type="number"
                    name="horasMaximas"
                    value={formData.horasMaximas}
                    onChange={handleChange}
                    placeholder="ej. 40"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
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
