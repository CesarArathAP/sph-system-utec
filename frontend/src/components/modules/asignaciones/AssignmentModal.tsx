import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  RefreshCw, ClipboardList, Wand2, AlertTriangle, CheckCircle2,
  Clock, BarChart2, CalendarDays, X,
} from 'lucide-react';
import { API_CONFIG } from '../../../services/config';
import DisponibilidadViewModal from '../profesores/DisponibilidadViewModal';
import type { Docente } from '../profesores/ProfesoresLayout';

interface AssignmentModalProps { isOpen: boolean; onClose: () => void; onSaved?: () => void; }

interface AsignacionOption {
  id: number; ciclo_escolar: string;
  grupo?:   { nombre: string; codigo_grupo: string };
  materia?: { nombre: string };
  docente?: Docente;
}
interface AulaOption { id: number; nombre: string; codigo_aula: string; capacidad: number; }
interface Diagnostico {
  tipo: 'warning' | 'critica'; titulo: string; mensaje: string;
  detalles?: string | string[] | Record<string, any>; sugerencia?: string; [key: string]: unknown;
}
interface GenerateResult {
  horarios_creados?: number; conflictos_detectados?: number;
  asignaciones_fallidas?: any[]; asignaciones_parciales?: number;
  asignaciones_completadas?: number; diagnosticos?: Diagnostico[];
  alertas?: Diagnostico[]; mensaje?: string; [key: string]: unknown;
}

const DIAS  = [{ value:'lunes',label:'Lunes' },{ value:'martes',label:'Martes' },{ value:'miercoles',label:'Miércoles' },{ value:'jueves',label:'Jueves' },{ value:'viernes',label:'Viernes' },{ value:'sabado',label:'Sábado' }];
const TIPOS = [{ value:'teorica',label:'Teórica' },{ value:'practica',label:'Práctica' },{ value:'laboratorio',label:'Laboratorio' }];
const HOUR_OPTIONS: string[] = [];
for (let h = 7; h <= 22; h++) HOUR_OPTIONS.push(`${String(h).padStart(2,'0')}:00`);

function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = API_CONFIG.BASE_URL;
const EMPTY_FORM = { asignacion_id: 0, aula_id: 0, dia_semana: 'lunes', hora_inicio: '07:00', hora_fin: '08:00', tipo_sesion: 'teorica' };

/* ── Estilos compartidos */
const SELECT = 'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-[#0d2a6e] text-white text-sm outline-none transition focus:border-white/60 cursor-pointer';
const LABEL  = 'block text-xs font-semibold text-white/70 mb-1.5 tracking-wide uppercase';
const INPUT  = 'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 text-white text-sm placeholder:text-white/40 outline-none transition focus:border-white/60 focus:bg-white/20';

