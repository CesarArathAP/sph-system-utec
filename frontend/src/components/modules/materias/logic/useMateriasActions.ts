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
      const accion = isNew ? 'crear' : 'actualizar';
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
          const serverMsg = typeof errData.detail === 'string' ? errData.detail : null;
          if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          if (res.status === 403) throw new Error(`No tienes permisos para ${accion} materias.`);
          if (res.status === 409) throw new Error(serverMsg ?? `Ya existe una materia con el código "${materia.codigo_materia}". Usa un código diferente.`);
          if (res.status === 422) throw new Error(serverMsg ?? 'Algunos datos son inválidos. Revisa el formulario e intenta de nuevo.');
          if (res.status >= 500) throw new Error(serverMsg ?? `El servidor tuvo un error al ${accion} la materia. Intenta de nuevo más tarde.`);
          throw new Error(serverMsg ?? `No se pudo ${accion} la materia (código ${res.status}).`);
        }
        onAfterAction();
        addToast(
          'success',
          isNew ? 'Materia creada' : 'Materia actualizada',
          isNew
            ? `"${materia.nombre}" fue registrada exitosamente`
            : `"${materia.nombre}" fue actualizada exitosamente`
        );
      } catch (e: any) {
        addToast(
          'error',
          isNew ? 'No se pudo crear la materia' : 'No se pudo actualizar la materia',
          e instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            : e.message
        );
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
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const serverMsg = typeof errData.detail === 'string' ? errData.detail : null;
          if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          if (res.status === 403) throw new Error('No tienes permisos para eliminar esta materia.');
          if (res.status === 409) throw new Error(serverMsg ?? `La materia "${materiaNombre ?? id}" no se puede eliminar porque está asignada a uno o más grupos. Elimina primero las asignaciones correspondientes.`);
          if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un error al eliminar la materia. Intenta de nuevo más tarde.');
          throw new Error(serverMsg ?? `No se pudo eliminar la materia (código ${res.status}).`);
        }
        onAfterAction();
        addToast('info', 'Materia eliminada', `"${materiaNombre ?? id}" fue eliminada exitosamente`);
      } catch (e: any) {
        addToast(
          'error',
          'No se pudo eliminar la materia',
          e instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            : e.message
        );
      }
    },
    [onAfterAction, addToast]
  );

  const handleSuspend = useCallback(
    async (id: number | undefined, materia?: Materia) => {
      if (!id) return;
      const accion = materia?.activo ? 'suspender' : 'reactivar';
      try {
        const res = await fetch(`${BASE}/${id}/toggle-activo`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const serverMsg = typeof errData.detail === 'string' ? errData.detail : null;
          if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          if (res.status === 403) throw new Error(`No tienes permisos para ${accion} esta materia.`);
          if (res.status === 409) throw new Error(serverMsg ?? `La materia "${materia?.nombre ?? id}" tiene conflictos que impiden ${accion}la. Verifica sus asignaciones activas.`);
          if (res.status >= 500) throw new Error(serverMsg ?? `El servidor tuvo un error al intentar ${accion} la materia. Intenta de nuevo.`);
          throw new Error(serverMsg ?? `No se pudo ${accion} la materia (código ${res.status}).`);
        }
        onAfterAction();
        const newState = materia?.activo ? 'Materia suspendida' : 'Materia reactivada';
        const msg = materia?.activo
          ? `"${materia?.nombre ?? id}" fue suspendida exitosamente`
          : `"${materia?.nombre ?? id}" fue reactivada exitosamente`;
        addToast('success', newState, msg);
      } catch (e: any) {
        addToast(
          'error',
          `No se pudo ${accion} la materia`,
          e instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            : e.message
        );
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
