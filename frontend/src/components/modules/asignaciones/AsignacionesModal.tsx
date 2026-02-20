import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RefreshCw } from 'lucide-react';
import { API_CONFIG } from '../../../services/config';

/* ── Tipos ──────────────────────────────────────────────────────────── */
interface Asignacion {
    id: number;
    grupo_id: number;
    materia_id: number;
    docente_id: number;
    ciclo_escolar: string;
    grupo?: { id: number; nombre: string; codigo_grupo: string };
    materia?: { id: number; nombre: string; codigo_materia: string };
    docente?: { id: number; codigo_docente: string; user?: { nombre: string; apellido: string } };
}

interface GrupoOption { id: number; nombre: string; codigo_grupo: string; carrera: string; semestre: number; ciclo_escolar: string }
interface MateriaOption { id: number; nombre: string; codigo_materia: string; horas_semana: number }
interface DocenteOption { id: number; codigo_docente: string; user?: { nombre: string; apellido: string } }

interface Props {
    isOpen: boolean;
    editing: Asignacion | null;
    onClose: () => void;
    onSaved: () => void;
}

function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = API_CONFIG.BASE_URL;

const EMPTY = { grupo_id: 0, materia_id: 0, docente_id: 0, ciclo_escolar: '' };

export default function AsignacionesModal({ isOpen, editing, onClose, onSaved }: Props) {
    const isEdit = !!editing;

    const [form, setForm] = useState(EMPTY);
    const [grupos, setGrupos] = useState<GrupoOption[]>([]);
    const [materias, setMaterias] = useState<MateriaOption[]>([]);
    const [docentes, setDocentes] = useState<DocenteOption[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Cargar opciones cuando se abre el modal */
    useEffect(() => {
        if (!isOpen) return;
        setError(null);

        if (isEdit && editing) {
            setForm({
                grupo_id: editing.grupo_id,
                materia_id: editing.materia_id,
                docente_id: editing.docente_id,
                ciclo_escolar: editing.ciclo_escolar,
            });
        } else {
            setForm(EMPTY);
        }

        const load = async () => {
            setLoadingData(true);
            try {
                const [rGrupos, rMaterias, rDocentes] = await Promise.all([
                    fetch(`${BASE}/grupos?page=1&page_size=100&activo=true`, { headers: { Authorization: `Bearer ${getToken()}` } }),
                    fetch(`${BASE}/materias?page=1&page_size=100&activo=true`, { headers: { Authorization: `Bearer ${getToken()}` } }),
                    fetch(`${BASE}/docentes?page=1&page_size=100&activo=true`, { headers: { Authorization: `Bearer ${getToken()}` } }),
                ]);
                const dg = rGrupos.ok ? await rGrupos.json() : {};
                const dm = rMaterias.ok ? await rMaterias.json() : {};
                const dd = rDocentes.ok ? await rDocentes.json() : {};
                setGrupos(dg.grupos ?? []);
                setMaterias(dm.materias ?? []);
                setDocentes(dd.docentes ?? []);
            } finally {
                setLoadingData(false);
            }
        };

        load();
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: ['grupo_id', 'materia_id', 'docente_id'].includes(name) ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.grupo_id || !form.materia_id || !form.docente_id) {
            setError('Selecciona grupo, materia y docente'); return;
        }
        if (!form.ciclo_escolar.trim()) { setError('El ciclo escolar es requerido'); return; }

        setSaving(true); setError(null);
        try {
            const url = isEdit ? `${BASE}/asignaciones/${editing!.id}` : `${BASE}/asignaciones`;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.detail ?? `Error ${res.status}`);
            }
            onSaved();
        } catch (e: any) {
            setError(e.message ?? 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const docenteLabel = (d: DocenteOption) =>
        d.user ? `${d.user.nombre} ${d.user.apellido} (${d.codigo_docente})` : d.codigo_docente;

    return (
        <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh]
                     overflow-y-auto focus:outline-none"
                    onEscapeKeyDown={onClose}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
                        <Dialog.Title className="text-lg font-bold text-gray-900">
                            {isEdit ? 'Editar asignación' : 'Nueva asignación'}
                        </Dialog.Title>
                        <Dialog.Close onClick={onClose}
                            className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition">×</Dialog.Close>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {loadingData ? (
                            <div className="flex items-center justify-center py-10">
                                <RefreshCw size={22} className="animate-spin text-indigo-500" />
                                <span className="ml-2 text-sm text-gray-500">Cargando datos…</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
                                )}

                                {/* Ciclo escolar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ciclo escolar <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="ciclo_escolar" value={form.ciclo_escolar}
                                        onChange={handleChange} placeholder="ej. 2026-1" required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                {/* Grupo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Grupo <span className="text-red-500">*</span>
                                    </label>
                                    <select name="grupo_id" value={form.grupo_id} onChange={handleChange} required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value={0}>— Seleccionar grupo —</option>
                                        {grupos.map(g => (
                                            <option key={g.id} value={g.id}>
                                                {g.nombre} ({g.codigo_grupo}) · S{g.semestre} · {g.ciclo_escolar}
                                            </option>
                                        ))}
                                    </select>
                                    {grupos.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ No hay grupos activos.</p>}
                                </div>

                                {/* Materia */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Materia <span className="text-red-500">*</span>
                                    </label>
                                    <select name="materia_id" value={form.materia_id} onChange={handleChange} required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value={0}>— Seleccionar materia —</option>
                                        {materias.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.nombre} ({m.codigo_materia}) · {m.horas_semana}h/sem
                                            </option>
                                        ))}
                                    </select>
                                    {materias.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ No hay materias activas.</p>}
                                </div>

                                {/* Docente */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Docente <span className="text-red-500">*</span>
                                    </label>
                                    <select name="docente_id" value={form.docente_id} onChange={handleChange} required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value={0}>— Seleccionar docente —</option>
                                        {docentes.map(d => (
                                            <option key={d.id} value={d.id}>{docenteLabel(d)}</option>
                                        ))}
                                    </select>
                                    {docentes.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ No hay docentes activos.</p>}
                                </div>

                                {/* Botones */}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={onClose}
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition text-sm">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-60">
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
