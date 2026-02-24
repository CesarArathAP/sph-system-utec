import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
    RefreshCw, Clock, CalendarDays, BookOpen, Users, MapPin,
    GraduationCap, Building2, Hash, CheckCircle, XCircle,
    Pencil, Trash2, Save, X, AlertTriangle, Info, Zap
} from 'lucide-react';
import { useToast } from '../../common/Toast';
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
        id?: number;
        nombre: string;
        codigo_aula: string;
        capacidad: number;
        tipo: string;
        edificio?: string;
        piso?: number;
    };
}

interface AulaOption { id: number; nombre: string; codigo_aula: string; capacidad: number; }

interface Props {
    horarioId: number | null;
    onClose: () => void;
    onSaved?: () => void;
}

/* ── Constantes visuales ─────────────────────────────────────────────── */
const DIA_LABEL: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};

const TIPO_CONFIG: Record<string, { label: string; bg: string; text: string; shadow: string }> = {
    teorica: { label: 'Teórica', bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-400', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' },
    practica: { label: 'Práctica', bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
    laboratorio: { label: 'Laboratorio', bg: 'bg-violet-500/20 border-violet-500/30', text: 'text-violet-400', shadow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]' },
};

const TURNO_LABEL: Record<string, string> = {
    matutino: 'Matutino', vespertino: 'Vespertino', nocturno: 'Nocturno',
};

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const TIPOS = ['teorica', 'practica', 'laboratorio'];

const HOUR_OPTIONS: string[] = [];
for (let h = 7; h <= 22; h++) HOUR_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);

function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = API_CONFIG.BASE_URL;

