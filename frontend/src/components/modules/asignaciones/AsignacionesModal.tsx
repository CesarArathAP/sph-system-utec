import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RefreshCw, BookCopy, X, AlertTriangle } from 'lucide-react';
import { useAsignacionesForm } from './logic/useAsignacionesForm';
import type { AsignacionesModalProps, DocenteOption } from './logic/types';

const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 text-white text-sm placeholder:text-white/40 outline-none transition focus:border-white/60 focus:bg-white/20';
const SELECT = 'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-[#0d2a6e] text-white text-sm outline-none transition focus:border-white/60 cursor-pointer';
const LABEL = 'block text-xs font-semibold text-white/70 mb-1.5 tracking-wide uppercase';

const docenteLabel = (d: DocenteOption) =>
  d.user ? `${d.user.nombre} ${d.user.apellido} (${d.codigo_docente})` : d.codigo_docente;

export default function AsignacionesModal({ isOpen, editing, onClose, onSaved }: AsignacionesModalProps) {
  const { form, grupos, materias, docentes, loadingData, saving, error, isEdit, handleChange, handleSubmit } =
    useAsignacionesForm(isOpen, editing, onSaved);

  return (
    <Dialog.Root open={isOpen} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     w-11/12 sm:w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl
                     focus:outline-none bg-[linear-gradient(145deg,#0a2460cc,#0d3494cc)]
                     backdrop-blur-xl border border-white/20"
          onEscapeKeyDown={onClose}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/15
                          sticky top-0 bg-[linear-gradient(135deg,#0a2a6e,#0d3494)] rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 border border-white/25">
                <BookCopy size={16} className="text-white" />
              </div>
              <Dialog.Title className="text-white font-bold text-base">
                {isEdit ? 'Editar asignación' : 'Nueva asignación'}
              </Dialog.Title>
            </div>
            <Dialog.Close onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition cursor-pointer">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="p-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <RefreshCw size={22} className="animate-spin text-blue-400" />
                <span className="text-white/60 text-sm">Cargando datos…</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm">
                    <AlertTriangle size={15} className="shrink-0" />{error}
                  </div>
                )}
                <div>
                  <label className={LABEL}>Ciclo escolar <span className="text-red-400">*</span></label>
                  <input type="text" name="ciclo_escolar" value={form.ciclo_escolar}
                    onChange={handleChange} placeholder="ej. 2026-1" required className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Grupo <span className="text-red-400">*</span></label>
                  <select name="grupo_id" value={form.grupo_id} onChange={handleChange} required className={SELECT}>
                    <option value={0} className="bg-[#0d2a6e]">— Seleccionar grupo —</option>
                    {grupos.map(g => <option key={g.id} value={g.id} className="bg-[#0d2a6e]">{g.nombre} ({g.codigo_grupo}) · S{g.semestre} · {g.ciclo_escolar}</option>)}
                  </select>
                  {grupos.length === 0 && <p className="text-xs text-amber-400 mt-1.5">⚠ No hay grupos activos.</p>}
                </div>
                <div>
                  <label className={LABEL}>Materia <span className="text-red-400">*</span></label>
                  <select name="materia_id" value={form.materia_id} onChange={handleChange} required className={SELECT}>
                    <option value={0} className="bg-[#0d2a6e]">— Seleccionar materia —</option>
                    {materias.map(m => <option key={m.id} value={m.id} className="bg-[#0d2a6e]">{m.nombre} ({m.codigo_materia}) · {m.horas_semana}h/sem</option>)}
                  </select>
                  {materias.length === 0 && <p className="text-xs text-amber-400 mt-1.5">⚠ No hay materias activas.</p>}
                </div>
                <div>
                  <label className={LABEL}>Docente <span className="text-red-400">*</span></label>
                  <select name="docente_id" value={form.docente_id} onChange={handleChange} required className={SELECT}>
                    <option value={0} className="bg-[#0d2a6e]">— Seleccionar docente —</option>
                    {docentes.map(d => <option key={d.id} value={d.id} className="bg-[#0d2a6e]">{docenteLabel(d)}</option>)}
                  </select>
                  {docentes.length === 0 && <p className="text-xs text-amber-400 mt-1.5">⚠ No hay docentes activos.</p>}
                </div>
                <div className="flex gap-3 pt-2 border-t border-white/15">
                  <button type="button" onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/25 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                               bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)] hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)]
                               hover:-translate-y-px transition-all duration-200 disabled:opacity-60">
                    {saving && <RefreshCw size={14} className="animate-spin" />}
                    {saving ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear asignación')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
