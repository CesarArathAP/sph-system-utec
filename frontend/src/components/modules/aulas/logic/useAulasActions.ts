/**
 * Custom hook para gestionar acciones en aulas
 * Maneja toggle activo, eliminación y notificaciones Toast
 */

import { useState, useCallback } from 'react';
import { API_CONFIG } from '../../../../services/config';
import type { Aula, Toast, ToastType, ConfirmDialogState } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}/aulas`;

function toBackend(a: Aula) {
  return {
    codigo_aula: a.codigo,
    nombre: a.nombre,
    capacidad: a.capacidad || 1,
    tipo: a.tipo,
    edificio: a.edificio || null,
    piso: a.piso && a.piso > 0 ? a.piso : null,
    equipamiento: a.equipamiento || null,
    activo: a.activo,
  };
}

export function useAulasActions(onRefresh: () => Promise<void>) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmDialogState>({ open: false, msg: '' });

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

  const handleToggleActivo = useCallback(
    async (aula: Aula) => {
      const accion = aula.activo ? 'suspender' : 'activar';
      try {
        const res = await fetch(`${BASE}/${aula.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(toBackend({ ...aula, activo: !aula.activo })),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          const serverMsg = typeof err?.detail === 'string' ? err.detail : null;
          if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          if (res.status === 403) throw new Error(`No tienes permisos para ${accion} esta aula.`);
          if (res.status === 409) throw new Error(serverMsg ?? `El aula "${aula.nombre}" tiene conflictos que impiden ${accion}la.`);
          if (res.status >= 500) throw new Error(serverMsg ?? `El servidor tuvo un error al intentar ${accion} el aula. Intenta de nuevo.`);
          throw new Error(serverMsg ?? `No se pudo ${accion} el aula (código ${res.status}).`);
        }

        await onRefresh();
        addToast(
          aula.activo ? 'warning' : 'success',
          aula.activo ? 'Aula suspendida' : 'Aula activada',
          `"${aula.nombre}" fue ${aula.activo ? 'suspendida' : 'activada'} exitosamente`
        );
      } catch (e: any) {
        addToast(
          'error',
          `No se pudo ${accion} el aula`,
          e instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            : e.message
        );
      }
    },
    [onRefresh, addToast]
  );

  const handleDelete = useCallback((id: string | undefined, aulaName?: string) => {
    if (!id) return;
    setConfirm({
      open: true,
      id,
      msg: `¿Deseas eliminar permanentemente el aula "${aulaName ?? id}"?`,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    const { id, msg } = confirm;
    const aulaName = msg.split('"')[1] ?? id;
    setConfirm({ open: false, msg: '' });

    if (!id) return;

    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const serverMsg = typeof err?.detail === 'string' ? err.detail : null;
        if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        if (res.status === 403) throw new Error('No tienes permisos para eliminar esta aula.');
        if (res.status === 409) throw new Error(serverMsg ?? `El aula "${aulaName}" no se puede eliminar porque está siendo usada en horarios activos. Sustítuyela primero.`);
        if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un error al eliminar el aula. Intenta de nuevo más tarde.');
        throw new Error(serverMsg ?? `No se pudo eliminar el aula (código ${res.status}).`);
      }

      await onRefresh();
      addToast('info', 'Aula eliminada', `"${aulaName}" fue eliminada exitosamente`);
    } catch (e: any) {
      addToast(
        'error',
        'No se pudo eliminar el aula',
        e instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : e.message
      );
    }
  }, [confirm, onRefresh, addToast]);

  const cancelDelete = useCallback(() => {
    setConfirm({ open: false, msg: '' });
  }, []);

  return {
    toasts,
    removeToast,
    addToast,
    confirm,
    handleToggleActivo,
    handleDelete,
    confirmDelete,
    cancelDelete,
  };
}