/* ── Componente de Fila de Información ───────────────────────────────── */
function InfoRow({ icon: Icon, label, value, highlight = false }: {
    icon: React.ElementType; label: string; value: React.ReactNode; highlight?: boolean;
}) {
    return (
        <div className="flex items-start gap-4 group transition-all p-3 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02]">
            <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform ${highlight ? 'text-blue-400 border-blue-400/20' : 'text-white/40'}`}>
                <Icon size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className={`font-bold leading-tight ${highlight ? 'text-blue-200' : 'text-white/80'} truncate`}>{value}</p>
            </div>
        </div>
    );
}

export default function HorarioDetailModal({ horarioId, onClose, onSaved }: Props) {
    const { addToast } = useToast();
    const [horario, setHorario] = useState<HorarioDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        dia_semana: '',
        hora_inicio: '',
        hora_fin: '',
        aula_id: 0,
        tipo_sesion: '',
    });
    const [aulas, setAulas] = useState<AulaOption[]>([]);
    const [saving, setSaving] = useState(false);

    const isOpen = horarioId !== null;

    useEffect(() => {
        if (!isOpen || horarioId === null) { setHorario(null); setEditing(false); return; }

        const load = async () => {
            setLoading(true); setError(null);
            try {
                const [resH, resA] = await Promise.all([
                    fetch(`${BASE}/horarios/${horarioId}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
                    fetch(`${BASE}/aulas?page=1&page_size=100&activo=true`, { headers: { Authorization: `Bearer ${getToken()}` } }),
                ]);
                if (!resH.ok) throw new Error(`Error HTTP: ${resH.status}`);
                const h: HorarioDetail = await resH.json();
                setHorario(h);
                setEditForm({
                    dia_semana: h.dia_semana,
                    hora_inicio: h.hora_inicio.slice(0, 5),
                    hora_fin: h.hora_fin.slice(0, 5),
                    aula_id: (h.aula as any)?.id ?? 0,
                    tipo_sesion: h.tipo_sesion,
                });
                if (resA.ok) {
                    const ad = await resA.json();
                    setAulas(ad.aulas ?? []);
                }
            } catch (e: any) {
                setError(e.message ?? 'Error al conectar con el servidor');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [horarioId]);

    const handleSave = async () => {
        if (editForm.hora_fin <= editForm.hora_inicio) {
            addToast({ 
              type: 'error', 
              title: 'Rango Inválido', 
              message: 'La hora de fin debe ser mayor que la de inicio.',
              duration: 3000
            });
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${BASE}/horarios/${horarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({
                    dia_semana: editForm.dia_semana,
                    hora_inicio: `${editForm.hora_inicio}:00`,
                    hora_fin: `${editForm.hora_fin}:00`,
                    aula_id: editForm.aula_id || undefined,
                    tipo_sesion: editForm.tipo_sesion,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail?.mensaje ?? 'Error al actualizar');
            }
            const updated = await res.json();
            setHorario(updated);
            setEditing(false);
            onSaved?.();
            addToast({
                type: 'success', 
                title: 'Actualizado', 
                message: 'El horario se guardó correctamente.',
                duration: 3000
            });
        } catch (e: any) {
            addToast({ 
              type: 'error', 
              title: 'Error', 
              message: e.message,
              duration: 4000
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = confirm('¿Está seguro que desea eliminar esta sesión permanentemente?');
        if (result) {
            try {
                const res = await fetch(`${BASE}/horarios/${horarioId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                if (!res.ok) throw new Error('No se pudo eliminar el registro.');
                onSaved?.();
                onClose();
                addToast({ 
                  type: 'success', 
                  title: 'Eliminado', 
                  message: 'La sesión fue eliminada correctamente.',
                  duration: 3000
                });
            } catch (e: any) {
                addToast({ 
                  type: 'error', 
                  title: 'Error', 
                  message: e.message,
                  duration: 4000
                });
            }
        }
    };

    const tipo = horario ? (TIPO_CONFIG[horario.tipo_sesion] ?? { label: horario.tipo_sesion, bg: 'bg-white/10', text: 'text-white/60', shadow: '' }) : null;
    const docenteNombre = horario?.asignacion?.docente?.user
        ? `${horario.asignacion.docente.user.nombre} ${horario.asignacion.docente.user.apellido}`
        : horario?.asignacion?.docente?.codigo_docente ?? '—';

    const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/20';
    const labelCls = 'block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 ms-1';

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xl z-40 transition-opacity" />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                      bg-[#0a1532] rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-xl max-h-[90vh]
                      overflow-y-auto custom-scrollbar focus:outline-none animate-in fade-in zoom-in-95 duration-300"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6">
                            <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20 animate-pulse">
                               <RefreshCw size={32} className="animate-spin text-blue-500" />
                            </div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Cargando Expediente...</p>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="p-5 bg-red-500/10 rounded-3xl mb-6">
                               <XCircle size={48} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Error de Enlace</h3>
                            <p className="text-red-400/80 font-bold mb-8">{error}</p>
                            <button onClick={onClose}
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all border border-white/10">
                                Abortar y Cerrar
                            </button>
                        </div>
                    ) : horario && (
                        <>
                            {/* Header */}
                            <div className={`p-8 border-b border-white/5 relative overflow-hidden ${tipo?.bg}`}>
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-xl ${tipo?.bg} ${tipo?.shadow}`}>
                                           <Zap size={24} fill="currentColor" className={tipo?.text} />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2">
                                                {horario.asignacion?.materia?.nombre ?? 'Horario'}
                                            </Dialog.Title>
                                            <div className="flex items-center gap-3">
                                               <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${tipo?.bg} ${tipo?.text}`}>
                                                  {tipo?.label}
                                               </span>
                                               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                  ID #{horario.id}
                                               </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2.5 bg-black/20 hover:bg-black/40 rounded-xl text-white/40 hover:text-white transition-all active:scale-90 border border-white/5">
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Banner Tiempo */}
                                <div className="mt-8 flex items-center gap-3">
                                    <div className="flex-1 flex items-center gap-3 bg-black/30 backdrop-blur-md rounded-[1.25rem] px-5 py-4 border border-white/10 shadow-xl overflow-hidden group">
                                        <CalendarDays size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                        <div className="min-w-0">
                                           <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-0.5">Día Semanal</p>
                                           <p className="font-black text-white text-base capitalize">{DIA_LABEL[horario.dia_semana] || horario.dia_semana}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-center gap-3 bg-black/30 backdrop-blur-md rounded-[1.25rem] px-5 py-4 border border-white/10 shadow-xl overflow-hidden group">
                                        <Clock size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                        <div className="min-w-0">
                                           <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-0.5">Franja Horaria</p>
                                           <p className="font-black text-white text-base font-mono">{horario.hora_inicio.slice(0,5)} — {horario.hora_fin.slice(0,5)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-8 bg-black/20">
                                {editing ? (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                        <div className="flex items-center gap-3 mb-4">
                                           <Info size={16} className="text-blue-400" />
                                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Modificando Parámetros</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelCls}>Día</label>
                                                <select value={editForm.dia_semana}
                                                    onChange={(e) => setEditForm(p => ({ ...p, dia_semana: e.target.value }))}
                                                    className={inputCls}>
                                                    {DIAS.map(d => <option key={d} value={d} className="bg-[#0f172a]">{DIA_LABEL[d]}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Tipo</label>
                                                <select value={editForm.tipo_sesion}
                                                    onChange={(e) => setEditForm(p => ({ ...p, tipo_sesion: e.target.value }))}
                                                    className={inputCls}>
                                                    {TIPOS.map(t => <option key={t} value={t} className="bg-[#0f172a]">{TIPO_CONFIG[t]?.label ?? t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Inicio</label>
                                                <select value={editForm.hora_inicio}
                                                    onChange={(e) => setEditForm(p => ({ ...p, hora_inicio: e.target.value }))}
                                                    className={inputCls}>
                                                    {HOUR_OPTIONS.slice(0, -1).map(h => <option key={h} value={h} className="bg-[#0f172a]">{h}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Fin</label>
                                                <select value={editForm.hora_fin}
                                                    onChange={(e) => setEditForm(p => ({ ...p, hora_fin: e.target.value }))}
                                                    className={inputCls}>
                                                    {HOUR_OPTIONS.slice(1).map(h => <option key={h} value={h} className="bg-[#0f172a]">{h}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Aula Asignada</label>
                                            <select value={editForm.aula_id}
                                                onChange={(e) => setEditForm(p => ({ ...p, aula_id: parseInt(e.target.value) || 0 }))}
                                                className={inputCls}>
                                                <option value={0} className="bg-[#0f172a]">Seleccionar Aula...</option>
                                                {aulas.map(a => <option key={a.id} value={a.id} className="bg-[#0f172a]">{a.codigo_aula} ({a.capacidad} pers.)</option>)}
                                            </select>
                                            
                                            {editForm.aula_id > 0 && horario?.asignacion?.grupo?.num_estudiantes && (() => {
                                                const aula = aulas.find(a => a.id === editForm.aula_id);
                                                if (aula && (horario.asignacion?.grupo?.num_estudiantes ?? 0) > aula.capacidad) {
                                                    return (
                                                        <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 animate-in fade-in zoom-in-95">
                                                            <AlertTriangle size={18} className="text-red-400 shrink-0" />
                                                            <div className="text-xs text-red-200">
                                                                <p className="font-black uppercase tracking-widest mb-1">Capacidad Crítica</p>
                                                                <p>El grupo tiene <strong>{horario.asignacion?.grupo?.num_estudiantes}</strong> alumnos, el aula solo <strong>{aula.capacidad}</strong>.</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button onClick={() => setEditing(false)} disabled={saving}
                                                className="flex-1 px-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs border border-white/10 transition-all active:scale-95 disabled:opacity-30">
                                                Cisnes/Cancelar
                                            </button>
                                            <button onClick={handleSave} disabled={saving}
                                                className="flex-1 flex items-center justify-center gap-3 px-4 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-blue-500/20">
                                                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} fill="currentColor" />}
                                                Confirmar Cambios
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        {/* Grid de Secciones */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4">
                                            {/* Fila 1: Materia y Código */}
                                            <InfoRow icon={BookOpen} label="Unidad Académica" value={horario.asignacion?.materia?.nombre} highlight />
                                            <InfoRow icon={Hash} label="Código" value={horario.asignacion?.materia?.codigo_materia} />
                                            
                                            {/* Fila 2: Créditos y Horas */}
                                            <InfoRow icon={Zap} label="Créditos" value={`${horario.asignacion?.materia?.creditos ?? '—'}`} />
                                            <InfoRow icon={Clock} label="Horas Semanales" value={`${horario.asignacion?.materia?.horas_semana ?? '—'} h`} />
                                            
                                            {/* Fila 3: Grupo y Carrera */}
                                            <InfoRow icon={Users} label="Grupo" value={`${horario.asignacion?.grupo?.codigo_grupo ?? '—'} (${horario.asignacion?.grupo?.num_estudiantes ?? 0} est.)`} highlight />
                                            <InfoRow icon={CheckCircle} label="Carrera" value={horario.asignacion?.grupo?.carrera ?? '—'} />
                                            
                                            {/* Fila 4: Semestre y Turno */}
                                            <InfoRow icon={Info} label="Semestre" value={`${horario.asignacion?.grupo?.semestre ?? '—'}°`} />
                                            <InfoRow icon={Clock} label="Turno" value={(() => {
                                              const turnoMap: Record<string, string> = { matutino: 'Matutino', vespertino: 'Vespertino', nocturno: 'Nocturno' };
                                              return turnoMap[horario.asignacion?.grupo?.turno ?? ''] ?? horario.asignacion?.grupo?.turno ?? '—';
                                            })() } />
                                            
                                            {/* Fila 5: Docente */}
                                            <InfoRow icon={GraduationCap} label="Docente" value={docenteNombre} />
                                            <InfoRow icon={Building2} label="Departamento" value={horario.asignacion?.docente?.departamento ?? '—'} />
                                            
                                            {/* Fila 6: Aula y Capacidad */}
                                            <InfoRow icon={MapPin} label="Aula" value={horario.aula?.nombre || 'Pendiente'} highlight />
                                            <InfoRow icon={Hash} label="Capacidad" value={(() => {
                                              const cap = horario.aula?.capacidad ?? 0;
                                              const est = horario.asignacion?.grupo?.num_estudiantes ?? 0;
                                              const status = est > cap ? '❌ Insuficiente' : '✅ Ok';
                                              return `${cap} / ${est} ${status}`;
                                            })() } />
                                            
                                            {/* Fila 7: Tipo de Sesión y Ciclo */}
                                            <InfoRow icon={Zap} label="Tipo Sesión" value={TIPO_CONFIG[horario.tipo_sesion]?.label ?? horario.tipo_sesion} />
                                            <InfoRow icon={CalendarDays} label="Ciclo Escolar" value={horario.asignacion?.ciclo_escolar ?? '—'} />
                                            
                                            {/* Fila 8: Día y Hora */}
                                            <InfoRow icon={CalendarDays} label="Día" value={DIA_LABEL[horario.dia_semana] ?? horario.dia_semana} />
                                            <InfoRow icon={Clock} label="Horario" value={`${horario.hora_inicio.slice(0, 5)} — ${horario.hora_fin.slice(0, 5)}`} />
                                            
                                            {/* Fila 9: Estado */}
                                            <InfoRow icon={horario.activo ? CheckCircle : XCircle} label="Estado" value={horario.activo ? '✅ Activo' : '❌ Inactivo'} />
                                        </div>

                                        {/* Footer Acción */}
                                        <div className="pt-8 flex flex-wrap gap-4 border-t border-white/5 items-center justify-between">
                                            <div className="flex gap-3">
                                                <button onClick={() => setEditing(true)}
                                                    className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-2xl transition-all active:scale-90"
                                                    title="Editar registro">
                                                    <Pencil size={18} strokeWidth={2.5} />
                                                </button>
                                                <button onClick={handleDelete}
                                                    className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-2xl transition-all active:scale-90"
                                                    title="Eliminar registro">
                                                    <Trash2 size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                            <button onClick={onClose}
                                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 transition-all active:scale-95">
                                                Cerrar Expediente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
