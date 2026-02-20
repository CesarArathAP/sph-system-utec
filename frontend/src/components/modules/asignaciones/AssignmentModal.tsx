import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RefreshCw, ClipboardList, Wand2, AlertTriangle, CheckCircle, Clock, BarChart2 } from 'lucide-react';

import { API_CONFIG } from '../../../services/config';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

/* ── Tipos ──────────────────────────────────────────────────────────── */
interface AsignacionOption {
  id: number;
  ciclo_escolar: string;
  grupo?: { nombre: string; codigo_grupo: string };
  materia?: { nombre: string };
  docente?: { codigo_docente: string; user?: { nombre: string; apellido: string } };
}

interface AulaOption {
  id: number;
  nombre: string;
  codigo_aula: string;
  capacidad: number;
}

interface GenerateResult {
  horarios_creados?: number;
  conflictos_detectados?: number;
  asignaciones_fallidas?: number;
  mensaje?: string;
  [key: string]: unknown;
}

const DIAS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
];

const TIPOS = [
  { value: 'teorica', label: 'Teórica' },
  { value: 'practica', label: 'Práctica' },
  { value: 'laboratorio', label: 'Laboratorio' },
];

const HOUR_OPTIONS: string[] = [];
for (let h = 7; h <= 22; h++) HOUR_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);

function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = API_CONFIG.BASE_URL;

const EMPTY_FORM = {
  asignacion_id: 0,
  aula_id: 0,
  dia_semana: 'lunes',
  hora_inicio: '07:00',
  hora_fin: '08:00',
  tipo_sesion: 'teorica',
};

