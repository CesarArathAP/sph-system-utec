import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Building2 } from 'lucide-react';
import { useAulasForm } from './logic/useAulasForm';
import type { AulasModalProps } from './logic/types';
import { INPUT, LABEL, TIPO_OPTIONS } from './logic/constants';

export default function AulasModal({ isOpen, aula, onClose, onSave }: AulasModalProps) {
  const { formData, isEditing, handleChange } = useAulasForm(isOpen, aula);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />

        {/* Contenido */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     w-11/12 sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto
                     rounded-2xl shadow-2xl focus:outline-none
                     bg-[linear-gradient(145deg,#0a2460cc,#0d3494cc)]
                     backdrop-blur-xl border border-white/20"
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4
                          border-b border-white/15 sticky top-0
                          bg-[linear-gradient(135deg,#0a2a6e,#0d3494)]
                          rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg
                              bg-white/15 border border-white/25">
                <Building2 size={16} className="text-white" />
              </div>
              <Dialog.Title className="text-white font-bold text-base">
                {isEditing ? 'Editar Aula' : 'Nueva Aula'}
              </Dialog.Title>
            </div>
            <Dialog.Close
              onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition cursor-pointer"
              aria-label="Cerrar"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Código */}
            <div>
              <label className={LABEL}>Código de aula</label>
              <input
                type="text" name="codigo"
                value={formData.codigo} onChange={handleChange}
                placeholder="ej. A-101" required
                className={INPUT}
              />
            </div>

            {/* Capacidad + Piso */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Capacidad (estudiantes)</label>
                <input
                  type="number" name="capacidad"
                  value={formData.capacidad} onChange={handleChange}
                  placeholder="ej. 30" min="0" required
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Piso</label>
                <input
                  type="text" name="piso"
                  value={formData.piso ?? ''} onChange={handleChange}
                  placeholder="ej. 1"
                  className={INPUT}
                />
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className={LABEL}>Nombre</label>
              <input
                type="text" name="nombre"
                value={formData.nombre} onChange={handleChange}
                placeholder="ej. Aula 101 - Edificio A" required
                className={INPUT}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className={LABEL}>Tipo</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
                className={`${INPUT} cursor-pointer appearance-none`}>
                <option value="" className="bg-[#0d2f7a] text-white">
                  Selecciona un tipo
                </option>
                {TIPO_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#0d2f7a] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Edificio */}
            <div>
              <label className={LABEL}>Edificio</label>
              <input
                type="text" name="edificio"
                value={formData.edificio} onChange={handleChange}
                placeholder="ej. Edificio A" required
                className={INPUT}
              />
            </div>

            {/* Equipamiento */}
            <div>
              <label className={LABEL}>Equipamiento</label>
              <textarea
                name="equipamiento"
                value={formData.equipamiento}
                onChange={handleChange}
                placeholder="ej. Computadoras, Proyector, Pizarrón inteligente"
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
              <input
                type="checkbox" id="activo" name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 accent-blue-400 cursor-pointer"
              />
              <label htmlFor="activo" className="text-sm font-medium text-white/80 cursor-pointer select-none">
                Aula activa
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-2 border-t border-white/15">
              <Dialog.Close asChild>
                <button
                  type="button" onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-white/25 text-white/80
                             hover:bg-white/10 font-semibold text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                           bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                           hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)]
                           hover:-translate-y-px transition-all duration-200"
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
