/**
 * Tipos y interfaces del módulo de asignaciones
 */

import type { Docente } from '../../profesores/ProfesoresLayout';

export interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export interface AsignacionOption {
  id: number;
  ciclo_escolar: string;
  grupo?: { nombre: string; codigo_grupo: string };
  materia?: { nombre: string };
  docente?: Docente;
}

export interface AulaOption {
  id: number;
  nombre: string;
  codigo_aula: string;
  capacidad: number;
}

export interface Diagnostico {
  tipo: 'warning' | 'critica';
  titulo: string;
  mensaje: string;
  detalles?: string | string[] | Record<string, any>;
  sugerencia?: string;
  [key: string]: unknown;
}

export interface GenerateResult {
  horarios_creados?: number;
  conflictos_detectados?: number;
  asignaciones_fallidas?: any[];
  asignaciones_parciales?: number;
  asignaciones_completadas?: number;
  diagnosticos?: Diagnostico[];
  alertas?: Diagnostico[];
  mensaje?: string;
  [key: string]: unknown;
}

export interface ManualFormState {
  asignacion_id: number;
  aula_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_sesion: string;
}

export interface DisponibilidadError {
  dia: string;
  franjas_disponibles: string;
  sugerencia: string;
}

export interface HorasMaxError {
  limite: number;
  horas_actuales: number;
  horas_nuevas: number;
  horas_totales: number;
  sugerencia: string;
}

// Asignaciones Layout
export interface Asignacion {
  id: number;
  grupo_id: number;
  materia_id: number;
  docente_id: number;
  ciclo_escolar: string;
  created_at: string;
  grupo?: { id: number; nombre: string; codigo_grupo: string; carrera: string; semestre: number };
  materia?: { id: number; nombre: string; codigo_materia: string; creditos: number; horas_semana: number };
  docente?: { id: number; codigo_docente: string; user?: { nombre: string; apellido: string; email: string } };
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

export interface ConfirmDialogState {
  open: boolean;
  id?: number;
  label: string;
}

// Asignaciones Modal
export interface GrupoOption {
  id: number;
  nombre: string;
  codigo_grupo: string;
  carrera: string;
  semestre: number;
  ciclo_escolar: string;
}

export interface MateriaOption {
  id: number;
  nombre: string;
  codigo_materia: string;
  horas_semana: number;
}

export interface DocenteOption {
  id: number;
  codigo_docente: string;
  user?: { nombre: string; apellido: string };
}

export interface AsignacionFormState {
  grupo_id: number;
  materia_id: number;
  docente_id: number;
  ciclo_escolar: string;
}

export interface AsignacionesModalProps {
  isOpen: boolean;
  editing: Asignacion | null;
  onClose: () => void;
  onSaved: () => void;
}
