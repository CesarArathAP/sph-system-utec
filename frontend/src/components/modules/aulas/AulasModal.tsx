import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

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
  const emptyForm: Aula = {
    codigo: '', capacidad: 0, nombre: '',
    tipo: '', edificio: '', piso: '', equipamiento: '',
  };

  const [formData, setFormData] = useState<Aula>(emptyForm);

  useEffect(() => {
    setFormData(aula ?? emptyForm);
  }, [aula, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const isEditing = !!aula?.id;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />

        {/* Contenido */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh]
                     overflow-y-auto focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
            <Dialog.Title className="text-xl font-bold text-gray-800">
              {isEditing ? 'Editar Aula' : 'Crear Aula'}
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

            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de aula
              </label>
              <input
                type="text" name="codigo"
                value={formData.codigo} onChange={handleChange}
                placeholder="ej. A-101" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Capacidad + Piso */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad (estudiantes)
                </label>
                <input
                  type="number" name="capacidad"
                  value={formData.capacidad} onChange={handleChange}
                  placeholder="ej. 30" min="0" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Piso
                </label>
                <input
                  type="text" name="piso"
                  value={formData.piso} onChange={handleChange}
                  placeholder="ej. 1" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text" name="nombre"
                value={formData.nombre} onChange={handleChange}
                placeholder="ej. Aula 101 - Edificio A" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                name="tipo"
                value={formData.tipo} onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              >
                <option value="">Selecciona un tipo</option>
                <option value="teoria">Teoría</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="computo">Cómputo</option>
                <option value="auditorio">Auditorio</option>
              </select>
            </div>

            {/* Edificio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edificio
              </label>
              <input
                type="text" name="edificio"
                value={formData.edificio} onChange={handleChange}
                placeholder="ej. Edificio A" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Equipamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipamiento
              </label>
              <input
                type="text" name="equipamiento"
                value={formData.equipamiento} onChange={handleChange}
                placeholder="ej. Computadoras, Proyector, Pizarrón"
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
