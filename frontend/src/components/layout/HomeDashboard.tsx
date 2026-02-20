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
        <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
                <span className={`p-2 rounded-xl ${colorClass}`}>
                    <Icon size={16} strokeWidth={2} />
                </span>
            </div>
            <div>
                {value === null ? (
                    <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
                ) : (
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                )}
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}

// ── Filled bar ────────────────────────────────────────────────────
function Bar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{label}</span>
                <span className="font-medium text-gray-700">{value} <span className="text-gray-400">/ {max}</span></span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${colorClass} transition-all duration-700`}
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
        <div className="p-6 md:p-8 max-w-6xl space-y-8">

            {/* ── Header ── */}
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-md shadow-blue-200">
                    <BarChart3 size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {user ? `${greeting}, ${user.nombre}!` : 'Bienvenido'}
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Ciclo escolar activo · Panel de estadísticas
                    </p>
                </div>
            </div>

            {/* ── KPIs principales ── */}
            <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Recursos del sistema</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <KpiCard label="Docentes" value={stats?.docentes ?? null} Icon={GraduationCap} colorClass="bg-blue-50 text-blue-600" subtext="activos en el sistema" />
                    <KpiCard label="Aulas" value={stats?.aulas ?? null} Icon={Building2} colorClass="bg-emerald-50 text-emerald-600" subtext="espacios disponibles" />
                    <KpiCard label="Materias" value={stats?.materias ?? null} Icon={BookOpen} colorClass="bg-violet-50 text-violet-600" subtext="en el catálogo" />
                    <KpiCard label="Grupos" value={stats?.grupos ?? null} Icon={Users} colorClass="bg-amber-50 text-amber-600" subtext="grupos registrados" />
                </div>
            </section>

            {/* ── Horarios KPIs ── */}
            <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Estado del ciclo</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <KpiCard label="Asignaciones" value={stats?.asignaciones ?? null} Icon={BookCopy} colorClass="bg-sky-50 text-sky-600" subtext="docente–grupo–materia" />
                    <KpiCard label="Horarios" value={stats?.horarios ?? null} Icon={Calendar} colorClass="bg-indigo-50 text-indigo-600" subtext="sesiones programadas" />
                    <div className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-3 ${(stats?.conflictos ?? 0) > 0
                        ? 'border-red-200'
                        : 'border-gray-100'
                        }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Conflictos</span>
                            <span className={`p-2 rounded-xl ${(stats?.conflictos ?? 0) > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                {(stats?.conflictos ?? 0) > 0
                                    ? <AlertTriangle size={16} strokeWidth={2} />
                                    : <CheckCircle2 size={16} strokeWidth={2} />}
                            </span>
                        </div>
                        <div>
                            {loading ? (
                                <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
                            ) : (
                                <p className={`text-3xl font-bold ${(stats?.conflictos ?? 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                    {stats?.conflictos ?? 0}
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                {(stats?.conflictos ?? 0) === 0 ? 'Sin conflictos detectados ✓' : 'conflictos pendientes'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Desglose aulas + cobertura ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Tipos de aula */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <Layers size={16} className="text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-700">Distribución de aulas</h3>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(aulaBreakdown).map(([tipo, n]) => {
                                const colors: Record<string, string> = {
                                    normal: 'bg-blue-500',
                                    laboratorio: 'bg-emerald-500',
                                    computo: 'bg-violet-500',
                                    auditorio: 'bg-amber-500',
                                };
                                return (
                                    <Bar
                                        key={tipo}
                                        label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                        value={n}
                                        max={stats?.aulas ?? 1}
                                        colorClass={colors[tipo] ?? 'bg-gray-400'}
                                    />
                                );
                            })}
                            {Object.keys(aulaBreakdown).length === 0 && (
                                <p className="text-sm text-gray-400">Sin datos aún</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Cobertura de asignaciones */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <Clock size={16} className="text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-700">Cobertura del ciclo</h3>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <Bar
                                label="Sesiones por asignación (promedio)"
                                value={stats && stats.asignaciones > 0
                                    ? Math.round(stats.horarios / stats.asignaciones * 10) / 10
                                    : 0}
                                max={5}
                                colorClass="bg-indigo-500"
                            />
                            <Bar
                                label="Asignaciones con horario asignado"
                                value={Math.min(stats?.asignaciones ?? 0, stats?.horarios ?? 0)}
                                max={stats?.asignaciones ?? 1}
                                colorClass="bg-sky-500"
                            />
                            <Bar
                                label="Docentes con disponibilidad cargada"
                                value={stats?.docentes ?? 0}
                                max={stats?.docentes ?? 1}
                                colorClass="bg-emerald-500"
                            />

                            {/* resumen texto */}
                            <div className="mt-2 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
                                <div>
                                    <p className="text-lg font-bold text-gray-800">{stats?.horarios ?? '—'}</p>
                                    <p className="text-xs text-gray-400">sesiones totales</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-800">
                                        {stats && stats.asignaciones > 0
                                            ? `${Math.round((stats.horarios / (stats.asignaciones * 2)) * 100)}%`
                                            : '—'}
                                    </p>
                                    <p className="text-xs text-gray-400">cobertura 2 ses./semana</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
