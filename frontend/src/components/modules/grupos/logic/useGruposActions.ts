import { useState, useCallback } from 'react';
import type { Grupo, Toast } from './types';
import { toBackend } from './useGruposTable';
import { API_CONFIG } from '../../../../services/config';

const BASE = `${API_CONFIG.BASE_URL}/grupos`;

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

export function useGruposActions(onAfterAction: () => void) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message = '') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSave = useCallback(
    async (grupo: Grupo, selectedGrupo: Grupo | null) => {
      const isNew = !selectedGrupo?.id;
      try {
        const method = isNew ? 'POST' : 'PUT';
        const url = isNew ? BASE : `${BASE}/${selectedGrupo!.id}`;
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(toBackend(grupo)),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        onAfterAction();
        addToast(
          'success',
          isNew ? 'Grupo creado' : 'Grupo actualizado',
          isNew
            ? `"${grupo.nombre}" fue registrado exitosamente`
            : `"${grupo.nombre}" fue actualizado`
        );
      } catch (e: any) {
        addToast('error', 'No se pudo guardar', e.message);
      }
    },
    [onAfterAction, addToast]
  );

  const handleToggleActivo = useCallback(
    async (grupo: Grupo) => {
      try {
        const res = await fetch(`${BASE}/${grupo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(toBackend({ ...grupo, activo: !grupo.activo })),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        onAfterAction();
        addToast(
          grupo.activo ? 'warning' : 'success',
          grupo.activo ? 'Grupo suspendido' : 'Grupo activado',
          `"${grupo.nombre}" fue ${grupo.activo ? 'suspendido' : 'activado'}`
        );
      } catch (e: any) {
        addToast('error', 'No se pudo actualizar', e.message);
      }
    },
    [onAfterAction, addToast]
  );

  const handleDelete = useCallback(async (id: string | undefined) => {
    if (!id) return;
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      onAfterAction();
      addToast('info', 'Grupo eliminado', `El grupo fue eliminado correctamente`);
    } catch (e: any) {
      addToast('error', 'No se pudo eliminar', e.message);
    }
  }, [onAfterAction, addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    handleSave,
    handleToggleActivo,
    handleDelete,
  };
}