export default function AssignmentModal({ isOpen, onClose, onSaved }: AssignmentModalProps) {
  const [tab, setTab] = useState<'manual' | 'auto'>('manual');

  /* Manual */
  const [form, setForm]                         = useState(EMPTY_FORM);
  const [asignaciones, setAsignaciones]         = useState<AsignacionOption[]>([]);
  const [aulas, setAulas]                       = useState<AulaOption[]>([]);
  const [loadingData, setLoadingData]           = useState(false);
  const [saving, setSaving]                     = useState(false);
  const [errorManual, setErrorManual]           = useState<string | null>(null);
  const [disponibilidadError, setDisponibilidadError] = useState<{ dia:string; franjas_disponibles:string; sugerencia:string }|null>(null);
  const [horasMaxError, setHorasMaxError]       = useState<{ limite:number; horas_actuales:number; horas_nuevas:number; horas_totales:number; sugerencia:string }|null>(null);
  const [showDisponibilidad, setShowDisponibilidad] = useState(false);

  const docenteSeleccionado: Docente | null =
    (asignaciones.find(a => a.id === form.asignacion_id)?.docente ?? null) as Docente | null;

  /* Automático */
  const [ciclo, setCiclo]           = useState('');
  const [clearExisting, setClearExisting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult]   = useState<GenerateResult | null>(null);
  const [errorAuto, setErrorAuto]   = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM); setErrorManual(null); setGenResult(null); setErrorAuto(null);
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [resAsig, resAulas] = await Promise.all([
          fetch(`${BASE}/asignaciones?page=1&page_size=100`, { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch(`${BASE}/aulas?page=1&page_size=100&activo=true`,  { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);
        const da = resAsig.ok  ? await resAsig.json()  : { asignaciones:[] };
        const dau = resAulas.ok ? await resAulas.json() : { aulas:[] };
        setAsignaciones(da.asignaciones ?? []);
        setAulas(dau.aulas ?? []);
      } finally { setLoadingData(false); }
    };
    fetchData();
  }, [isOpen]);

  /* Crear horario manual */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.hora_fin <= form.hora_inicio) { setErrorManual('La hora de fin debe ser mayor que la de inicio'); return; }
    if (!form.asignacion_id || !form.aula_id) { setErrorManual('Debes seleccionar una asignación y un aula'); return; }
    setSaving(true); setErrorManual(null); setDisponibilidadError(null); setHorasMaxError(null);
    try {
      const res = await fetch(`${BASE}/horarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, hora_inicio: `${form.hora_inicio}:00`, hora_fin: `${form.hora_fin}:00` }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const detail = err?.detail;
        if (detail && typeof detail === 'object' && detail.mensaje) {
          setErrorManual(detail.mensaje);
          if (detail.disponibilidad_docente) setDisponibilidadError(detail.disponibilidad_docente);
          if (detail.horas_maximas) setHorasMaxError(detail.horas_maximas);
          return;
        }
        throw new Error(typeof detail === 'string' ? detail : `Error ${res.status}`);
      }
      onSaved?.(); onClose();
    } catch (e: any) { setErrorManual(e.message ?? 'Error al crear el horario'); }
    finally { setSaving(false); }
  };

  /* Generación automática */
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciclo.trim()) { setErrorAuto('Ingresa el ciclo escolar'); return; }
    setGenerating(true); setErrorAuto(null); setGenResult(null);
    try {
      const params = new URLSearchParams({ ciclo_escolar: ciclo.trim() });
      if (clearExisting) params.set('clear_existing', 'true');
      const res = await fetch(`${BASE}/schedule/generate?${params}`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.detail ?? `Error ${res.status}`); }
      setGenResult(await res.json());
      onSaved?.();
    } catch (e: any) { setErrorAuto(e.message ?? 'Error al generar horarios'); }
    finally { setGenerating(false); }
  };

  const asigLabel = (a: AsignacionOption) => {
    const grupo   = a.grupo?.nombre   ?? '—';
    const materia = a.materia?.nombre ?? 'Sin materia';
    const docente = a.docente?.user
      ? `${a.docente.user.nombre} ${a.docente.user.apellido}`
      : a.docente?.codigo_docente ?? '—';
    return `[${a.ciclo_escolar}] ${materia} · ${grupo} · ${docente}`;
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       w-11/12 sm:w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl
                       focus:outline-none bg-[linear-gradient(145deg,#0a2460cc,#0d3494cc)]
                       backdrop-blur-xl border border-white/20"
            onEscapeKeyDown={onClose}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/15
                            sticky top-0 bg-[linear-gradient(135deg,#0a2a6e,#0d3494)] rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 border border-white/25">
                  <ClipboardList size={16} className="text-white" />
                </div>
                <Dialog.Title className="text-white font-bold text-base">Nuevo horario</Dialog.Title>
              </div>
              <Dialog.Close onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button type="button" onClick={() => setTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 cursor-pointer
                  ${tab==='manual' ? 'border-blue-400 text-blue-300' : 'border-transparent text-white/40 hover:text-white/70'}`}>
                <ClipboardList size={15} /> Horario manual
              </button>
              <button type="button" onClick={() => setTab('auto')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 cursor-pointer
                  ${tab==='auto' ? 'border-purple-400 text-purple-300' : 'border-transparent text-white/40 hover:text-white/70'}`}>
                <Wand2 size={15} /> Generación automática
              </button>
            </div>

            {/* Body */}
            <div className="p-6">

              {/* ── TAB MANUAL ── */}
              {tab === 'manual' && (
                loadingData ? (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <RefreshCw size={22} className="animate-spin text-blue-400" />
                    <span className="text-white/60 text-sm">Cargando datos…</span>
                  </div>
                ) : (
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    {errorManual && (
                      <div className="flex items-start gap-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" /><span>{errorManual}</span>
                      </div>
                    )}
                    {disponibilidadError && (
                      <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-3 text-sm space-y-1">
                        <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <Clock size={13} /> Disponibilidad el {disponibilidadError.dia}
                        </p>
                        <p className="text-amber-200/80 text-xs leading-relaxed">{disponibilidadError.sugerencia}</p>
                      </div>
                    )}
                    {horasMaxError && (
                      <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl px-4 py-3 text-sm space-y-2">
                        <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                          <BarChart2 size={13} /> Límite de horas semanales
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          {[
                            { label: 'actuales', value: `${horasMaxError.horas_actuales}h`, color: 'text-white' },
                            { label: 'nuevas',   value: `+${horasMaxError.horas_nuevas}h`,  color: 'text-amber-300' },
                            { label: `de ${horasMaxError.limite}h`, value: `${horasMaxError.horas_totales}h`, color: 'text-red-300' },
                          ].map(c => (
                            <div key={c.label} className="bg-white/10 border border-white/10 rounded-lg py-1.5">
                              <p className={`font-bold ${c.color}`}>{c.value}</p>
                              <p className="text-white/40">{c.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Asignación */}
                    <div>
                      <label className={LABEL}>
                        Asignación <span className="text-red-400">*</span>
                        <span className="text-white/30 ml-1 normal-case text-[10px]">(materia · grupo · docente)</span>
                      </label>
                      <select name="asignacion_id" value={form.asignacion_id}
                        onChange={e => setForm(p => ({ ...p, asignacion_id: parseInt(e.target.value)||0 }))}
                        required className={SELECT}>
                        <option value={0} className="bg-[#0d2a6e]">— Seleccionar asignación —</option>
                        {asignaciones.map(a => <option key={a.id} value={a.id} className="bg-[#0d2a6e]">{asigLabel(a)}</option>)}
                      </select>
                      {asignaciones.length === 0 && <p className="text-xs text-amber-400 mt-1.5">⚠ No hay asignaciones registradas.</p>}
                      {docenteSeleccionado && form.asignacion_id !== 0 && (
                        <button type="button" onClick={() => setShowDisponibilidad(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                     text-indigo-300 bg-indigo-500/20 border border-indigo-400/30
                                     rounded-lg hover:bg-indigo-500/30 transition cursor-pointer">
                          <CalendarDays size={13} />
                          Ver disponibilidad del docente
                          {docenteSeleccionado.disponibilidades?.length !== undefined && (
                            <span className="ml-1 bg-indigo-400/30 text-indigo-200 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                              {docenteSeleccionado.disponibilidades.length} bloques
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Aula */}
                    <div>
                      <label className={LABEL}>Aula <span className="text-red-400">*</span></label>
                      <select value={form.aula_id}
                        onChange={e => setForm(p => ({ ...p, aula_id: parseInt(e.target.value)||0 }))}
                        required className={SELECT}>
                        <option value={0} className="bg-[#0d2a6e]">— Seleccionar aula —</option>
                        {aulas.map(a => <option key={a.id} value={a.id} className="bg-[#0d2a6e]">{a.nombre} ({a.codigo_aula}) — cap. {a.capacidad}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Día <span className="text-red-400">*</span></label>
                        <select value={form.dia_semana}
                          onChange={e => setForm(p => ({ ...p, dia_semana: e.target.value }))} className={SELECT}>
                          {DIAS.map(d => <option key={d.value} value={d.value} className="bg-[#0d2a6e]">{d.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Tipo de sesión <span className="text-red-400">*</span></label>
                        <select value={form.tipo_sesion}
                          onChange={e => setForm(p => ({ ...p, tipo_sesion: e.target.value }))} className={SELECT}>
                          {TIPOS.map(t => <option key={t.value} value={t.value} className="bg-[#0d2a6e]">{t.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Hora inicio <span className="text-red-400">*</span></label>
                        <select value={form.hora_inicio}
                          onChange={e => setForm(p => ({ ...p, hora_inicio: e.target.value }))} className={SELECT}>
                          {HOUR_OPTIONS.slice(0,-1).map(h => <option key={h} value={h} className="bg-[#0d2a6e]">{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Hora fin <span className="text-red-400">*</span></label>
                        <select value={form.hora_fin}
                          onChange={e => setForm(p => ({ ...p, hora_fin: e.target.value }))} className={SELECT}>
                          {HOUR_OPTIONS.slice(1).map(h => <option key={h} value={h} className="bg-[#0d2a6e]">{h}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-white/15">
                      <button type="button" onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/25 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
                        Cancelar
                      </button>
                      <button type="submit" disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                                   bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)] hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)]
                                   hover:-translate-y-px transition-all duration-200 disabled:opacity-60">
                        {saving && <RefreshCw size={14} className="animate-spin" />}
                        {saving ? 'Guardando...' : 'Crear horario'}
                      </button>
                    </div>
                  </form>
                )
              )}

              {/* ── TAB AUTOMÁTICO ── */}
              {tab === 'auto' && (
                <div className="space-y-5">
                  {/* Descripción */}
                  <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl px-4 py-3 text-sm">
                    <p className="font-semibold text-purple-200 mb-1 flex items-center gap-1.5">
                      <Wand2 size={14} /> Generación automática de horarios
                    </p>
                    <p className="text-purple-300/70 text-xs leading-relaxed">
                      El sistema asignará automáticamente días, horas y aulas a todas las asignaciones
                      del ciclo indicado, respetando disponibilidad de docentes y evitando conflictos.
                    </p>
                  </div>

                  {/* Resultado */}
                  {genResult && !generating && (
                    <div className="space-y-4">
                      {/* Alertas críticas */}
                      {genResult.alertas && genResult.alertas.length > 0 && (
                        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2.5 text-red-300 font-bold text-base">
                            <AlertTriangle size={20} /> No se pudo generar el horario
                          </div>
                          <div className="space-y-3">
                            {genResult.alertas.map((alerta: any, idx: number) => (
                              <div key={idx} className="bg-white/5 rounded-xl px-4 py-3 border border-red-400/20">
                                <p className="font-bold text-red-200 text-sm">{alerta.titulo}</p>
                                <p className="text-red-300/80 text-xs mt-1.5 leading-relaxed">{alerta.mensaje}</p>
                                {alerta.detalles && (
                                  <div className="mt-3 bg-red-500/10 rounded-lg px-3 py-2 border border-red-400/20">
                                    {typeof alerta.detalles === 'string' ? (
                                      <p className="text-xs text-red-200">{alerta.detalles}</p>
                                    ) : Array.isArray(alerta.detalles) ? (
                                      <ul className="text-xs text-red-200 space-y-1">
                                        {alerta.detalles.map((d: any, i: number) => (
                                          <li key={i} className="flex items-center gap-1.5">
                                            <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full" />{d}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      Object.entries(alerta.detalles).map(([k,v]:[string,any]) => (
                                        <div key={k} className="text-xs text-red-200"><span className="font-semibold">{k}:</span> {v}</div>
                                      ))
                                    )}
                                  </div>
                                )}
                                {alerta.sugerencia && (
                                  <div className="mt-3 bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-400/20">
                                    <p className="text-xs text-blue-200"><span className="font-semibold">💡 Solución:</span> {alerta.sugerencia}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resultado exitoso */}
                      {(!genResult.alertas || genResult.alertas.length === 0) && (
                        <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-base">
                            <CheckCircle2 size={20} /> Generación completada exitosamente
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label:'Creados',  value: genResult.horarios_creados??0,               color:'text-emerald-300' },
                              { label:'Parciales', value: genResult.asignaciones_parciales??0,         color:'text-amber-300'  },
                              { label:'Fallidas',  value: genResult.asignaciones_fallidas?.length??0,  color:'text-red-300'    },
                            ].map(c => (
                              <div key={c.label} className="bg-white/10 border border-white/10 rounded-xl py-3 px-2 text-center">
                                <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                                <div className="text-xs text-white/50 mt-1 font-medium">{c.label}</div>
                              </div>
                            ))}
                          </div>
                          <button onClick={onClose}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer
                                       bg-[linear-gradient(135deg,#10b981,#059669)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.35)]">
                            Ver horarios generados →
                          </button>
                        </div>
                      )}

                      {/* Advertencias */}
                      {genResult.diagnosticos && genResult.diagnosticos.filter((d:any) => d.tipo==='warning').length > 0 && (
                        <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                            <AlertTriangle size={18} /> Advertencias
                          </div>
                          {genResult.diagnosticos.filter((d:any) => d.tipo==='warning').map((w:any, idx:number) => (
                            <div key={idx} className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-amber-400/20">
                              <p className="text-amber-200 text-xs font-semibold">{w.titulo}</p>
                              <p className="text-amber-300/70 text-xs mt-1 leading-relaxed">{w.mensaje}</p>
                              {w.sugerencia && <p className="text-xs text-amber-200 mt-2 font-medium">💡 {w.sugerencia}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulario */}
                  {!genResult && (
                    <form onSubmit={handleGenerate} className="space-y-4">
                      {errorAuto && (
                        <div className="flex items-start gap-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />{errorAuto}
                        </div>
                      )}
                      <div>
                        <label className={LABEL}>Ciclo escolar <span className="text-red-400">*</span></label>
                        <input type="text" value={ciclo} onChange={e => setCiclo(e.target.value)}
                          placeholder="ej. 2026-1" required className={INPUT} />
                        <p className="text-xs text-white/30 mt-1.5">Debe coincidir con el ciclo de las asignaciones.</p>
                      </div>

                      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-400/25 rounded-xl px-4 py-3">
                        <input type="checkbox" id="clearExisting" checked={clearExisting}
                          onChange={e => setClearExisting(e.target.checked)}
                          className="mt-0.5 rounded accent-amber-400 cursor-pointer" />
                        <div>
                          <label htmlFor="clearExisting" className="text-sm font-medium text-amber-300 cursor-pointer">
                            Eliminar horarios existentes del ciclo
                          </label>
                          <p className="text-xs text-amber-300/60 mt-0.5">
                            Si está marcado, se borrarán todos los horarios actuales del ciclo antes de generar los nuevos.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-white/25 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
                          Cancelar
                        </button>
                        <button type="submit" disabled={generating}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                                     bg-[linear-gradient(135deg,#7c3aed,#5b21b6)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.45)]
                                     hover:-translate-y-px transition-all duration-200 disabled:opacity-60">
                          {generating ? <><RefreshCw size={14} className="animate-spin" /> Generando…</> : <><Wand2 size={14} /> Generar horarios</>}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal disponibilidad — solo lectura */}
      <DisponibilidadViewModal
        isOpen={showDisponibilidad}
        docente={docenteSeleccionado}
        onClose={() => setShowDisponibilidad(false)}
      />
    </>
  );
}
