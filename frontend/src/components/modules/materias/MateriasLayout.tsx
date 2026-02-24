import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Search, Pencil, Trash2, RefreshCw, Plus,
  FlaskConical, Monitor, Mic, LayoutGrid,
  CheckCircle2, XCircle, AlertTriangle, Info, X,
} from 'lucide-react';
import MateriasModal from './MateriasModal';
import { API_CONFIG } from '../../../services/config';

/* ─── Tipos ─────────────────────────────────────────────────── */
export interface Materia {
  id?: number;
  codigo_materia: string;
  nombre: string;
  creditos: number;
  horas_semana: number;
  requiere_laboratorio: boolean;
  tipo_aula_requerida: string | null;
  descripcion: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: number; type: ToastType; title: string; message: string; }

/* ─── Toast ─────────────────────────────────────────────────── */
const toastAccent: Record<ToastType, string> = {
  success: 'bg-green-500', error: 'bg-red-500',
  warning: 'bg-amber-500', info:  'bg-blue-500',
};
const toastIconColor: Record<ToastType, string> = {
  success: 'text-green-400', error:   'text-red-400',
  warning: 'text-amber-400', info:    'text-blue-400',
};
const toastIconEl: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2  size={18} />,
  error:   <XCircle       size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info          size={18} />,
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-[320px] pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className="flex overflow-hidden rounded-2xl shadow-2xl pointer-events-auto bg-slate-900 border border-slate-700"
        >
          <div className={`w-1 shrink-0 ${toastAccent[t.type]}`} />
          <div className={`flex items-start pt-3.5 px-3 ${toastIconColor[t.type]}`}>{toastIconEl[t.type]}</div>
          <div className="flex-1 py-3 pr-2 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight">{t.title}</p>
            {t.message && <p className="text-slate-400 text-xs mt-1 leading-snug">{t.message}</p>}
          </div>
          <button onClick={() => onRemove(t.id)}
            className="px-3 pt-3 text-slate-500 hover:text-white transition cursor-pointer self-start">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Confirm Dialog ────────────────────────────────────────── */
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
const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIAS}`;

const tipoAulaInfo: Record<string, { label: string; className: string; Icon: React.FC<any> }> = {
  normal:      { label: 'Normal',      className: 'bg-blue-100   text-blue-700   border border-blue-200',   Icon: LayoutGrid  },
  computo:     { label: 'Cómputo',     className: 'bg-cyan-100   text-cyan-700   border border-cyan-200',   Icon: Monitor     },
  laboratorio: { label: 'Laboratorio', className: 'bg-purple-100 text-purple-700 border border-purple-200', Icon: FlaskConical },
  auditorio:   { label: 'Auditorio',   className: 'bg-amber-100  text-amber-700  border border-amber-200',  Icon: Mic         },
};

function TipoAulaBadge({ tipo }: { tipo: string | null }) {
  if (!tipo) return <span className="text-gray-400 text-xs">—</span>;
  const info = tipoAulaInfo[tipo.toLowerCase()] ?? { label: tipo, className: 'bg-gray-100 text-gray-600 border border-gray-200', Icon: LayoutGrid };
  const Icon = info.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${info.className}`}>
      <Icon size={11} />{info.label}
    </span>
  );
}

/* ─── Componente principal ──────────────────────────────────── */
export default function MateriasLayout() {
  const [materias, setMaterias]           = useState<Materia[]>([]);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [toasts, setToasts]               = useState<Toast[]>([]);
  const [confirm, setConfirm]             = useState<{ open: boolean; id?: number; msg: string }>({ open: false, msg: '' });

  const addToast = (type: ToastType, title: string, message = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  /* ── Fetch */
  const fetchMaterias = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE}?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setMaterias(data.materias ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar materias');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMaterias(); }, [fetchMaterias]);

  /* ── Guardar */
  const handleSave = async (materia: Materia) => {
    const isNew = !selectedMateria?.id;
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url    = isNew ? BASE : `${BASE}/${selectedMateria!.id}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(materia),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Error ${res.status}`);
      }
      setIsModalOpen(false);
      await fetchMaterias();
      addToast('success',
        isNew ? 'Materia creada' : 'Materia actualizada',
        isNew ? `"${materia.nombre}" fue registrada exitosamente` : `"${materia.nombre}" fue actualizada`
      );
    } catch (e: any) {
      addToast('error', 'No se pudo guardar', e.message);
    }
  };

  /* ── Eliminar */
  const handleDelete = (id: number | undefined) => {
    if (!id) return;
    const m = materias.find(x => x.id === id);
    setConfirm({ open: true, id, msg: `¿Deseas eliminar permanentemente la materia "${m?.nombre ?? id}"?` });
  };
  const confirmDelete = async () => {
    const id = confirm.id;
    setConfirm({ open: false, msg: '' });
    if (!id) return;
    const m = materias.find(x => x.id === id);
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchMaterias();
      addToast('info', 'Materia eliminada', `"${m?.nombre ?? id}" fue eliminada`);
    } catch (e: any) {
      addToast('error', 'No se pudo eliminar', e.message);
    }
  };

  const filtered = materias.filter(m =>
    m.codigo_materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-full bg-[#081028] text-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog open={confirm.open} message={confirm.msg}
        onConfirm={confirmDelete} onCancel={() => setConfirm({ open: false, msg: '' })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl
                          bg-[linear-gradient(145deg,#1e56d9,#0d3ab0)]
                          shadow-[0_4px_16px_rgba(15,63,196,0.45)]">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Materias</h1>
            <p className="text-white/40 text-xs sm:text-sm">{total} materias registradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMaterias} title="Actualizar"
            className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition text-blue-400 cursor-pointer">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setSelectedMateria(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white cursor-pointer
                       bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                       hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)]
                       hover:-translate-y-px transition-all duration-200">
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva materia</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
        <input
          type="text"
          placeholder="Buscar código o nombre..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5
                     text-sm text-white placeholder:text-white/30
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent
                     transition"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
          <span className="text-white/30 text-sm">Cargando materias...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20
                        text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
          <XCircle size={18} className="shrink-0 text-red-400" />{error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-max">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Código</th>
                <th className="text-left px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Nombre</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Créditos</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Hrs/Sem</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Tipo Aula</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Laboratorio</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Estado</th>
                <th className="text-center px-4 py-3 font-black text-white/30 whitespace-nowrap text-[10px] tracking-[0.2em] uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-white/30 text-sm">
                    {searchTerm ? 'Sin resultados para la búsqueda' : 'No hay materias registradas'}
                  </td>
                </tr>
              ) : (
                filtered.map((materia) => (
                  <tr key={materia.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-400 text-xs">{materia.codigo_materia}</td>
                    <td className="px-4 py-3 text-white max-w-[200px] truncate text-sm" title={materia.nombre}>{materia.nombre}</td>
                    <td className="px-4 py-3 text-center text-white/70 text-sm">{materia.creditos}</td>
                    <td className="px-4 py-3 text-center text-white/70 text-sm">{materia.horas_semana}</td>
                    <td className="px-4 py-3 text-center">
                      <TipoAulaBadge tipo={materia.tipo_aula_requerida} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {materia.requiere_laboratorio ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/20">
                          <FlaskConical size={11} /> Sí
                        </span>
                      ) : (
                        <span className="text-white/25 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                        ${materia.activo
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/20   text-red-400   border border-red-500/20'}`}>
                        {materia.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedMateria(materia); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition cursor-pointer"
                          title="Editar materia">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(materia.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          title="Eliminar materia">
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

      <MateriasModal
        isOpen={isModalOpen}
        materia={selectedMateria}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