export default function AssignmentModal({ isOpen, onClose, onSaved }: AssignmentModalProps) {
  /* ── Modo activo ─────────────────────────────────────────────────── */
  const [tab, setTab] = useState<'manual' | 'auto'>('manual');

  /* ── Tab Manual ─────────────────────────────────────────────────── */
  const [form, setForm] = useState(EMPTY_FORM);
  const [asignaciones, setAsignaciones] = useState<AsignacionOption[]>([]);
  const [aulas, setAulas] = useState<AulaOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorManual, setErrorManual] = useState<string | null>(null);
  const [disponibilidadError, setDisponibilidadError] = useState<{
    dia: string; franjas_disponibles: string; sugerencia: string;
  } | null>(null);
  const [horasMaxError, setHorasMaxError] = useState<{
    limite: number; horas_actuales: number; horas_nuevas: number; horas_totales: number; sugerencia: string;
  } | null>(null);


  /* ── Tab Automático ─────────────────────────────────────────────── */
  const [ciclo, setCiclo] = useState('');
  const [clearExisting, setClearExisting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<GenerateResult | null>(null);
  const [errorAuto, setErrorAuto] = useState<string | null>(null);

  /* ── Cargar datos cuando se abre el modal ───────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setErrorManual(null);
    setGenResult(null);
    setErrorAuto(null);

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [resAsig, resAulas] = await Promise.all([
          fetch(`${BASE}/asignaciones?page=1&page_size=100`, { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch(`${BASE}/aulas?page=1&page_size=100&activo=true`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);
        const dataAsig = resAsig.ok ? await resAsig.json() : { asignaciones: [] };
        const dataAulas = resAulas.ok ? await resAulas.json() : { aulas: [] };
        setAsignaciones(dataAsig.asignaciones ?? []);
        setAulas(dataAulas.aulas ?? []);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen]);

  /* ── Crear horario manual ───────────────────────────────────────── */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.hora_fin <= form.hora_inicio) {
      setErrorManual('La hora de fin debe ser mayor que la hora de inicio'); return;
    }
    if (!form.asignacion_id || !form.aula_id) {
      setErrorManual('Debes seleccionar una asignación y un aula'); return;
    }
    setSaving(true); setErrorManual(null); setDisponibilidadError(null); setHorasMaxError(null);
    try {
      const res = await fetch(`${BASE}/horarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          asignacion_id: form.asignacion_id,
          aula_id: form.aula_id,
          dia_semana: form.dia_semana,
          hora_inicio: `${form.hora_inicio}:00`,
          hora_fin: `${form.hora_fin}:00`,
          tipo_sesion: form.tipo_sesion,
        }),
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
      onSaved?.();
      onClose();
    } catch (e: any) {
      setErrorManual(e.message ?? 'Error al crear el horario');
    } finally {
      setSaving(false);
    }
  };

  /* ── Generación automática ──────────────────────────────────────── */
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciclo.trim()) { setErrorAuto('Ingresa el ciclo escolar'); return; }
    setGenerating(true); setErrorAuto(null); setGenResult(null);
    try {
      const params = new URLSearchParams({ ciclo_escolar: ciclo.trim() });
      if (clearExisting) params.set('clear_existing', 'true');
      const res = await fetch(`${BASE}/schedule/generate?${params}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? `Error ${res.status}`);
      }
      const data = await res.json();
      setGenResult(data);
      onSaved?.();   // refrescar tabla
    } catch (e: any) {
      setErrorAuto(e.message ?? 'Error al generar horarios');
    } finally {
      setGenerating(false);
    }
  };

  /* ── Label helper para asignaciones ─────────────────────────────── */
  const asigLabel = (a: AsignacionOption) => {
    const grupo = a.grupo?.nombre ?? '—';
    const materia = a.materia?.nombre ?? 'Sin materia';
    const docente = a.docente?.user
      ? `${a.docente.user.nombre} ${a.docente.user.apellido}`
      : a.docente?.codigo_docente ?? '—';
    return `[${a.ciclo_escolar}] ${materia} · ${grupo} · ${docente}`;
  };

  /* ── RENDER ─────────────────────────────────────────────────────── */
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh]
                     overflow-y-auto focus:outline-none"
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
            <Dialog.Title className="text-lg font-bold text-gray-900">
              Nuevo horario
            </Dialog.Title>
            <Dialog.Close onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition" aria-label="Cerrar">
              ×
            </Dialog.Close>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2
                ${tab === 'manual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <ClipboardList size={15} /> Horario manual
            </button>
            <button
              type="button"
              onClick={() => setTab('auto')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2
                ${tab === 'auto'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Wand2 size={15} /> Generación automática
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* ── TAB MANUAL ── */}
            {tab === 'manual' && (
              loadingData ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw size={22} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Cargando datos…</span>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  {errorManual && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2 items-start">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <span>{errorManual}</span>
                    </div>
                  )}
                  {disponibilidadError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm space-y-1">
                      <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                        <Clock size={13} /> Disponibilidad el {disponibilidadError.dia}
                      </p>
                      <p className="text-amber-700 text-xs leading-relaxed">
                        {disponibilidadError.sugerencia}
                      </p>
                    </div>
                  )}
                  {horasMaxError && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm space-y-2">
                      <p className="font-semibold text-purple-800 flex items-center gap-1.5">
                        <BarChart2 size={13} /> Límite de horas semanales
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white border border-purple-100 rounded-lg py-1.5">
                          <p className="font-bold text-gray-700">{horasMaxError.horas_actuales}h</p>
                          <p className="text-gray-400">actuales</p>
                        </div>
                        <div className="bg-white border border-purple-100 rounded-lg py-1.5">
                          <p className="font-bold text-orange-500">+{horasMaxError.horas_nuevas}h</p>
                          <p className="text-gray-400">nuevas</p>
                        </div>
                        <div className="bg-white border border-red-100 rounded-lg py-1.5">
                          <p className="font-bold text-red-500">{horasMaxError.horas_totales}h</p>
                          <p className="text-gray-400">de {horasMaxError.limite}h</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Asignación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asignación <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-400 ml-1">(materia · grupo · docente)</span>
                    </label>
                    <select
                      name="asignacion_id" value={form.asignacion_id}
                      onChange={(e) => setForm(p => ({ ...p, asignacion_id: parseInt(e.target.value) || 0 }))}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>— Seleccionar asignación —</option>
                      {asignaciones.map((a) => (
                        <option key={a.id} value={a.id}>{asigLabel(a)}</option>
                      ))}
                    </select>
                    {asignaciones.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">⚠ No hay asignaciones registradas.</p>
                    )}
                  </div>

                  {/* Aula */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aula <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.aula_id}
                      onChange={(e) => setForm(p => ({ ...p, aula_id: parseInt(e.target.value) || 0 }))}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>— Seleccionar aula —</option>
                      {aulas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre} ({a.codigo_aula}) — cap. {a.capacidad}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Día <span className="text-red-500">*</span></label>
                      <select value={form.dia_semana}
                        onChange={(e) => setForm(p => ({ ...p, dia_semana: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {DIAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sesión <span className="text-red-500">*</span></label>
                      <select value={form.tipo_sesion}
                        onChange={(e) => setForm(p => ({ ...p, tipo_sesion: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio <span className="text-red-500">*</span></label>
                      <select value={form.hora_inicio}
                        onChange={(e) => setForm(p => ({ ...p, hora_inicio: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {HOUR_OPTIONS.slice(0, -1).map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin <span className="text-red-500">*</span></label>
                      <select value={form.hora_fin}
                        onChange={(e) => setForm(p => ({ ...p, hora_fin: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {HOUR_OPTIONS.slice(1).map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition text-sm">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-60">
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
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm text-purple-800">
                  <p className="font-semibold mb-1 flex items-center gap-1.5">
                    <Wand2 size={14} /> Generación automática de horarios
                  </p>
                  <p className="text-xs leading-relaxed text-purple-700">
                    El sistema asignará automáticamente días, horas y aulas a todas las asignaciones
                    del ciclo indicado, respetando disponibilidad de docentes y evitando conflictos.
                  </p>
                </div>

                {/* Resultado exitoso */}
                {genResult && !generating && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                      <CheckCircle size={16} /> Generación completada
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white border border-green-200 rounded-lg py-2">
                        <div className="text-xl font-bold text-green-600">
                          {genResult.horarios_creados ?? 0}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Horarios creados</div>
                      </div>
                      <div className="bg-white border border-yellow-200 rounded-lg py-2">
                        <div className="text-xl font-bold text-yellow-600">
                          {genResult.conflictos_detectados ?? 0}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Conflictos</div>
                      </div>
                      <div className="bg-white border border-red-200 rounded-lg py-2">
                        <div className="text-xl font-bold text-red-500">
                          {genResult.asignaciones_fallidas ?? 0}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">Fallidas</div>
                      </div>
                    </div>
                    <button onClick={onClose}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition">
                      Ver horarios generados
                    </button>
                  </div>
                )}

                {/* Formulario */}
                {!genResult && (
                  <form onSubmit={handleGenerate} className="space-y-4">
                    {errorAuto && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        {errorAuto}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciclo escolar <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ciclo}
                        onChange={(e) => setCiclo(e.target.value)}
                        placeholder="ej. 2026-1"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Debe coincidir con el ciclo escolar de las asignaciones registradas.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <input
                        type="checkbox"
                        id="clearExisting"
                        checked={clearExisting}
                        onChange={(e) => setClearExisting(e.target.checked)}
                        className="mt-0.5 rounded"
                      />
                      <div>
                        <label htmlFor="clearExisting" className="text-sm font-medium text-amber-800 cursor-pointer">
                          Eliminar horarios existentes del ciclo
                        </label>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Si está marcado, se borrarán todos los horarios actuales del ciclo antes de generar los nuevos.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={onClose}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition text-sm">
                        Cancelar
                      </button>
                      <button type="submit" disabled={generating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-60">
                        {generating
                          ? <><RefreshCw size={14} className="animate-spin" /> Generando…</>
                          : <><Wand2 size={14} /> Generar horarios</>}
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
  );
}
