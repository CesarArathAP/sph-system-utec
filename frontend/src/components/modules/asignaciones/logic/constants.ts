/**
 * Constantes del módulo de asignaciones
 */

export const DIAS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
];

export const TIPOS = [
  { value: 'teorica', label: 'Teórica' },
  { value: 'practica', label: 'Práctica' },
  { value: 'laboratorio', label: 'Laboratorio' },
];

export const HOUR_OPTIONS: string[] = [];
for (let h = 7; h <= 22; h++) {
  HOUR_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
}

export const EMPTY_FORM = {
  asignacion_id: 0,
  aula_id: 0,
  dia_semana: 'lunes',
  hora_inicio: '07:00',
  hora_fin: '08:00',
  tipo_sesion: 'teorica',
};

export const STYLES = {
  SELECT: 'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-[#0d2a6e] text-white text-sm outline-none transition focus:border-white/60 cursor-pointer',
  LABEL: 'block text-xs font-semibold text-white/70 mb-1.5 tracking-wide uppercase',
  INPUT: 'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 text-white text-sm placeholder:text-white/40 outline-none transition focus:border-white/60 focus:bg-white/20',
};
