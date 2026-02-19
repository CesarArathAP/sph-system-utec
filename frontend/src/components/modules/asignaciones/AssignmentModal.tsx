import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignmentModal({ isOpen, onClose }: AssignmentModalProps) {
  const [formData, setFormData] = useState({
    grupo: '',
    materia: '',
    profesor: '',
    horaInicial: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Asignación guardada:', formData);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay — fondo oscuro */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 animate-fade-in" />

        {/* Contenido del modal */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh]
                     overflow-y-auto focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <Dialog.Title className="text-lg font-bold text-gray-900">
              Asignación de materias a grupos con docentes
            </Dialog.Title>
            <Dialog.Close
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
              aria-label="Cerrar"
            >
              ×
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-6">
              Completa los datos para asignar una materia a un grupo con su docente.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupo
                </label>
                <input
                  type="text"
                  name="grupo"
                  value={formData.grupo}
                  onChange={handleChange}
                  placeholder="Ej: 3A"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materia
                </label>
                <input
                  type="text"
                  name="materia"
                  value={formData.materia}
                  onChange={handleChange}
                  placeholder="Ej: Matemáticas"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesor
                </label>
                <input
                  type="text"
                  name="profesor"
                  value={formData.profesor}
                  onChange={handleChange}
                  placeholder="Ej: Juan García"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora inicial
                </label>
                <input
                  type="time"
                  name="horaInicial"
                  value={formData.horaInicial}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
