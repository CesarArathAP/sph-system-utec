/* ── Grupo Types ────────────────────────────────────────────────── */
export interface Grupo {
  id?: string;
  codigo: string;
  nombre: string;
  carrera: string;
  semestre: number;
  turno: string;
  numeroEstudiantes: number;
  cicloEscolar: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  id?: string;
  msg: string;
}

export interface GruposModalProps {
  isOpen: boolean;
  grupo: Grupo | null;
  onClose: () => void;
  onSave: (grupo: Grupo) => void;
}
