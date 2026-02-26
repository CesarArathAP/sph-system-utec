/* ── Docente Models ────────────────────────────────────────── */
export interface UserInfo {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
}

export interface Disponibilidad {
  id: number;
  docente_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  created_at: string;
}

export interface Docente {
  id?: number;
  user_id: number;
  user?: UserInfo;
  codigo_docente: string;
  departamento: string | null;
  horas_maximas_semana: number;
  activo: boolean;
  disponibilidades: Disponibilidad[];
  created_at?: string;
  updated_at?: string;
}

/* ── Toast Types ───────────────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

/* ── Modal Props ────────────────────────────────────────────────– */
export interface ProfesoresModalProps {
  isOpen: boolean;
  docente: Docente | null;
  onClose: () => void;
  onSave: (docente: Docente) => void;
}

export interface DisponibilidadModalProps {
  isOpen: boolean;
  docente: Docente | null;
  onClose: () => void;
  onSaved: () => void;
}

export interface DocenteHorarioModalProps {
  isOpen: boolean;
  docente: Docente | null;
  onClose: () => void;
}
