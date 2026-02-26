/**
 * Tipos e interfaces del módulo de horarios
 */

export interface HorarioResponse {
  id: number;
  asignacion_id: number;
  aula_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_sesion: string;
  activo: boolean;
  asignacion?: {
    id: number;
    ciclo_escolar: string;
    grupo?: { nombre: string; codigo_grupo: string };
    materia?: { nombre: string; codigo_materia: string };
    docente?: { codigo_docente: string; departamento?: string | null; user?: { nombre: string; apellido: string } };
  };
  aula?: { nombre: string; codigo_aula: string };
}

export interface ConflictoRegistrado {
  id: number;
  horario_id?: number | null;
  tipo_conflicto: string;
  descripcion: string;
  resuelto: boolean;
  created_at: string;
  resolved_at?: string | null;
}

export interface GridCell {
  horario: HorarioResponse;
  rowSpan: number;
  isStart: boolean;
}

export interface ScheduleTableProps {
  onAssignClick: () => void;
  refreshKey?: number;
}

export interface HorarioVersion {
  version: number;
  cambios: string;
}
