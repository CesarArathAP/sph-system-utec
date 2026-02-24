import React, { useEffect, useState } from 'react';
import {
    GraduationCap, Building2, BookOpen, Users,
    Calendar, AlertTriangle, CheckCircle2, Clock,
    BarChart3, TrendingUp, BookCopy, Layers,
} from 'lucide-react';
import { API_CONFIG } from '../../services/config';

const BASE = API_CONFIG.BASE_URL;
const token = () => localStorage.getItem('auth_token') ?? '';

async function get(path: string, params = 'page=1&page_size=1') {
    try {
        const r = await fetch(`${BASE}${path}?${params}`, {
            headers: { Authorization: `Bearer ${token()}` },
        });
        if (!r.ok) return null;
        return r.json();
    } catch { return null; }
}

interface Stats {
    docentes: number;
    aulas: number;
    materias: number;
    grupos: number;
    asignaciones: number;
    horarios: number;
    conflictos: number;
}

// ── Mini KPI card ─────────────────────────────────────────────────
function KpiCard({
    label, value, Icon, colorClass, subtext,
}: {
    label: string; value: number | null; Icon: any;
    colorClass: string; subtext?: string;
}) {
    return (
        <div className={`
            bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 
            shadow-sm hover:shadow-lg transition-all duration-300 
            flex flex-col gap-3 sm:gap-4 group hover:border-gray-300
            hover:-translate-y-0.5
        `}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 truncate">{label}</span>
                <span className={`p-2.5 sm:p-3 rounded-xl shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
                    <Icon size={18} strokeWidth={2.5} className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
            </div>
            <div className="min-w-0">
                {value === null ? (
                    <div className="h-7 sm:h-9 w-12 sm:w-14 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />
                ) : (
                    <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</p>
                )}
                {subtext && <p className="text-xs text-gray-500 mt-1 sm:mt-2 line-clamp-2 font-medium">{subtext}</p>}
            </div>
        </div>
    );
}

// ── Filled bar ────────────────────────────────────────────────────
function Bar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2 text-xs text-gray-600 mb-2.5 sm:mb-3">
                <span className="truncate font-semibold">{label}</span>
                <span className="font-bold text-gray-800 whitespace-nowrap">{value} <span className="text-gray-500 font-normal">/ {max}</span></span>
            </div>
            <div className="w-full bg-gradient-to-r from-gray-100 to-gray-50 rounded-full h-2 sm:h-2.5 overflow-hidden border border-gray-200">
                <div
                    className={`h-2 sm:h-2.5 rounded-full ${colorClass} transition-all duration-700 shadow-sm`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
export default function HomeDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [aulaBreakdown, setAulaBreakdown] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    const user = (() => {
        try { return JSON.parse(localStorage.getItem('current_user') ?? 'null'); }
        catch { return null; }
    })();

    useEffect(() => {
        const load = async () => {
            const [doc, aulasData, mat, grp, asig, hor, conf] = await Promise.all([
                get('/docentes'),
                get('/aulas', 'page=1&page_size=100'),
                get('/materias'),
                get('/grupos'),
                get('/asignaciones'),
                get('/horarios'),
                get('/horarios/registered-conflicts/list', 'page=1&page_size=1&resuelto=false'),
            ]);

            setStats({
                docentes: doc?.total ?? 0,
                aulas: aulasData?.total ?? 0,
                materias: mat?.total ?? 0,
                grupos: grp?.total ?? 0,
                asignaciones: asig?.total ?? 0,
                horarios: hor?.total ?? 0,
                conflictos: conf?.total ?? 0,
            });

            // break down aulas by tipo
            if (aulasData?.aulas) {
                const breakdown: Record<string, number> = {};
                (aulasData.aulas as any[]).forEach((a) => {
                    const t: string = a.tipo ?? 'otro';
                    breakdown[t] = (breakdown[t] ?? 0) + 1;
                });
                setAulaBreakdown(breakdown);
            }

            setLoading(false);
        };
        load();
    }, []);

    const hora = new Date().getHours();
    const greeting = hora < 12 ? '¡Buenos días' : hora < 19 ? '¡Buenas tardes' : '¡Buenas noches';

    return (
        <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 bg-gradient-to-b from-gray-50 via-white to-gray-50 min-h-full">

            {/* ── Header ── */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-200 shrink-0">
                        <BarChart3 size={24} className="text-white sm:w-8 sm:h-8" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                            {user ? `${greeting}, ${user.nombre}!` : 'Bienvenido'}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 mt-1 font-medium">
                            📅 Panel de estadísticas y gestión del ciclo escolar
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs principales ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Recursos del Sistema</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <KpiCard label="Docentes" value={stats?.docentes ?? null} Icon={GraduationCap} colorClass="bg-blue-100 text-blue-600" subtext="activos en el sistema" />
                    <KpiCard label="Aulas" value={stats?.aulas ?? null} Icon={Building2} colorClass="bg-emerald-100 text-emerald-600" subtext="espacios disponibles" />
                    <KpiCard label="Materias" value={stats?.materias ?? null} Icon={BookOpen} colorClass="bg-violet-100 text-violet-600" subtext="en el catálogo" />
                    <KpiCard label="Grupos" value={stats?.grupos ?? null} Icon={Users} colorClass="bg-amber-100 text-amber-600" subtext="grupos registrados" />
                </div>
            </section>

            {/* ── Horarios KPIs ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Estado del Ciclo</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    <KpiCard label="Asignaciones" value={stats?.asignaciones ?? null} Icon={BookCopy} colorClass="bg-sky-100 text-sky-600" subtext="docente–grupo–materia" />
                    <KpiCard label="Horarios" value={stats?.horarios ?? null} Icon={Calendar} colorClass="bg-indigo-100 text-indigo-600" subtext="sesiones programadas" />
                    <div className={`
                        bg-white border-2 rounded-2xl p-4 sm:p-6 shadow-sm 
                        flex flex-col gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300
                        ${(stats?.conflictos ?? 0) > 0
                            ? 'border-red-200 hover:border-red-300'
                            : 'border-emerald-200 hover:border-emerald-300'
                        }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Conflictos</span>
                            <span className={`
                                p-2.5 sm:p-3 rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110
                                ${(stats?.conflictos ?? 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}
                            `}>
                                {(stats?.conflictos ?? 0) > 0
                                    ? <AlertTriangle size={20} strokeWidth={2.5} />
                                    : <CheckCircle2 size={20} strokeWidth={2.5} />}
                            </span>
                        </div>
                        <div>
                            {loading ? (
                                <div className="h-8 w-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />
                            ) : (
                                <p className={`text-4xl font-bold ${(stats?.conflictos ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {stats?.conflictos ?? 0}
                                </p>
                            )}
                            <p className={`text-xs mt-2 font-medium ${(stats?.conflictos ?? 0) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {(stats?.conflictos ?? 0) === 0 ? '✓ Sin conflictos detectados' : '⚠️ conflictos pendientes'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Desglose aulas + cobertura ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                {/* Tipos de aula */}
                <div className="
                    bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 
                    shadow-sm hover:shadow-lg transition-all duration-300
                    hover:border-gray-300 group
                ">
                    <div className="flex items-center gap-3 mb-5 sm:mb-7">
                        <span className="p-2.5 bg-violet-100 rounded-xl">
                            <Layers size={18} className="text-violet-600" strokeWidth={2.5} />
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Distribución de Aulas</h3>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-5">
                            {Object.entries(aulaBreakdown).map(([tipo, n]) => {
                                const colors: Record<string, string> = {
                                    normal: 'bg-gradient-to-r from-blue-500 to-blue-600',
                                    laboratorio: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
                                    computo: 'bg-gradient-to-r from-violet-500 to-violet-600',
                                    auditorio: 'bg-gradient-to-r from-amber-500 to-amber-600',
                                };
                                return (
                                    <Bar
                                        key={tipo}
                                        label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                        value={n}
                                        max={stats?.aulas ?? 1}
                                        colorClass={colors[tipo] ?? 'bg-gradient-to-r from-gray-400 to-gray-500'}
                                    />
                                );
                            })}
                            {Object.keys(aulaBreakdown).length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-6 font-medium">Sin datos disponibles</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Cobertura de asignaciones */}
                <div className="
                    bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 
                    shadow-sm hover:shadow-lg transition-all duration-300
                    hover:border-gray-300 group
                ">
                    <div className="flex items-center gap-3 mb-5 sm:mb-7">
                        <span className="p-2.5 bg-indigo-100 rounded-xl">
                            <Clock size={18} className="text-indigo-600" strokeWidth={2.5} />
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">Cobertura del Ciclo</h3>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-5 sm:space-y-6">
                            <Bar
                                label="Sesiones por asignación (promedio)"
                                value={stats && stats.asignaciones > 0
                                    ? Math.round(stats.horarios / stats.asignaciones * 10) / 10
                                    : 0}
                                max={5}
                                colorClass="bg-gradient-to-r from-indigo-500 to-indigo-600"
                            />
                            <Bar
                                label="Asignaciones con horario asignado"
                                value={Math.min(stats?.asignaciones ?? 0, stats?.horarios ?? 0)}
                                max={stats?.asignaciones ?? 1}
                                colorClass="bg-gradient-to-r from-sky-500 to-sky-600"
                            />
                            <Bar
                                label="Docentes con disponibilidad cargada"
                                value={stats?.docentes ?? 0}
                                max={stats?.docentes ?? 1}
                                colorClass="bg-gradient-to-r from-emerald-500 to-emerald-600"
                            />

                            {/* resumen texto */}
                            <div className="mt-4 pt-5 sm:pt-6 border-t border-gray-200 grid grid-cols-2 gap-3 text-center">
                                <div className="min-w-0 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                                    <p className="text-lg sm:text-xl font-bold text-blue-900 truncate">{stats?.horarios ?? '—'}</p>
                                    <p className="text-xs sm:text-sm text-blue-700 line-clamp-1 mt-0.5 font-medium">sesiones totales</p>
                                </div>
                                <div className="min-w-0 p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200/50">
                                    <p className="text-lg sm:text-xl font-bold text-indigo-900 truncate">
                                        {stats && stats.asignaciones > 0
                                            ? `${Math.round((stats.horarios / (stats.asignaciones * 2)) * 100)}%`
                                            : '—'}
                                    </p>
                                    <p className="text-xs sm:text-sm text-indigo-700 line-clamp-1 mt-0.5 font-medium">cobertura esperada</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
