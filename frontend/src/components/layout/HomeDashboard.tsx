import React, { useEffect, useState } from 'react';
import {
    GraduationCap, Building2, BookOpen, Users,
    Calendar, AlertTriangle, CheckCircle2, Clock,
    BarChart3, BookCopy, Layers,
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

// ── KPI Card — Dark Glassmorphism ──────────────────────────────────
function KpiCard({
    label, value, Icon, iconBg, iconColor, subtext,
}: {
    label: string; value: number | null; Icon: any;
    iconBg: string; iconColor: string; subtext?: string;
}) {
    return (
        <div className="
            bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6
            shadow-2xl hover:border-white/20 transition-all duration-300
            flex flex-col gap-3 group hover:-translate-y-1
        ">
            <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 truncate">{label}</span>
                <span className={`p-2.5 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
                    <Icon size={18} strokeWidth={2.5} className={`w-5 h-5 ${iconColor}`} />
                </span>
            </div>
            <div className="min-w-0">
                {value === null ? (
                    <div className="h-9 w-14 bg-white/10 rounded-lg animate-pulse" />
                ) : (
                    <p className="text-4xl font-black text-white tracking-tight">{value}</p>
                )}
                {subtext && <p className="text-xs text-white/35 mt-1.5 font-medium">{subtext}</p>}
            </div>
        </div>
    );
}

// ── Bar — Dark style ───────────────────────────────────────────────
function Bar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs text-white/50 mb-2">
                <span className="truncate font-semibold text-white/70">{label}</span>
                <span className="font-black text-white whitespace-nowrap">
                    {value} <span className="text-white/30 font-normal">/ {max}</span>
                </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                    className={`h-2 rounded-full ${colorClass} transition-all duration-700 shadow-sm`}
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
    const hayConflictos = (stats?.conflictos ?? 0) > 0;

    return (
        <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 bg-[#081028] min-h-full">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="p-3 sm:p-4 bg-[linear-gradient(145deg,#1e56d9,#0d3ab0)] rounded-2xl shadow-[0_4px_24px_rgba(15,63,196,0.45)] shrink-0">
                    <BarChart3 size={24} className="text-white sm:w-8 sm:h-8" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                        {user ? `${greeting}, ${user.nombre}!` : 'Bienvenido'}
                    </h1>
                    <p className="text-sm sm:text-base text-white/40 mt-1 font-medium">
                        Panel de estadísticas y gestión del ciclo escolar
                    </p>
                </div>
            </div>

            {/* ── KPIs principales ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-400/0 rounded-full" />
                    <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Recursos del Sistema</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <KpiCard
                        label="Docentes" value={stats?.docentes ?? null} Icon={GraduationCap}
                        iconBg="bg-blue-500/20" iconColor="text-blue-400"
                        subtext="activos en el sistema"
                    />
                    <KpiCard
                        label="Aulas" value={stats?.aulas ?? null} Icon={Building2}
                        iconBg="bg-emerald-500/20" iconColor="text-emerald-400"
                        subtext="espacios disponibles"
                    />
                    <KpiCard
                        label="Materias" value={stats?.materias ?? null} Icon={BookOpen}
                        iconBg="bg-violet-500/20" iconColor="text-violet-400"
                        subtext="en el catálogo"
                    />
                    <KpiCard
                        label="Grupos" value={stats?.grupos ?? null} Icon={Users}
                        iconBg="bg-amber-500/20" iconColor="text-amber-400"
                        subtext="grupos registrados"
                    />
                </div>
            </section>

            {/* ── Horarios KPIs ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-indigo-400/0 rounded-full" />
                    <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Estado del Ciclo</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    <KpiCard
                        label="Asignaciones" value={stats?.asignaciones ?? null} Icon={BookCopy}
                        iconBg="bg-sky-500/20" iconColor="text-sky-400"
                        subtext="docente–grupo–materia"
                    />
                    <KpiCard
                        label="Horarios" value={stats?.horarios ?? null} Icon={Calendar}
                        iconBg="bg-indigo-500/20" iconColor="text-indigo-400"
                        subtext="sesiones programadas"
                    />

                    {/* Conflictos */}
                    <div className={`
                        bg-white/[0.04] backdrop-blur-xl border rounded-2xl p-5 sm:p-6 shadow-2xl
                        flex flex-col gap-4 group hover:-translate-y-1 transition-all duration-300
                        ${hayConflictos ? 'border-red-500/20 hover:border-red-500/30' : 'border-emerald-500/20 hover:border-emerald-500/30'}
                    `}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Conflictos</span>
                            <span className={`
                                p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110
                                ${hayConflictos ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}
                            `}>
                                {hayConflictos
                                    ? <AlertTriangle size={20} strokeWidth={2.5} />
                                    : <CheckCircle2 size={20} strokeWidth={2.5} />}
                            </span>
                        </div>
                        <div>
                            {loading ? (
                                <div className="h-9 w-12 bg-white/10 rounded-lg animate-pulse" />
                            ) : (
                                <p className={`text-4xl font-black ${hayConflictos ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {stats?.conflictos ?? 0}
                                </p>
                            )}
                            <p className={`text-xs mt-2 font-medium ${hayConflictos ? 'text-red-400/60' : 'text-emerald-400/60'}`}>
                                {(stats?.conflictos ?? 0) === 0 ? '✓ Sin conflictos detectados' : '⚠ conflictos pendientes'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Desglose aulas + cobertura ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                {/* Tipos de aula */}
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-5 sm:mb-7">
                        <span className="p-2.5 bg-violet-500/20 rounded-xl">
                            <Layers size={18} className="text-violet-400" strokeWidth={2.5} />
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white">Distribución de Aulas</h3>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-3 bg-white/10 rounded-lg animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-5">
                            {Object.entries(aulaBreakdown).map(([tipo, n]) => {
                                const colors: Record<string, string> = {
                                    normal:      'bg-gradient-to-r from-blue-500 to-blue-600',
                                    laboratorio: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
                                    computo:     'bg-gradient-to-r from-violet-500 to-violet-600',
                                    auditorio:   'bg-gradient-to-r from-amber-500 to-amber-600',
                                };
                                return (
                                    <Bar
                                        key={tipo}
                                        label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                        value={n}
                                        max={stats?.aulas ?? 1}
                                        colorClass={colors[tipo] ?? 'bg-gradient-to-r from-white/30 to-white/20'}
                                    />
                                );
                            })}
                            {Object.keys(aulaBreakdown).length === 0 && (
                                <p className="text-sm text-white/25 text-center py-6 font-medium">Sin datos disponibles</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Cobertura de asignaciones */}
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-5 sm:mb-7">
                        <span className="p-2.5 bg-indigo-500/20 rounded-xl">
                            <Clock size={18} className="text-indigo-400" strokeWidth={2.5} />
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white">Cobertura del Ciclo</h3>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-3 bg-white/10 rounded-lg animate-pulse" />)}
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

                            {/* Resumen numérico */}
                            <div className="mt-4 pt-5 sm:pt-6 border-t border-white/5 grid grid-cols-2 gap-3 text-center">
                                <div className="min-w-0 p-3 bg-blue-500/10 rounded-xl border border-blue-500/15">
                                    <p className="text-lg sm:text-xl font-black text-blue-300 truncate">{stats?.horarios ?? '—'}</p>
                                    <p className="text-xs text-blue-400/50 line-clamp-1 mt-0.5 font-medium">sesiones totales</p>
                                </div>
                                <div className="min-w-0 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/15">
                                    <p className="text-lg sm:text-xl font-black text-indigo-300 truncate">
                                        {stats && stats.asignaciones > 0
                                            ? `${Math.round((stats.horarios / (stats.asignaciones * 2)) * 100)}%`
                                            : '—'}
                                    </p>
                                    <p className="text-xs text-indigo-400/50 line-clamp-1 mt-0.5 font-medium">cobertura esperada</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
