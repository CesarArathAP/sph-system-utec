import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Users } from 'lucide-react';

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

/* ── Clases reutilizables ── */
const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 text-white text-sm ' +
              'placeholder:text-white/40 outline-none transition ' +
              'focus:border-white/60 focus:bg-white/20';
const LABEL = 'block text-xs font-semibold text-white/70 mb-1.5 tracking-wide uppercase';

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
                <Users size={16} className="text-white" />
              </div>
              <Dialog.Title className="text-white font-bold text-base">
                {isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
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
              <label className={LABEL}>Código</label>
              <input
                type="text" name="codigo"
                value={formData.codigo} onChange={handleChange}
                placeholder="ej. IDyGS-3A" required
                className={INPUT}
              />
            </div>

            {/* Nombre */}
            <div>
              <label className={LABEL}>Nombre</label>
              <input
                type="text" name="nombre"
                value={formData.nombre} onChange={handleChange}
                placeholder="ej. Ingeniería en Desarrollo de Software - 3A" required
                className={INPUT}
              />
            </div>

            {/* Carrera */}
            <div>
              <label className={LABEL}>Carrera</label>
              <input
                type="text" name="carrera"
                value={formData.carrera} onChange={handleChange}
                placeholder="ej. Ingeniería en Sistemas Computacionales" required
                className={INPUT}
              />
            </div>

            {/* Semestre + Estudiantes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Semestre</label>
                <input
                  type="number" name="semestre"
                  value={formData.semestre} onChange={handleChange}
                  placeholder="ej. 3" min="1" max="12" required
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>N° de estudiantes</label>
                <input
                  type="number" name="numeroEstudiantes"
                  value={formData.numeroEstudiantes} onChange={handleChange}
                  placeholder="ej. 28" min="0" required
                  className={INPUT}
                />
              </div>
            </div>

            {/* Turno */}
            <div>
              <label className={LABEL}>Turno</label>
              <select
                name="turno"
                value={formData.turno} onChange={handleChange}
                required
                className={`${INPUT} cursor-pointer appearance-none`}
              >
                <option value="" className="bg-[#0d2f7a] text-white">Selecciona un turno</option>
                <option value="matutino"   className="bg-[#0d2f7a] text-white">Matutino</option>
                <option value="vespertino" className="bg-[#0d2f7a] text-white">Vespertino</option>
                <option value="nocturno"   className="bg-[#0d2f7a] text-white">Nocturno</option>
              </select>
            </div>

            {/* Ciclo escolar */}
            <div>
              <label className={LABEL}>Ciclo escolar</label>
              <input
                type="text" name="cicloEscolar"
                value={formData.cicloEscolar} onChange={handleChange}
                placeholder="ej. 2026-1" required
                className={INPUT}
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
                Grupo activo
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
