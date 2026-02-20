import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Pencil, Trash2, RefreshCw, BookCopy, ChevronLeft, ChevronRight,
} from 'lucide-react';
import AsignacionesModal from './AsignacionesModal';
import { API_CONFIG } from '../../../services/config';

/* ── Tipos ──────────────────────────────────────────────────────────── */
interface Asignacion {
    id: number;
    grupo_id: number;
    materia_id: number;
    docente_id: number;
    ciclo_escolar: string;
    created_at: string;
    grupo?: { id: number; nombre: string; codigo_grupo: string; carrera: string; semestre: number };
    materia?: { id: number; nombre: string; codigo_materia: string; creditos: number; horas_semana: number };
    docente?: {
        id: number; codigo_docente: string;
        user?: { nombre: string; apellido: string; email: string };
    };
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = `${API_CONFIG.BASE_URL}/asignaciones`;
const PAGE_SIZE = 10;

/* ── Badges ──────────────────────────────────────────────────────────── */
const SEM_COLORS = ['', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-700', 'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700', 'bg-indigo-100 text-indigo-700'];

/* ═════════════════════════════════════════════════════════════════════ */
export default function AsignacionesLayout() {
    const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCiclo, setFilterCiclo] = useState('');

    /* Modal */
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Asignacion | null>(null);

    /* ── Fetch ─────────────────────────────────────────────────────────── */
    const fetchAsignaciones = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
            if (filterCiclo.trim()) params.set('ciclo_escolar', filterCiclo.trim());
            const res = await fetch(`${BASE}?${params}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();
            setAsignaciones(data.asignaciones ?? []);
            setTotal(data.total ?? 0);
        } catch (e: any) {
            setError(e.message ?? 'Error al cargar asignaciones');
        } finally {
            setLoading(false);
        }
    }, [page, filterCiclo]);

    useEffect(() => { fetchAsignaciones(); }, [fetchAsignaciones]);

    /* ── Eliminar ──────────────────────────────────────────────────────── */
    const handleDelete = async (id: number, label: string) => {
        if (!confirm(`¿Eliminar la asignación "${label}"?\nEsto también eliminará sus horarios asociados.`)) return;
        try {
            const res = await fetch(`${BASE}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            fetchAsignaciones();
        } catch (e: any) {
            alert(e.message ?? 'Error al eliminar');
        }
    };

    /* ── Filtro local ────────────────────────────────────────────────────── */
    const filtered = asignaciones.filter((a) => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        const materia = a.materia?.nombre ?? '';
        const grupo = a.grupo?.nombre ?? '';
        const codigo = a.grupo?.codigo_grupo ?? '';
        const docente = a.docente?.user
            ? `${a.docente.user.nombre} ${a.docente.user.apellido}`
            : a.docente?.codigo_docente ?? '';
        return (
            materia.toLowerCase().includes(term) ||
            grupo.toLowerCase().includes(term) ||
            codigo.toLowerCase().includes(term) ||
            docente.toLowerCase().includes(term) ||
            a.ciclo_escolar.toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(total / PAGE_SIZE);

    /* ── RENDER ──────────────────────────────────────────────────────────── */
    return (
        <div className="p-6 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookCopy className="text-indigo-600" size={28} />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Asignaciones</h1>
                        <p className="text-sm text-gray-500">{total} asignación(es) registrada(s)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAsignaciones}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition" title="Recargar">
                        <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-500' : 'text-gray-500'} />
                    </button>
                    <button
                        onClick={() => { setEditing(null); setModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition"
                    >
                        <Plus size={15} /> Nueva asignación
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-52">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por materia, grupo, docente…"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="relative">
                    <input
                        type="text" value={filterCiclo} onChange={(e) => { setFilterCiclo(e.target.value); setPage(1); }}
                        placeholder="Filtrar ciclo (ej: 2026-1)"
                        className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 w-8">#</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Materia</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Grupo</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Docente</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">Ciclo</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-600 w-24">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center">
                                    <RefreshCw size={22} className="animate-spin text-indigo-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">Cargando asignaciones…</p>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                                    <BookCopy size={28} className="mx-auto mb-2 text-gray-300" />
                                    No se encontraron asignaciones
                                </td>
                            </tr>
                        ) : (
                            filtered.map((a, i) => {
                                const semColor = SEM_COLORS[a.grupo?.semestre ?? 0] ?? 'bg-gray-100 text-gray-600';
                                const docLabel = a.docente?.user
                                    ? `${a.docente.user.nombre} ${a.docente.user.apellido}`
                                    : a.docente?.codigo_docente ?? '—';
                                const deleteLabel = `${a.materia?.nombre ?? ''} → ${a.grupo?.nombre ?? ''}`;
                                return (
                                    <tr key={a.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">{a.materia?.nombre ?? '—'}</p>
                                            <p className="text-xs text-gray-400">
                                                {a.materia?.codigo_materia} · {a.materia?.horas_semana}h/sem · {a.materia?.creditos} cr.
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${semColor}`}>
                                                    S{a.grupo?.semestre}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-800">{a.grupo?.nombre ?? '—'}</p>
                                                    <p className="text-xs text-gray-400">{a.grupo?.codigo_grupo} · {a.grupo?.carrera}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">{docLabel}</p>
                                            {a.docente?.user?.email && (
                                                <p className="text-xs text-gray-400">{a.docente.user.email}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                                {a.ciclo_escolar}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => { setEditing(a); setModalOpen(true); }}
                                                    className="p-1.5 rounded hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition" title="Editar">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(a.id, deleteLabel)}
                                                    className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition" title="Eliminar">
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                        <span>Pág. {page} de {totalPages}</span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">
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
                onSaved={() => { setModalOpen(false); setEditing(null); fetchAsignaciones(); }}
            />
        </div>
    );
}
