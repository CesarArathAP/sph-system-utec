/**
 * Custom hook para gestionar acciones en asignaciones
 * Maneja eliminación de registros y notificaciones Toast
 */

import { useState, useCallback } from 'react';
import { API_CONFIG } from '../../../../services/config';
import type { Toast, ToastType, ConfirmDialogState } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}/asignaciones`;

export function useAsignacionesActions(onRefresh: () => Promise<void>) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmDialogState>({ open: false, label: '' });

  const addToast = useCallback((type: ToastType, title: string, message = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleDelete = useCallback((id: number, label: string) => {
    setConfirm({ open: true, id, label });
  }, []);

  const confirmDelete = useCallback(async () => {
    const { id, label } = confirm;
    setConfirm({ open: false, label: '' });

    if (!id) return;

    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const serverMsg = typeof err?.detail === 'string' ? err.detail : null;
        if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        if (res.status === 403) throw new Error('No tienes permisos para eliminar esta asignación.');
        if (res.status === 409) throw new Error(serverMsg ?? `La asignación "${label}" no se puede eliminar porque tiene horarios activos asociados. Elimina primero los horarios correspondientes.`);
        if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un error al eliminar la asignación. Intenta de nuevo más tarde.');
        throw new Error(serverMsg ?? `No se pudo eliminar la asignación (código ${res.status}).`);
      }

      await onRefresh();
      addToast('info', 'Asignación eliminada', `"${label}" fue eliminada junto con sus horarios`);
    } catch (e: any) {
      addToast(
        'error',
        'No se pudo eliminar la asignación',
        e instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : e.message
      );
    }
  }, [confirm, onRefresh, addToast]);

  const cancelDelete = useCallback(() => {
    setConfirm({ open: false, label: '' });
  }, []);

  return {
    toasts,
    removeToast,
    addToast,
    confirm,
    handleDelete,
    confirmDelete,
    cancelDelete,
  };
}
