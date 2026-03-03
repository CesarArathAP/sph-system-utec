/**
 * Constantes del módulo de aulas
 */

// Estilos CSS
export const INPUT =
  'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 text-white text-sm ' +
  'placeholder:text-white/40 outline-none transition ' +
  'focus:border-white/60 focus:bg-white/20';

export const LABEL = 'block text-xs font-semibold text-white/70 mb-1.5 tracking-wide uppercase';

// Colores de tipo
export const TIPO_COLORS: Record<string, string> = {
  normal:      'bg-blue-100    text-blue-700    border border-blue-200',
  computo:     'bg-cyan-100    text-cyan-700    border border-cyan-200',
  laboratorio: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  auditorio:   'bg-purple-100  text-purple-700  border border-purple-200',
};

// Opciones de tipo
export const TIPO_OPTIONS = [
  { value: 'normal',      label: 'Normal' },
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'computo',     label: 'Cómputo' },
  { value: 'auditorio',   label: 'Auditorio' },
];
