import React, { useState, useEffect } from 'react';

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

interface MateriasModalProps {
  isOpen: boolean;
  materia: Materia | null;
  onClose: () => void;
  onSave: (materia: Materia) => void;
}

export default function MateriasModal({ isOpen, materia, onClose, onSave }: MateriasModalProps) {
  const [formData, setFormData] = useState<Materia>({
    codigo: '',
    nombre: '',
    creditos: 0,
    horasPorSemana: 0,
    requiereLaboratorio: false,
    tipoAula: '',
    descripcion: '',
  });

  useEffect(() => {
    if (materia) {
      setFormData(materia);
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        creditos: 0,
        horasPorSemana: 0,
        requiereLaboratorio: false,
        tipoAula: '',
        descripcion: '',
      });
    }
  }, [materia, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === 'creditos' || name === 'horasPorSemana'
            ? parseInt(value) || 0
            : value,
      }));
    }
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
            {materia ? (
              <h2 className="text-2xl font-bold text-gray-800 text-center">Editar Materia</h2>
            ) : (
              <h2 className="text-2xl font-bold text-gray-800 text-center">Crear Materia</h2>
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
                  placeholder="ej. MAT101"
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
                  placeholder="ej. Cálculo Diferencial"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Créditos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Créditos
                </label>
                <input
                  type="number"
                  name="creditos"
                  value={formData.creditos}
                  onChange={handleChange}
                  placeholder="ej. 6"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Horas por semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas por semana
                </label>
                <input
                  type="number"
                  name="horasPorSemana"
                  value={formData.horasPorSemana}
                  onChange={handleChange}
                  placeholder="ej. 4"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Requiere laboratorio */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="requiereLaboratorio"
                  checked={formData.requiereLaboratorio}
                  onChange={handleChange}
                  className="w-5 h-5 accent-blue-600"
                />
                <label className="text-sm font-medium text-gray-700">
                  Requiere laboratorio
                </label>
              </div>

              {/* Tipo de aula */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de aula
                </label>
                <input
                  type="text"
                  name="tipoAula"
                  value={formData.tipoAula}
                  onChange={handleChange}
                  placeholder="ej. Teoría, laboratorio, computo, auditorio"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="ej. Aule estandar"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
