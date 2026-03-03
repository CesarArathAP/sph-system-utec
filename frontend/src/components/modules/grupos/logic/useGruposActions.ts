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
      const accion = isNew ? 'crear' : 'actualizar';
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
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const serverMsg = typeof err.detail === 'string' ? err.detail : null;
          if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          if (res.status === 403) throw new Error(`No tienes permisos para ${accion} grupos.`);
          if (res.status === 409) throw new Error(serverMsg ?? `Ya existe un grupo con el código "${grupo.codigo}". Usa un código diferente.`);
          if (res.status === 422) throw new Error(serverMsg ?? 'Algunos campos tienen valores inválidos. Revisa el formulario e intenta de nuevo.');
          if (res.status >= 500) throw new Error(serverMsg ?? `El servidor tuvo un error al ${accion} el grupo. Intenta de nuevo más tarde.`);
          throw new Error(serverMsg ?? `No se pudo ${accion} el grupo (código ${res.status}).`);
        }
        onAfterAction();
        addToast(
          'success',
          isNew ? 'Grupo creado' : 'Grupo actualizado',
          isNew
            ? `"${grupo.nombre}" fue registrado exitosamente`
            : `"${grupo.nombre}" fue actualizado exitosamente`
        );
      } catch (e: any) {
        addToast(
          'error',
          isNew ? 'No se pudo crear el grupo' : 'No se pudo actualizar el grupo',
          e instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            : e.message
        );
      }
    },
    [onAfterAction, addToast]
  );

  const handleToggleActivo = useCallback(
    async (grupo: Grupo) => {
      const accion = grupo.activo ? 'suspender' : 'activar';
      try {
        const res = await fetch(`${BASE}/${grupo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(toBackend({ ...grupo, activo: !grupo.activo })),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const serverMsg = typeof err.detail === 'string' ? err.detail : null;
          if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          if (res.status === 403) throw new Error(`No tienes permisos para ${accion} este grupo.`);
          if (res.status === 409) throw new Error(serverMsg ?? `El grupo "${grupo.nombre}" tiene asignaciones activas que impiden ${accion}lo.`);
          if (res.status >= 500) throw new Error(serverMsg ?? `El servidor tuvo un error al intentar ${accion} el grupo. Intenta de nuevo.`);
          throw new Error(serverMsg ?? `No se pudo ${accion} el grupo (código ${res.status}).`);
        }
        onAfterAction();
        addToast(
          grupo.activo ? 'warning' : 'success',
          grupo.activo ? 'Grupo suspendido' : 'Grupo activado',
          `"${grupo.nombre}" fue ${grupo.activo ? 'suspendido' : 'activado'} exitosamente`
        );
      } catch (e: any) {
        addToast(
          'error',
          `No se pudo ${accion} el grupo`,
          e instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            : e.message
        );
      }
    },
    [onAfterAction, addToast]
  );

  const handleDelete = useCallback(async (id: string | undefined, grupoNombre?: string) => {
    if (!id) return;
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const serverMsg = typeof err.detail === 'string' ? err.detail : null;
        if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        if (res.status === 403) throw new Error('No tienes permisos para eliminar este grupo.');
        if (res.status === 409) throw new Error(serverMsg ?? `El grupo "${grupoNombre ?? id}" no se puede eliminar porque tiene asignaciones activas. Elimina primero las asignaciones correspondientes.`);
        if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un error al eliminar el grupo. Intenta de nuevo más tarde.');
        throw new Error(serverMsg ?? `No se pudo eliminar el grupo (código ${res.status}).`);
      }
      onAfterAction();
      addToast('info', 'Grupo eliminado', `"${grupoNombre ?? id}" fue eliminado exitosamente`);
    } catch (e: any) {
      addToast(
        'error',
        'No se pudo eliminar el grupo',
        e instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : e.message
      );
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
