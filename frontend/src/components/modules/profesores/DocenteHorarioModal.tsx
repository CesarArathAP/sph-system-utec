import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
    X, RefreshCw, Calendar, Clock, BookOpen,
    Users, Building2, GraduationCap,
} from 'lucide-react';
import { API_CONFIG } from '../../../services/config';
import type { Docente } from './ProfesoresLayout';

/* ── Tipos ───────────────────────────────────────────────────── */
interface Horario {
    id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    tipo_sesion: string;
    activo: boolean;
    asignacion?: {
        id: number;
        ciclo_escolar: string;
        materia?: { nombre: string; codigo: string };
        grupo?: { nombre: string; codigo_grupo: string };
        docente?: { codigo_docente: string };
    };
    aula?: { nombre: string; codigo_aula: string };
}

interface DocenteHorarioModalProps {
    isOpen: boolean;
    docente: Docente | null;
    onClose: () => void;
}

/* ── Constantes ──────────────────────────────────────────────── */
const DIAS_ORDEN = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIAS_LABEL: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};
const TIPO_COLOR: Record<string, string> = {
    teorica: 'bg-blue-50 border-blue-200 text-blue-800',
    practica: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    laboratorio: 'bg-violet-50 border-violet-200 text-violet-800',
};
const TIPO_BADGE: Record<string, string> = {
    teorica: 'bg-blue-100 text-blue-700',
    practica: 'bg-emerald-100 text-emerald-700',
    laboratorio: 'bg-violet-100 text-violet-700',
};

const BASE = API_CONFIG.BASE_URL;
function getToken() { return localStorage.getItem('auth_token') ?? ''; }

