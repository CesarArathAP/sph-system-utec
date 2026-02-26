import { useState, useCallback } from 'react';
import type { Materia, Toast } from './types';
import { API_CONFIG } from '../../../../services/config';

const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIAS}`;

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

export function useMateriasActions(onAfterAction: () => void) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', title: string, message = '') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSave = useCallback(
    async (materia: Materia, selectedMateria: Materia | null) => {
      const isNew = !selectedMateria?.id;
      try {
        const method = isNew ? 'POST' : 'PUT';
        const url = isNew ? BASE : `${BASE}/${selectedMateria!.id}`;
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(materia),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail ?? `Error ${res.status}`);
        }
        onAfterAction();
        addToast(
          'success',
          isNew ? 'Materia creada' : 'Materia actualizada',
          isNew
            ? `"${materia.nombre}" fue registrada exitosamente`
            : `"${materia.nombre}" fue actualizada`
        );
      } catch (e: any) {
        addToast('error', 'No se pudo guardar', e.message);
      }
    },
    [onAfterAction, addToast]
  );

  const handleDelete = useCallback(
    async (id: number | undefined, materiaNombre?: string) => {
      if (!id) return;
      try {
        const res = await fetch(`${BASE}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        onAfterAction();
        addToast('info', 'Materia eliminada', `"${materiaNombre ?? id}" fue eliminada`);
      } catch (e: any) {
        addToast('error', 'No se pudo eliminar', e.message);
      }
    },
    [onAfterAction, addToast]
  );

  const handleSuspend = useCallback(
    async (id: number | undefined, materia?: Materia) => {
      if (!id) return;
      try {
        const res = await fetch(`${BASE}/${id}/toggle-activo`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        onAfterAction();
        const newState = materia?.activo ? 'Materia suspendida' : 'Materia reactivada';
        const msg = materia?.activo
          ? `"${materia?.nombre ?? id}" fue suspendida`
          : `"${materia?.nombre ?? id}" fue reactivada`;
        addToast('success', newState, msg);
      } catch (e: any) {
        addToast('error', 'No se pudo actualizar', e.message);
      }
    },
    [onAfterAction, addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    handleSave,
    handleDelete,
    handleSuspend,
  };
}
