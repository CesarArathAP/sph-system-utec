/**
 * Tipos e interfaces del módulo de aulas
 */

export interface Aula {
  id?: string;
  codigo: string;
  nombre: string;
  capacidad: number;
  tipo: string;
  edificio: string;
  piso: number | null;
  equipamiento: string;
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

export interface AulasModalProps {
  isOpen: boolean;
  aula: Aula | null;
  onClose: () => void;
  onSave: (aula: Aula) => void;
}
