import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface Grupo {
  id?: string;
  codigo: string;
  nombre: string;
  carrera: string;
  semestre: number;
  turno: string;
  numeroEstudiantes: number;
  cicloEscolar: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface GruposModalProps {
  isOpen: boolean;
  grupo: Grupo | null;
  onClose: () => void;
  onSave: (grupo: Grupo) => void;
}

export default function GruposModal({ isOpen, grupo, onClose, onSave }: GruposModalProps) {
  const emptyForm: Grupo = {
    codigo: '', nombre: '', carrera: '',
    semestre: 1, turno: '', numeroEstudiantes: 0, cicloEscolar: '', activo: true,
  };

  const [formData, setFormData] = useState<Grupo>(emptyForm);

  useEffect(() => {
    setFormData(grupo ?? emptyForm);
  }, [grupo, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semestre' || name === 'numeroEstudiantes'
        ? parseInt(value as string) || 0
        : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!grupo?.id;

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
              {isEditing ? 'Editar Grupo' : 'Crear Grupo'}
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
                Código
              </label>
              <input
                type="text" name="codigo"
                value={formData.codigo} onChange={handleChange}
                placeholder="ej. IDyGS-3A" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text" name="nombre"
                value={formData.nombre} onChange={handleChange}
                placeholder="ej. Ingeniería en Desarrollo de Software - 3A" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Carrera */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carrera
              </label>
              <input
                type="text" name="carrera"
                value={formData.carrera} onChange={handleChange}
                placeholder="ej. Ingeniería en Sistemas Computacionales" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Semestre + N° Estudiantes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semestre
                </label>
                <input
                  type="number" name="semestre"
                  value={formData.semestre} onChange={handleChange}
                  placeholder="ej. 3" min="1" max="12" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de estudiantes
                </label>
                <input
                  type="number" name="numeroEstudiantes"
                  value={formData.numeroEstudiantes} onChange={handleChange}
                  placeholder="ej. 28" min="0" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turno
              </label>
              <select
                name="turno"
                value={formData.turno} onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              >
                <option value="">Selecciona un turno</option>
                <option value="matutino">Matutino</option>
                <option value="vespertino">Vespertino</option>
                <option value="nocturno">Nocturno</option>
              </select>
            </div>

            {/* Ciclo escolar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciclo escolar
              </label>
              <input
                type="text" name="cicloEscolar"
                value={formData.cicloEscolar} onChange={handleChange}
                placeholder="ej. 2026-1" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <input
                type="checkbox" id="activo" name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                Grupo activo
              </label>
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
