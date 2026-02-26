import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, BookOpen } from 'lucide-react';
import { useMateriasForm } from './logic/useMateriasForm';
import { INPUT_CLASS, LABEL_CLASS, TIPOS_AULA } from './logic/constants';
import type { MateriasModalProps } from './logic/types';

export default function MateriasModal({ isOpen, materia, onClose, onSave }: MateriasModalProps) {
  const { formData, handleChange, isEditing } = useMateriasForm(materia, isOpen);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     w-11/12 sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto
                     rounded-2xl shadow-2xl focus:outline-none
                     bg-[linear-gradient(145deg,#0a2460cc,#0d3494cc)]
                     backdrop-blur-xl border border-white/20"
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/15
                          sticky top-0 bg-[linear-gradient(135deg,#0a2a6e,#0d3494)] rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 border border-white/25">
                <BookOpen size={16} className="text-white" />
              </div>
              <Dialog.Title className="text-white font-bold text-base">
                {isEditing ? 'Editar Materia' : 'Nueva Materia'}
              </Dialog.Title>
            </div>
            <Dialog.Close onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition cursor-pointer"
              aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Código */}
          <div>
            <label className={LABEL_CLASS}>
              Código <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="codigo_materia"
              value={formData.codigo_materia}
              onChange={handleChange}
              placeholder="ej. MAT101"
              required
              maxLength={20}
              className={INPUT_CLASS}
            />
          </div>

          {/* Nombre */}
          <div>
            <label className={LABEL_CLASS}>
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="ej. Cálculo Diferencial"
              required
              maxLength={200}
              className={INPUT_CLASS}
            />
          </div>

          {/* Créditos + Horas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>
                Créditos <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="creditos"
                value={formData.creditos}
                onChange={handleChange}
                min={1}
                max={10}
                required
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>
                Horas / semana <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="horas_semana"
                value={formData.horas_semana}
                onChange={handleChange}
                min={1}
                max={20}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Tipo aula */}
          <div>
            <label className={LABEL_CLASS}>Tipo de aula requerida</label>
            <select
              name="tipo_aula_requerida"
              value={formData.tipo_aula_requerida ?? ''}
              onChange={handleChange}
              className={`${INPUT_CLASS} cursor-pointer appearance-none`}
            >
              <option value="" className="bg-[#0d2f7a] text-white">
                Sin especificar
              </option>
              {TIPOS_AULA.map((tipo) => (
                <option key={tipo} value={tipo} className="bg-[#0d2f7a] text-white">
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              name="requiere_laboratorio"
              id="requiere_laboratorio"
              checked={formData.requiere_laboratorio}
              onChange={handleChange}
              className="w-4 h-4 accent-blue-400 cursor-pointer"
            />
            <label
              htmlFor="requiere_laboratorio"
              className="text-sm font-medium text-white/80 cursor-pointer select-none"
            >
              Requiere laboratorio
            </label>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
              <input
                type="checkbox"
                name="activo"
                id="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 accent-green-400 cursor-pointer"
              />
              <label htmlFor="activo" className="text-sm font-medium text-white/80 cursor-pointer select-none">
                Materia activa
              </label>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className={LABEL_CLASS}>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion ?? ''}
              onChange={handleChange}
              placeholder="ej. Introducción al cálculo diferencial e integral..."
              rows={3}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-2 border-t border-white/15">
              <Dialog.Close asChild>
                <button type="button" onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-white/25 text-white/80
                             hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
                  Cancelar
                </button>
              </Dialog.Close>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                           bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                           hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)]
                           hover:-translate-y-px transition-all duration-200">
                {isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
