import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

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
  const emptyForm: Materia = {
    codigo: '', nombre: '', creditos: 0,
    horasPorSemana: 0, requiereLaboratorio: false,
    tipoAula: '', descripcion: '',
  };

  const [formData, setFormData] = useState<Materia>(emptyForm);

  useEffect(() => {
    setFormData(materia ?? emptyForm);
  }, [materia, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'creditos' || name === 'horasPorSemana' ? parseInt(value) || 0 : value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!materia?.id;

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
              {isEditing ? 'Editar Materia' : 'Crear Materia'}
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
                placeholder="ej. MAT101" required
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
                placeholder="ej. Cálculo Diferencial" required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Créditos + Horas/semana */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Créditos
                </label>
                <input
                  type="number" name="creditos"
                  value={formData.creditos} onChange={handleChange}
                  placeholder="ej. 6" min="0" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas por semana
                </label>
                <input
                  type="number" name="horasPorSemana"
                  value={formData.horasPorSemana} onChange={handleChange}
                  placeholder="ej. 4" min="0" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Tipo de aula */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de aula
              </label>
              <select
                name="tipoAula"
                value={formData.tipoAula} onChange={handleChange}
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

            {/* Requiere laboratorio */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox" name="requiereLaboratorio"
                id="requiereLaboratorio"
                checked={formData.requiereLaboratorio}
                onChange={handleChange}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="requiereLaboratorio" className="text-sm font-medium text-gray-700 cursor-pointer">
                Requiere laboratorio
              </label>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion} onChange={handleChange}
                placeholder="ej. Introducción al cálculo diferencial e integral..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
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
