import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Docente } from './ProfesoresLayout';

interface ProfesoresModalProps {
  isOpen: boolean;
  docente: Docente | null;  // null → crear, objeto → editar
  onClose: () => void;
  onSave: (docente: Docente) => void;
}

const emptyForm: Docente = {
  user_id: 0,
  codigo_docente: '',
  departamento: null,
  horas_maximas_semana: 20,
  activo: true,
  disponibilidades: [],
};

export default function ProfesoresModal({ isOpen, docente, onClose, onSave }: ProfesoresModalProps) {
  const [formData, setFormData] = useState<Docente>(emptyForm);

  /* Sincronizar form cuando cambia el docente seleccionado */
  useEffect(() => {
    setFormData(docente ? { ...docente } : { ...emptyForm });
  }, [docente, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'horas_maximas_semana' || name === 'user_id') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (name === 'departamento') {
      setFormData((prev) => ({ ...prev, departamento: value || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!docente?.id;

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
              {isEditing ? 'Editar Docente' : 'Nuevo Docente'}
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

            {/* Banner informativo */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">
                {isEditing ? 'Editar datos del docente' : 'Registrar nuevo docente'}
              </h3>
              <p className="text-xs text-blue-600">
                {isEditing
                  ? 'Modifica los campos que desees actualizar.'
                  : 'Completa los datos para dar de alta al docente en el sistema.'}
              </p>
            </div>

            {/* user_id (solo en creación) */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de usuario <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="user_id"
                  value={formData.user_id || ''}
                  onChange={handleChange}
                  placeholder="ej. 5"
                  min={1}
                  required={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <p className="text-xs text-gray-400 mt-1">
                  ID del usuario registrado en el sistema al que se vinculará este docente.
                </p>
              </div>
            )}

            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="codigo_docente"
                value={formData.codigo_docente}
                onChange={handleChange}
                placeholder="ej. DOC001"
                required
                maxLength={20}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                value={formData.departamento ?? ''}
                onChange={handleChange}
                placeholder="ej. Ingeniería de Software"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Horas máximas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas máximas por semana <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="horas_maximas_semana"
                value={formData.horas_maximas_semana}
                onChange={handleChange}
                min={1}
                max={60}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Activo (solo en edición) */}
            {isEditing && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="activo"
                  id="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Docente activo
                </label>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 justify-end border-t border-gray-200 pt-5">
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={onClose}
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
