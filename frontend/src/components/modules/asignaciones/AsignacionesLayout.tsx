import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Pencil, Trash2, RefreshCw, BookCopy,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Info, X,
} from 'lucide-react';
import AsignacionesModal from './AsignacionesModal';
import { API_CONFIG } from '../../../services/config';

/* ─── Tipos ─────────────────────────────────────────────────── */
interface Asignacion {
  id: number;
  grupo_id: number;
  materia_id: number;
  docente_id: number;
  ciclo_escolar: string;
  created_at: string;
  grupo?:   { id: number; nombre: string; codigo_grupo: string; carrera: string; semestre: number };
  materia?: { id: number; nombre: string; codigo_materia: string; creditos: number; horas_semana: number };
  docente?: { id: number; codigo_docente: string; user?: { nombre: string; apellido: string; email: string } };
}

/* ─── Toast ─────────────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: number; type: ToastType; title: string; message: string }

const toastAccent:   Record<ToastType, string> = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500' };
const toastIconColor:Record<ToastType, string> = { success: 'text-green-400', error: 'text-red-400', warning: 'text-amber-400', info: 'text-blue-400' };
const toastIconEl:   Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />, error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />, info: <Info size={18} />,
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-[320px] pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="flex overflow-hidden rounded-2xl shadow-2xl pointer-events-auto bg-slate-900 border border-slate-700">
          <div className={`w-1 shrink-0 ${toastAccent[t.type]}`} />
          <div className={`flex items-start pt-3.5 px-3 ${toastIconColor[t.type]}`}>{toastIconEl[t.type]}</div>
          <div className="flex-1 py-3 pr-2 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">{t.title}</p>
            {t.message && <p className="text-slate-400 text-xs mt-1 leading-snug">{t.message}</p>}
          </div>
          <button onClick={() => onRemove(t.id)} className="px-3 pt-3 text-slate-500 hover:text-white transition cursor-pointer self-start">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ open, message, onConfirm, onCancel }:
  { open: boolean; message: string; onConfirm: () => void; onCancel: () => void }) {
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
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition cursor-pointer">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition cursor-pointer shadow-[0_2px_8px_rgba(220,38,38,0.35)]">
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE      = `${API_CONFIG.BASE_URL}/asignaciones`;
const PAGE_SIZE = 10;

const SEM_COLORS = [
  '',
  'bg-blue-100   text-blue-700   border border-blue-200',
  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'bg-amber-100  text-amber-700  border border-amber-200',
  'bg-purple-100 text-purple-700 border border-purple-200',
  'bg-pink-100   text-pink-700   border border-pink-200',
  'bg-indigo-100 text-indigo-700 border border-indigo-200',
];

/* ─── Componente principal ──────────────────────────────────── */
export default function AsignacionesLayout() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterCiclo, setFilterCiclo]   = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState<Asignacion | null>(null);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [confirm, setConfirm]           = useState<{ open: boolean; id?: number; label: string }>({ open: false, label: '' });

  const addToast = (type: ToastType, title: string, message = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  /* ── Fetch */
  const fetchAsignaciones = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (filterCiclo.trim()) params.set('ciclo_escolar', filterCiclo.trim());
      const res = await fetch(`${BASE}?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setAsignaciones(data.asignaciones ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar asignaciones');
    } finally { setLoading(false); }
  }, [page, filterCiclo]);

  useEffect(() => { fetchAsignaciones(); }, [fetchAsignaciones]);

  /* ── Eliminar */
  const handleDelete = (id: number, label: string) => {
    setConfirm({ open: true, id, label });
  };
  const confirmDelete = async () => {
    const { id, label } = confirm;
    setConfirm({ open: false, label: '' });
    if (!id) return;
    try {
      const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchAsignaciones();
      addToast('info', 'Asignación eliminada', `"${label}" fue eliminada junto con sus horarios`);
    } catch (e: any) {
      addToast('error', 'No se pudo eliminar', e.message);
    }
  };

  /* ── Filtro local */
  const filtered = asignaciones.filter(a => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    const materia = a.materia?.nombre ?? '';
    const grupo   = a.grupo?.nombre ?? '';
    const codigo  = a.grupo?.codigo_grupo ?? '';
    const docente = a.docente?.user
      ? `${a.docente.user.nombre} ${a.docente.user.apellido}`
      : a.docente?.codigo_docente ?? '';
    return (
      materia.toLowerCase().includes(term) ||
      grupo.toLowerCase().includes(term)   ||
      codigo.toLowerCase().includes(term)  ||
      docente.toLowerCase().includes(term) ||
      a.ciclo_escolar.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* ── Render */
  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-full bg-[#081028] text-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={confirm.open}
        message={`¿Deseas eliminar permanentemente la asignación "${confirm.label}"? También se eliminarán sus horarios asociados.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, label: '' })}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl
                          bg-[linear-gradient(145deg,#1e56d9,#0d3ab0)]
                          shadow-[0_4px_16px_rgba(15,63,196,0.45)]">
            <BookCopy size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Asignaciones</h1>
            <p className="text-white/40 text-xs sm:text-sm">{total} asignación(es) registradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAsignaciones} title="Actualizar"
            className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition text-blue-400 cursor-pointer">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white cursor-pointer
                       bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                       hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)] hover:-translate-y-px transition-all duration-200">
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva asignación</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar materia, grupo, docente…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5
                       text-sm text-white placeholder:text-white/30
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                       transition" />
        </div>
        <div className="w-full sm:w-48">
          <input type="text" value={filterCiclo} onChange={e => { setFilterCiclo(e.target.value); setPage(1); }}
            placeholder="Filtrar por ciclo (2026-1)"
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5
                       text-sm text-white placeholder:text-white/30
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                       transition" />
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
          <XCircle size={18} className="shrink-0 text-red-400" />{error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/10">
              <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">#</th>
              <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Materia</th>
              <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Grupo</th>
              <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Docente</th>
              <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Ciclo</th>
              <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <RefreshCw size={26} className="animate-spin text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-white/30">Cargando asignaciones…</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <BookCopy size={30} className="mx-auto mb-2 text-white/20" />
                  <p className="text-sm text-white/30">
                    {searchTerm ? 'Sin resultados para la búsqueda' : 'No hay asignaciones registradas'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((a, i) => {
                const semColor   = SEM_COLORS[a.grupo?.semestre ?? 0] ?? 'bg-gray-100 text-gray-600';
                const docLabel   = a.docente?.user
                  ? `${a.docente.user.nombre} ${a.docente.user.apellido}`
                  : a.docente?.codigo_docente ?? '—';
                const deleteLabel = `${a.materia?.nombre ?? ''} → ${a.grupo?.nombre ?? ''}`;

                return (
                  <tr key={a.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-white/25 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-white text-sm">{a.materia?.nombre ?? '—'}</p>
                      <p className="text-xs text-white/35 mt-0.5">
                        {a.materia?.codigo_materia} · {a.materia?.horas_semana}h/sem · {a.materia?.creditos} cr.
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${semColor}`}>
                          S{a.grupo?.semestre}
                        </span>
                        <div>
                          <p className="font-semibold text-white text-sm">{a.grupo?.nombre ?? '—'}</p>
                          <p className="text-xs text-white/35">{a.grupo?.codigo_grupo} · {a.grupo?.carrera}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-white text-sm">{docLabel}</p>
                      {a.docente?.user?.email && (
                        <p className="text-xs text-white/35">{a.docente.user.email}</p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {a.ciclo_escolar}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditing(a); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition cursor-pointer"
                          title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(a.id, deleteLabel)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-white/30">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/10 text-blue-400 disabled:opacity-30 transition cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/10 text-blue-400 disabled:opacity-30 transition cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AsignacionesModal
        isOpen={modalOpen}
        editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={() => {
          setModalOpen(false); setEditing(null); fetchAsignaciones();
          addToast('success',
            editing ? 'Asignación actualizada' : 'Asignación creada',
            editing ? 'Los cambios fueron guardados' : 'Nueva asignación registrada exitosamente'
          );
        }}
      />
    </div>
  );
}
