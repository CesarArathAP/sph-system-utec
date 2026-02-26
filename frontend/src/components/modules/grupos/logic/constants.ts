import type { ToastType } from './types';

/* ── Turno Configuration ────────────────────────────────────────── */
export const TURNOS = ['matutino', 'vespertino', 'nocturno'];

export const TURNO_COLORS: Record<string, string> = {
  matutino: 'bg-amber-100 text-amber-700 border border-amber-200',
  vespertino: 'bg-blue-100 text-blue-700 border border-blue-200',
  nocturno: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
};

export const TURNO_LABELS: Record<string, string> = {
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  nocturno: 'Nocturno',
};

/* ── Toast Colors ────────────────────────────────────────────────── */
export const TOAST_ACCENT: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export const TOAST_ICON_COLOR: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};

/* ── Form Styles ────────────────────────────────────────────────── */
export const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 text-white text-sm ' +
  'placeholder:text-white/40 outline-none transition ' +
  'focus:border-white/60 focus:bg-white/20';

export const LABEL_CLASS = 'block text-xs font-semibold text-white/70 mb-1.5 tracking-wide uppercase';

/* ── Table Header Grid ────────────────────────────────────────────── */
export const TABLE_HEADERS = [
  { key: 'codigo', label: 'Código', align: 'left' },
  { key: 'nombre', label: 'Nombre', align: 'left' },
  { key: 'carrera', label: 'Carrera', align: 'left' },
  { key: 'semestre', label: 'Semestre', align: 'center' },
  { key: 'turno', label: 'Turno', align: 'center' },
  { key: 'numeroEstudiantes', label: 'Estudiantes', align: 'center' },
  { key: 'activo', label: 'Estado', align: 'center' },
  { key: 'acciones', label: 'Acciones', align: 'center' },
];

/* ── Empty Form State ────────────────────────────────────────────── */
export const EMPTY_FORM = {
  codigo: '',
  nombre: '',
  carrera: '',
  semestre: 1,
  turno: '',
  numeroEstudiantes: 0,
  cicloEscolar: '',
  activo: true,
};
