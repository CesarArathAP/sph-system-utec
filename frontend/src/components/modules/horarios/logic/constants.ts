/**
 * Constantes del módulo de horarios
 */

export const DAYS = [
  { label: 'Lunes', value: 'lunes' },
  { label: 'Martes', value: 'martes' },
  { label: 'Miércoles', value: 'miercoles' },
  { label: 'Jueves', value: 'jueves' },
  { label: 'Viernes', value: 'viernes' },
  { label: 'Sábado', value: 'sabado' },
];

export const HOURS: string[] = [];
for (let h = 7; h < 22; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}:00`);
}

export const TIPO_COLORS: Record<string, string> = {
  teorica: 'bg-blue-500/20 border-blue-500/30 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
  practica: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
  laboratorio: 'bg-violet-500/20 border-violet-500/30 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]',
};

export const TIPO_LABEL: Record<string, string> = {
  teorica: 'Teórica',
  practica: 'Práctica',
  laboratorio: 'Lab.',
};

export const INPUT_CLASS = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold shadow-inner';

export const LABEL_CLASS = 'text-[10px] font-black text-white/25 uppercase tracking-[0.3em] mb-2.5 ms-2 block';
