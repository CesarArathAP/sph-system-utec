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
        throw new Error(`Error ${res.status}`);
      }

      await onRefresh();
      addToast('info', 'Asignación eliminada', `"${label}" fue eliminada junto con sus horarios`);
    } catch (e: any) {
      addToast('error', 'No se pudo eliminar', e.message);
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
