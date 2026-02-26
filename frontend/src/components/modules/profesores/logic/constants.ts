import type { ToastType, Docente } from './types';

/* ── Days of Week ────────────────────────────────────────────────── */
export const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const DIA_LABELS: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miércoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sábado: 'Sábado',
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

/* ── Table Header Grid ────────────────────────────────────────────– */
export const TABLE_HEADERS = [
  { key: 'codigo_docente', label: 'Código', align: 'left' },
  { key: 'nombre', label: 'Nombre', align: 'left' },
  { key: 'email', label: 'Email', align: 'left' },
  { key: 'departamento', label: 'Departamento', align: 'left' },
  { key: 'horas_maximas_semana', label: 'Hrs/Sem', align: 'center' },
  { key: 'disponibilidades', label: 'Disponibilidad', align: 'center' },
  { key: 'activo', label: 'Estado', align: 'center' },
  { key: 'acciones', label: 'Acciones', align: 'center' },
];

/* ── Empty Form State ────────────────────────────────────────────── */
export const EMPTY_DOCENTE: Docente = {
  user_id: 0,
  codigo_docente: '',
  departamento: null,
  horas_maximas_semana: 40,
  activo: true,
  disponibilidades: [],
};
