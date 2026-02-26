/* ── Materia Model ────────────────────────────────────────── */
export interface Materia {
  id?: number;
  codigo_materia: string;
  nombre: string;
  creditos: number;
  horas_semana: number;
  requiere_laboratorio: boolean;
  tipo_aula_requerida: string | null;
  descripcion: string | null;
  activo: boolean;
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

/* ── Modal Props ────────────────────────────────────────────────── */
export interface MateriasModalProps {
  isOpen: boolean;
  materia: Materia | null;
  onClose: () => void;
  onSave: (materia: Materia) => void;
}

/* ── Tipo Aula Configuration ────────────────────────────────– */
export interface TipoAulaConfig {
  label: string;
  className: string;
  Icon: React.FC<any>;
}
