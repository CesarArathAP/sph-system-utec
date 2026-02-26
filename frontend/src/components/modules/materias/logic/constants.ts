import { LayoutGrid, Monitor, FlaskConical, Mic } from 'lucide-react';
import type { ToastType, TipoAulaConfig, Materia } from './types';

/* ── Tipo Aula Configuration ────────────────────────────────────── */
export const TIPOS_AULA = ['normal', 'computo', 'laboratorio', 'auditorio'];

export const TIPO_AULA_INFO: Record<string, TipoAulaConfig> = {
  normal: {
    label: 'Normal',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
    Icon: LayoutGrid,
  },
  computo: {
    label: 'Cómputo',
    className: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    Icon: Monitor,
  },
  laboratorio: {
    label: 'Laboratorio',
    className: 'bg-purple-100 text-purple-700 border border-purple-200',
    Icon: FlaskConical,
  },
  auditorio: {
    label: 'Auditorio',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
    Icon: Mic,
  },
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
  { key: 'codigo_materia', label: 'Código', align: 'left' },
  { key: 'nombre', label: 'Nombre', align: 'left' },
  { key: 'creditos', label: 'Créditos', align: 'center' },
  { key: 'horas_semana', label: 'Hrs/Sem', align: 'center' },
  { key: 'tipo_aula_requerida', label: 'Tipo Aula', align: 'center' },
  { key: 'requiere_laboratorio', label: 'Laboratorio', align: 'center' },
  { key: 'activo', label: 'Estado', align: 'center' },
  { key: 'acciones', label: 'Acciones', align: 'center' },
];

/* ── Empty Form State ────────────────────────────────────────────── */
export const EMPTY_FORM: Materia = {
  codigo_materia: '',
  nombre: '',
  creditos: 1,
  horas_semana: 1,
  requiere_laboratorio: false,
  tipo_aula_requerida: null,
  descripcion: null,
  activo: true,
};
