import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
    RefreshCw, Clock, CalendarDays, BookOpen, Users, MapPin,
    GraduationCap, Building2, Hash, CheckCircle, XCircle,
} from 'lucide-react';
import { API_CONFIG } from '../../../services/config';

/* ── Tipos ──────────────────────────────────────────────────────────── */
interface HorarioDetail {
    id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    tipo_sesion: string;
    activo: boolean;
    created_at: string;
    updated_at: string;
    asignacion?: {
        id: number;
        ciclo_escolar: string;
        materia?: { nombre: string; codigo_materia: string; creditos: number; horas_semana: number };
        grupo?: { nombre: string; codigo_grupo: string; carrera: string; semestre: number; turno: string; num_estudiantes: number };
        docente?: {
            codigo_docente: string;
            departamento?: string;
            user?: { nombre: string; apellido: string; email: string };
        };
    };
    aula?: {
        nombre: string;
        codigo_aula: string;
        capacidad: number;
        tipo: string;
        edificio?: string;
        piso?: number;
    };
}

interface Props {
    horarioId: number | null;
    onClose: () => void;
}

/* ── Constantes visuales ─────────────────────────────────────────────── */
const DIA_LABEL: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};

const TIPO_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
    teorica: { label: 'Teórica', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    practica: { label: 'Práctica', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
    laboratorio: { label: 'Laboratorio', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
};

const TURNO_LABEL: Record<string, string> = {
    matutino: 'Matutino', vespertino: 'Vespertino', nocturno: 'Nocturno',
};

function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = API_CONFIG.BASE_URL;

/* ── Helpers ─────────────────────────────────────────────────────────── */
function fmt(t: string) { return t?.slice(0, 5) ?? '—'; }

function InfoRow({ icon: Icon, label, value, small = false }: {
    icon: React.ElementType; label: string; value: React.ReactNode; small?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-gray-500" />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className={`font-semibold text-gray-800 ${small ? 'text-sm' : 'text-base'}`}>{value}</p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function HorarioDetailModal({ horarioId, onClose }: Props) {
    const [horario, setHorario] = useState<HorarioDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isOpen = horarioId !== null;

    useEffect(() => {
        if (!isOpen || horarioId === null) { setHorario(null); return; }

        const load = async () => {
            setLoading(true); setError(null); setHorario(null);
            try {
                const res = await fetch(`${BASE}/horarios/${horarioId}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                if (!res.ok) throw new Error(`Error ${res.status}`);
                setHorario(await res.json());
            } catch (e: any) {
                setError(e.message ?? 'Error al cargar el horario');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [horarioId]);

    const tipo = horario ? (TIPO_CONFIG[horario.tipo_sesion] ?? { label: horario.tipo_sesion, bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' }) : null;
    const docente = horario?.asignacion?.docente;
    const docenteNombre = docente?.user
        ? `${docente.user.nombre} ${docente.user.apellido}`
        : docente?.codigo_docente ?? '—';

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh]
                     overflow-y-auto focus:outline-none"
                    onEscapeKeyDown={onClose}
                >
                    {/* ── Loading ── */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <RefreshCw size={26} className="animate-spin text-blue-500" />
                            <p className="text-sm text-gray-400">Cargando horario…</p>
                        </div>
                    )}

                    {/* ── Error ── */}
                    {error && !loading && (
                        <div className="p-8 text-center">
                            <XCircle size={32} className="text-red-400 mx-auto mb-3" />
                            <p className="text-red-600 font-semibold">{error}</p>
                            <button onClick={onClose}
                                className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition">
                                Cerrar
                            </button>
                        </div>
                    )}

                    {/* ── Content ── */}
                    {horario && !loading && (
                        <>
                            {/* Header con color por tipo */}
                            <div className={`rounded-t-2xl border-b px-6 py-5 ${tipo?.bg ?? 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${tipo?.dot}`} />
                                        <div>
                                            <Dialog.Title className="text-xl font-bold text-gray-900">
                                                {horario.asignacion?.materia?.nombre ?? 'Horario'}
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {horario.asignacion?.materia?.codigo_materia} ·{' '}
                                                <span className="font-medium">{tipo?.label}</span> ·{' '}
                                                Ciclo {horario.asignacion?.ciclo_escolar ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Estado activo */}
                                        {horario.activo
                                            ? <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                <CheckCircle size={11} /> Activo
                                            </span>
                                            : <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                <XCircle size={11} /> Inactivo
                                            </span>
                                        }
                                        <Dialog.Close onClick={onClose}
                                            className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-1 transition">×</Dialog.Close>
                                    </div>
                                </div>

                                {/* Franja horaria grande */}
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white/70 rounded-xl px-4 py-2.5 border border-white/80 shadow-sm">
                                        <CalendarDays size={16} className="text-gray-600" />
                                        <span className="font-bold text-gray-800 text-lg capitalize">
                                            {DIA_LABEL[horario.dia_semana] ?? horario.dia_semana}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/70 rounded-xl px-4 py-2.5 border border-white/80 shadow-sm">
                                        <Clock size={16} className="text-gray-600" />
                                        <span className="font-bold text-gray-800 text-lg font-mono">
                                            {fmt(horario.hora_inicio)} – {fmt(horario.hora_fin)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Cuerpo con secciones */}
                            <div className="p-6 space-y-6">

                                {/* Sección: Materia */}
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Materia</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow icon={BookOpen} label="Nombre"
                                            value={horario.asignacion?.materia?.nombre ?? '—'} small />
                                        <InfoRow icon={Hash} label="Código"
                                            value={horario.asignacion?.materia?.codigo_materia ?? '—'} small />
                                        <InfoRow icon={Clock} label="Horas / semana"
                                            value={`${horario.asignacion?.materia?.horas_semana ?? '—'} h`} small />
                                        <InfoRow icon={Hash} label="Créditos"
                                            value={horario.asignacion?.materia?.creditos ?? '—'} small />
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Sección: Grupo */}
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Grupo</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow icon={Users} label="Nombre"
                                            value={horario.asignacion?.grupo?.nombre ?? '—'} small />
                                        <InfoRow icon={Hash} label="Código"
                                            value={horario.asignacion?.grupo?.codigo_grupo ?? '—'} small />
                                        <InfoRow icon={BookOpen} label="Carrera"
                                            value={horario.asignacion?.grupo?.carrera ?? '—'} small />
                                        <InfoRow icon={Hash} label="Semestre · Turno"
                                            value={`S${horario.asignacion?.grupo?.semestre ?? '—'} · ${TURNO_LABEL[horario.asignacion?.grupo?.turno ?? ''] ?? horario.asignacion?.grupo?.turno ?? '—'}`}
                                            small />
                                        <InfoRow icon={Users} label="Estudiantes"
                                            value={`${horario.asignacion?.grupo?.num_estudiantes ?? '—'} alumnos`} small />
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Sección: Docente */}
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Docente</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow icon={GraduationCap} label="Nombre" value={docenteNombre} small />
                                        <InfoRow icon={Hash} label="Código"
                                            value={docente?.codigo_docente ?? '—'} small />
                                        {docente?.user?.email && (
                                            <InfoRow icon={Hash} label="Email" value={docente.user.email} small />
                                        )}
                                        {docente?.departamento && (
                                            <InfoRow icon={BookOpen} label="Departamento" value={docente.departamento} small />
                                        )}
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Sección: Aula */}
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Aula</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow icon={Building2} label="Nombre"
                                            value={horario.aula?.nombre ?? '—'} small />
                                        <InfoRow icon={Hash} label="Código"
                                            value={horario.aula?.codigo_aula ?? '—'} small />
                                        <InfoRow icon={MapPin} label="Ubicación"
                                            value={[horario.aula?.edificio && `Edif. ${horario.aula.edificio}`, horario.aula?.piso && `Piso ${horario.aula.piso}`].filter(Boolean).join(' · ') || '—'}
                                            small />
                                        <InfoRow icon={Users} label="Capacidad"
                                            value={`${horario.aula?.capacidad ?? '—'} personas`} small />
                                    </div>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center border-t border-gray-100 px-6 py-3 bg-gray-50 rounded-b-2xl">
                                <p className="text-xs text-gray-400">ID #{horario.id}</p>
                                <button onClick={onClose}
                                    className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-semibold transition">
                                    Cerrar
                                </button>
                            </div>
                        </>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
