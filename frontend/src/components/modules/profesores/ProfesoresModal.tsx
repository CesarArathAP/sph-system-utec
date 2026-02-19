import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

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
  const emptyForm: Profesor = {
    codigo: '', nombre: '', departamento: '', horasMaximas: 0,
  };

  const [formData, setFormData] = useState<Profesor>(emptyForm);

  useEffect(() => {
    setFormData(profesor ?? emptyForm);
  }, [profesor, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const isEditing = !!profesor?.id;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />

        {/* Contenido */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh]
                     overflow-y-auto focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
            <Dialog.Title className="text-xl font-bold text-gray-800">
              {isEditing ? 'Editar Profesor' : 'Crear Profesor'}
            </Dialog.Title>
            <Dialog.Close
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
              aria-label="Cerrar"
            >
              ×
            </Dialog.Close>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Sección info */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Información Personal</h3>
              <p className="text-xs text-blue-600">
                Completa los datos del profesor para darlo de alta en el sistema.
              </p>
            </div>

            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código
              </label>
              <input
                type="text" name="codigo"
                value={formData.codigo} onChange={handleChange}
                placeholder="ej. DOC001" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text" name="nombre"
                value={formData.nombre} onChange={handleChange}
                placeholder="ej. Dr. Juan García" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Departamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento
              </label>
              <input
                type="text" name="departamento"
                value={formData.departamento} onChange={handleChange}
                placeholder="ej. Ingeniería de Software" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Horas máximas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas máximas por semana
              </label>
              <input
                type="number" name="horasMaximas"
                value={formData.horasMaximas} onChange={handleChange}
                placeholder="ej. 20" min="0" max="40" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end border-t border-gray-200 pt-5">
              <Dialog.Close asChild>
                <button
                  type="button" onClick={onClose}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
