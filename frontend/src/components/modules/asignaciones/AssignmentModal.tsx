import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RefreshCw } from 'lucide-react';
import { API_CONFIG } from '../../../services/config';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;   // refrescar la tabla de horarios tras crear
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

// Franjas válidas: 07:00 → 22:00 en intervalos de 1h
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [asignaciones, setAsignaciones] = useState<AsignacionOption[]>([]);
  const [aulas, setAulas] = useState<AulaOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Cargar asignaciones y aulas cuando se abra el modal */
  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setError(null);

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
      } catch {
        setError('Error al cargar los datos necesarios');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'asignacion_id' || name === 'aula_id' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica de horas
    if (form.hora_fin <= form.hora_inicio) {
      setError('La hora de fin debe ser mayor que la hora de inicio');
      return;
    }
    if (!form.asignacion_id || !form.aula_id) {
      setError('Debes seleccionar una asignación y un aula');
      return;
    }

    setSaving(true);
    setError(null);

    const body = {
      asignacion_id: form.asignacion_id,
      aula_id: form.aula_id,
      dia_semana: form.dia_semana,
      hora_inicio: `${form.hora_inicio}:00`,   // "07:00" → "07:00:00"
      hora_fin: `${form.hora_fin}:00`,
      tipo_sesion: form.tipo_sesion,
    };

    try {
      const res = await fetch(`${BASE}/horarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? `Error ${res.status}`);
      }

      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Error al crear el horario');
    } finally {
      setSaving(false);
    }
  };

  /* ── Label helper para asignaciones ─────────────────────────────── */
  const asigLabel = (a: AsignacionOption) => {
    const grupo = a.grupo?.nombre ?? `Grupo #${a.grupo_id ?? '?'}`;
    const materia = a.materia?.nombre ?? 'Sin materia';
    const docente = a.docente?.user
      ? `${a.docente.user.nombre} ${a.docente.user.apellido}`
      : a.docente?.codigo_docente ?? '—';
    return `[${a.ciclo_escolar}] ${materia} · ${grupo} · ${docente}`;
  };

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

          {/* Body */}
          <div className="p-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw size={22} className="animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">Cargando datos…</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                {/* Asignación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignación <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 ml-1">(materia · grupo · docente)</span>
                  </label>
                  <select
                    name="asignacion_id" value={form.asignacion_id} onChange={handleChange} required
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
                    name="aula_id" value={form.aula_id} onChange={handleChange} required
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
                  {/* Día */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Día <span className="text-red-500">*</span></label>
                    <select name="dia_semana" value={form.dia_semana} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DIAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>

                  {/* Tipo sesión */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sesión <span className="text-red-500">*</span></label>
                    <select name="tipo_sesion" value={form.tipo_sesion} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Hora inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio <span className="text-red-500">*</span></label>
                    <select name="hora_inicio" value={form.hora_inicio} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {HOUR_OPTIONS.slice(0, -1).map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  {/* Hora fin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin <span className="text-red-500">*</span></label>
                    <select name="hora_fin" value={form.hora_fin} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {HOUR_OPTIONS.slice(1).map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <Dialog.Close asChild>
                    <button type="button" onClick={onClose}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition text-sm">
                      Cancelar
                    </button>
                  </Dialog.Close>
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm disabled:opacity-60">
                    {saving && <RefreshCw size={14} className="animate-spin" />}
                    {saving ? 'Guardando...' : 'Crear horario'}
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