/* ── Fetch de horarios para un docente ───────────────────────── */
async function fetchHorariosDocente(docenteId: number): Promise<Horario[]> {
    // 1. Traer asignaciones del docente
    const asigRes = await fetch(
        `${BASE}/asignaciones?docente_id=${docenteId}&page=1&page_size=100`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    if (!asigRes.ok) throw new Error(`Error fetching asignaciones: ${asigRes.status}`);
    const asigData = await asigRes.json();
    const asignaciones: { id: number }[] = asigData.asignaciones ?? [];

    if (asignaciones.length === 0) return [];

    // 2. Para cada asignación traer sus horarios (en paralelo)
    const results = await Promise.all(
        asignaciones.map(async (a) => {
            const r = await fetch(
                `${BASE}/horarios?asignacion_id=${a.id}&page=1&page_size=50&activo=true`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            if (!r.ok) return [];
            const d = await r.json();
            return (d.horarios ?? []) as Horario[];
        })
    );

    return results.flat();
}

/* ── Componente principal ────────────────────────────────────── */
export default function DocenteHorarioModal({ isOpen, docente, onClose }: DocenteHorarioModalProps) {
    const [horarios, setHorarios] = useState<Horario[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !docente?.id) return;
        setLoading(true);
        setError(null);
        setHorarios([]);
        fetchHorariosDocente(docente.id)
            .then(setHorarios)
            .catch((e) => setError(e.message ?? 'Error al cargar horarios'))
            .finally(() => setLoading(false));
    }, [isOpen, docente?.id]);

    /* Agrupar por día */
    const porDia: Record<string, Horario[]> = {};
    DIAS_ORDEN.forEach((d) => { porDia[d] = []; });
    horarios.forEach((h) => {
        const dia = h.dia_semana?.toLowerCase();
        if (porDia[dia]) {
            porDia[dia].push(h);
            porDia[dia].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        }
    });

    const tieneHorarios = horarios.length > 0;
    const nombreDocente = docente?.user
        ? `${docente.user.nombre} ${docente.user.apellido}`
        : docente?.codigo_docente ?? 'Docente';

    /* Calcular horas totales */
    const horasTotales = horarios.reduce((acc, h) => {
        const [hi, mi] = h.hora_inicio.split(':').map(Number);
        const [hf, mf] = h.hora_fin.split(':').map(Number);
        return acc + ((hf * 60 + mf) - (hi * 60 + mi)) / 60;
    }, 0);

    return (
        <Dialog.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh]
                     overflow-hidden flex flex-col focus:outline-none"
                    onEscapeKeyDown={onClose}
                >
                    {/* ── Header ── */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <GraduationCap size={20} className="text-white" />
                            </div>
                            <div>
                                <Dialog.Title className="text-base font-bold text-white leading-tight">
                                    {nombreDocente}
                                </Dialog.Title>
                                <p className="text-blue-100 text-xs mt-0.5">
                                    {docente?.codigo_docente} · {docente?.departamento ?? 'Sin departamento'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {!loading && tieneHorarios && (
                                <div className="text-right">
                                    <p className="text-white font-bold text-lg leading-none">{horasTotales.toFixed(1)}h</p>
                                    <p className="text-blue-100 text-xs">de {docente?.horas_maximas_semana ?? '—'}h máx/semana</p>
                                </div>
                            )}
                            <Dialog.Close onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition text-white">
                                <X size={16} />
                            </Dialog.Close>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="overflow-y-auto flex-1 p-6">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <RefreshCw size={28} className="animate-spin text-blue-500" />
                                <p className="text-sm text-gray-400">Cargando horario…</p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        {!loading && !error && !tieneHorarios && (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                                <Calendar size={40} className="text-gray-300" />
                                <p className="text-gray-500 font-medium">Sin horarios asignados</p>
                                <p className="text-gray-400 text-xs max-w-xs">
                                    Este docente no tiene sesiones programadas todavía. Puedes agregar horarios desde el módulo de Asignaciones.
                                </p>
                            </div>
                        )}

                        {!loading && !error && tieneHorarios && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {DIAS_ORDEN.map((dia) => {
                                    const sesiones = porDia[dia];
                                    return (
                                        <div key={dia} className="flex flex-col gap-2">
                                            {/* Cabecera día */}
                                            <div className={`text-center py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest
                        ${sesiones.length > 0
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-400'}`}>
                                                {DIAS_LABEL[dia]}
                                                {sesiones.length > 0 && (
                                                    <span className="block text-[10px] font-normal text-blue-200 mt-0.5">
                                                        {sesiones.length} sesión{sesiones.length !== 1 ? 'es' : ''}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Sesiones del día */}
                                            {sesiones.length === 0 ? (
                                                <div className="flex-1 border border-dashed border-gray-200 rounded-lg flex items-center justify-center min-h-[80px]">
                                                    <span className="text-xs text-gray-300">Libre</span>
                                                </div>
                                            ) : (
                                                sesiones.map((h) => {
                                                    const colorCard = TIPO_COLOR[h.tipo_sesion] ?? 'bg-gray-50 border-gray-200 text-gray-800';
                                                    const colorBadge = TIPO_BADGE[h.tipo_sesion] ?? 'bg-gray-100 text-gray-600';
                                                    return (
                                                        <div key={h.id} className={`border rounded-xl p-3 space-y-1.5 ${colorCard}`}>
                                                            {/* Hora */}
                                                            <div className="flex items-center gap-1 text-xs font-bold">
                                                                <Clock size={10} className="shrink-0" />
                                                                {h.hora_inicio.slice(0, 5)} – {h.hora_fin.slice(0, 5)}
                                                            </div>

                                                            {/* Materia */}
                                                            {h.asignacion?.materia && (
                                                                <div className="flex items-start gap-1 text-[11px] leading-tight">
                                                                    <BookOpen size={9} className="shrink-0 mt-0.5" />
                                                                    <span className="font-semibold line-clamp-2">
                                                                        {h.asignacion.materia.nombre}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Grupo */}
                                                            {h.asignacion?.grupo && (
                                                                <div className="flex items-center gap-1 text-[11px]">
                                                                    <Users size={9} className="shrink-0" />
                                                                    <span>{h.asignacion.grupo.nombre}</span>
                                                                </div>
                                                            )}

                                                            {/* Aula */}
                                                            {h.aula && (
                                                                <div className="flex items-center gap-1 text-[11px]">
                                                                    <Building2 size={9} className="shrink-0" />
                                                                    <span>{h.aula.codigo_aula}</span>
                                                                </div>
                                                            )}

                                                            {/* Tipo sesión */}
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${colorBadge}`}>
                                                                {h.tipo_sesion}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    {!loading && tieneHorarios && (
                        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
                            <div className="flex gap-4 text-xs text-gray-500">
                                {Object.entries(TIPO_BADGE).map(([tipo, cls]) => (
                                    <span key={tipo} className={`px-2 py-0.5 rounded font-medium ${cls}`}>
                                        {tipo}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400">{horarios.length} sesiones en total</p>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
