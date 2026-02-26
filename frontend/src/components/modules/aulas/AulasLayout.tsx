import React, { useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Building2,
  PowerOff,
  Power,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Info,
} from 'lucide-react';
import AulasModal from './AulasModal';
import { API_CONFIG } from '../../../services/config';
import { useAulasTable } from './logic/useAulasTable';
import { useAulasActions } from './logic/useAulasActions';
import type { Aula, Toast, ToastType } from './logic/types';
import { TIPO_COLORS } from './logic/constants';

const toastAccent: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

const toastIconColor: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};

const toastIconEl: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-[320px] pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex overflow-hidden rounded-2xl shadow-2xl pointer-events-auto bg-slate-900 border border-slate-700">
          <div className={`w-1 shrink-0 ${toastAccent[t.type]}`} />
          <div className={`flex items-start pt-3.5 px-3 ${toastIconColor[t.type]}`}>{toastIconEl[t.type]}</div>
          <div className="flex-1 py-3 pr-2 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">{t.title}</p>
            {t.message && <p className="text-slate-400 text-xs mt-1 leading-snug">{t.message}</p>}
          </div>
          <button
            onClick={() => onRemove(t.id)}
            className="px-3 pt-3 text-slate-500 hover:text-white transition cursor-pointer self-start">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 shrink-0">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-base leading-tight">Eliminar registro</h3>
            <p className="text-gray-500 text-sm mt-1 leading-snug">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition cursor-pointer shadow-[0_2px_8px_rgba(220,38,38,0.35)]">
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AulasLayout() {
  // Table state & logic
  const { aulas, filtered, total, loading, error, searchTerm, setSearchTerm, fetchAulas } = useAulasTable();

  // Actions & toast
  const { toasts, removeToast, addToast, confirm, handleToggleActivo, handleDelete, confirmDelete, cancelDelete } =
    useAulasActions(fetchAulas);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);

  /* ── Guardar ── */
  const handleSave = async (aula: Aula) => {
    const isNew = !selectedAula?.id;
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? `${API_CONFIG.BASE_URL}/aulas` : `${API_CONFIG.BASE_URL}/aulas/${selectedAula!.id}`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
        },
        body: JSON.stringify({
          codigo_aula: aula.codigo,
          nombre: aula.nombre,
          capacidad: aula.capacidad || 1,
          tipo: aula.tipo,
          edificio: aula.edificio || null,
          piso: aula.piso && aula.piso > 0 ? aula.piso : null,
          equipamiento: aula.equipamiento || null,
          activo: aula.activo,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.detail ?? `Error ${res.status}`;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
      setIsModalOpen(false);
      await fetchAulas();
      addToast(
        'success',
        isNew ? 'Aula creada' : 'Aula actualizada',
        isNew ? `"${aula.nombre}" fue registrada exitosamente` : `"${aula.nombre}" fue actualizada`
      );
    } catch (e: any) {
      addToast('error', 'No se pudo guardar', e.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-full bg-[#081028] text-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={confirm.open}
        message={confirm.msg}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl
                          bg-[linear-gradient(145deg,#1e56d9,#0d3ab0)]
                          shadow-[0_4px_16px_rgba(15,63,196,0.45)]">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Aulas</h1>
            <p className="text-white/40 text-xs sm:text-sm">{total} aulas registradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAulas}
            title="Actualizar"
            className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition text-blue-400"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setSelectedAula(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white
                       bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                       hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)]
                       hover:-translate-y-px transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva aula</span>
          </button>
        </div>
      </div>

      {/* ── Buscador ── */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
        <input
          type="text"
          placeholder="Buscar código, nombre, tipo, edificio..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5
                     text-sm text-white placeholder:text-white/30
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                     transition"
        />
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
          <span className="text-white/30 text-sm">Cargando aulas...</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20
                        text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
          <XCircle size={18} className="shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {/* ── Tabla ── */}
      {!loading && !error && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-max">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Código</th>
                <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Nombre</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Tipo</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Capacidad</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Edificio</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Piso</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Estado</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-white/30 text-sm">
                    {searchTerm ? 'Sin resultados para la búsqueda' : 'No hay aulas registradas'}
                  </td>
                </tr>
              ) : (
                filtered.map((aula) => (
                  <tr key={aula.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-400 text-xs">{aula.codigo}</td>
                    <td className="px-4 py-3 text-white max-w-[180px] truncate text-sm" title={aula.nombre}>{aula.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                        ${TIPO_COLORS[aula.tipo?.toLowerCase()] ?? 'bg-white/10 text-white/50 border border-white/10'}`}>
                        {aula.tipo || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-white/70 text-sm">{aula.capacidad}</td>
                    <td className="px-4 py-3 text-center text-white/60 text-sm">{aula.edificio || '—'}</td>
                    <td className="px-4 py-3 text-center text-white/60 text-sm">{aula.piso ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                        ${aula.activo
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                          : 'bg-red-500/20   text-red-400   border border-red-500/20'}`}>
                        {aula.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedAula(aula); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(aula)}
                          className={`p-1.5 rounded-lg transition cursor-pointer
                            ${aula.activo ? 'hover:bg-amber-500/20 text-amber-400' : 'hover:bg-emerald-500/20 text-emerald-400'}`}
                          title={aula.activo ? 'Suspender' : 'Activar'}
                        >
                          {aula.activo ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(aula.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      <AulasModal
        isOpen={isModalOpen}
        aula={selectedAula}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
