import React, { useEffect, useState } from 'react';
import {
    GraduationCap, Building2, BookOpen, Users,
    Calendar, ArrowRight, TrendingUp,
} from 'lucide-react';
import { API_CONFIG } from '../../services/config';

async function fetchTotal(endpoint: string): Promise<number | null> {
    try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(
            `${API_CONFIG.BASE_URL}${endpoint}?page=1&page_size=1`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.total ?? null;
    } catch {
        return null;
    }
}

const CARDS = [
    { label: 'Docentes', endpoint: '/docentes', Icon: GraduationCap, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', href: '/auth/dashboard/profesores' },
    { label: 'Aulas', endpoint: '/aulas', Icon: Building2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', href: '/auth/dashboard/aulas' },
    { label: 'Materias', endpoint: '/materias', Icon: BookOpen, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', href: '/auth/dashboard/materias' },
    { label: 'Grupos', endpoint: '/grupos', Icon: Users, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', href: '/auth/dashboard/grupos' },
];

const QUICK_ACCESS = [
    { label: 'Ver Horarios', Icon: Calendar, href: '/auth/dashboard/horarios' },
    { label: 'Ver Profesores', Icon: GraduationCap, href: '/auth/dashboard/profesores' },
    { label: 'Ver Materias', Icon: BookOpen, href: '/auth/dashboard/materias' },
    { label: 'Ver Aulas', Icon: Building2, href: '/auth/dashboard/aulas' },
    { label: 'Ver Grupos', Icon: Users, href: '/auth/dashboard/grupos' },
];

export default function HomeDashboard() {
    const [totals, setTotals] = useState<Record<string, number | null>>({});
    const [loading, setLoading] = useState(true);

    const user = (() => {
        try { return JSON.parse(localStorage.getItem('current_user') ?? 'null'); }
        catch { return null; }
    })();

    useEffect(() => {
        Promise.all(
            CARDS.map((c) => fetchTotal(c.endpoint).then((v) => ({ [c.label]: v })))
        ).then((results) => {
            setTotals(Object.assign({}, ...results));
            setLoading(false);
        });
    }, []);

    return (
        <div className="p-8 max-w-6xl">

            {/* Bienvenida */}
            <div className="mb-8 flex items-center gap-3">
                <TrendingUp className="text-blue-600" size={28} />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {user ? `¡Hola, ${user.nombre}!` : 'Bienvenido'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Resumen general del sistema de gestión de horarios.
                    </p>
                </div>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {CARDS.map(({ label, Icon, color, bg, border, href }) => (
                    <a
                        key={label}
                        href={href}
                        className={`border ${border} ${bg} rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow group`}
                    >
                        <div className={`p-3 rounded-lg bg-white shadow-sm ${color}`}>
                            <Icon size={22} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                            {loading ? (
                                <div className="h-7 w-10 bg-gray-200 rounded animate-pulse mt-1" />
                            ) : (
                                <p className={`text-2xl font-bold ${color}`}>
                                    {totals[label] ?? '—'}
                                </p>
                            )}
                        </div>
                        <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                    </a>
                ))}
            </div>

            {/* Acceso rápido */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Accesos rápidos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {QUICK_ACCESS.map(({ label, Icon, href }) => (
                        <a
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-center group"
                        >
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Icon size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" strokeWidth={1.8} />
                            </div>
                            <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">{label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
