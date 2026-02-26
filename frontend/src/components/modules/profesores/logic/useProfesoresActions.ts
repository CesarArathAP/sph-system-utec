import { useState, useCallback } from 'react';
import type { Docente, Toast } from './types';
import { API_CONFIG } from '../../../../services/config';

const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCENTES}`;

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

export function useProfesoresActions(onAfterAction: () => void) {
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
    async (docente: Docente, selectedDocente: Docente | null) => {
      const isNew = !selectedDocente?.id;
      const accion = isNew ? 'registrar' : 'actualizar';
      try {
        const method = isNew ? 'POST' : 'PUT';
        const url = isNew ? BASE : `${BASE}/${selectedDocente!.id}`;
        const body = isNew
          ? {
              user_id: docente.user_id,
              codigo_docente: docente.codigo_docente,
              departamento: docente.departamento,
              horas_maximas_semana: docente.horas_maximas_semana,
              disponibilidades: [],
            }
          : {
              codigo_docente: docente.codigo_docente,
              departamento: docente.departamento,
              horas_maximas_semana: docente.horas_maximas_semana,
              activo: docente.activo,
            };

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const serverMsg = typeof errData.detail === 'string' ? errData.detail : null;
          if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          if (res.status === 403) throw new Error(`No tienes permisos para ${accion} docentes.`);
          if (res.status === 409) throw new Error(serverMsg ?? (isNew
            ? `Ya existe un docente con el código "${docente.codigo_docente}" o el usuario seleccionado ya está vinculado a otro docente.`
            : `El código "${docente.codigo_docente}" ya está en uso por otro docente.`));
          if (res.status === 422) throw new Error(serverMsg ?? 'Algunos datos son inválidos. Revisa el formulario e intenta de nuevo.');
          if (res.status >= 500) throw new Error(serverMsg ?? `El servidor tuvo un error al ${accion} el docente. Intenta de nuevo más tarde.`);
          throw new Error(serverMsg ?? `No se pudo ${accion} el docente (código ${res.status}).`);
        }
        onAfterAction();
        const nombre = docente.user
          ? `${docente.user.nombre} ${docente.user.apellido}`
          : docente.codigo_docente;
        addToast(
          'success',
          isNew ? 'Docente registrado' : 'Docente actualizado',
          isNew
            ? `"${nombre}" fue registrado exitosamente`
            : `"${nombre}" fue actualizado exitosamente`
        );
      } catch (e: any) {
        addToast(
          'error',
          isNew ? 'No se pudo registrar el docente' : 'No se pudo actualizar el docente',
          e instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            : e.message
        );
      }
    },
    [onAfterAction, addToast]
  );

  const handleToggleActivo = useCallback(
    async (docente: Docente) => {
      if (!docente.id) return;
      const accion = docente.activo ? 'suspender' : 'activar';
      const nombre = docente.user
        ? `${docente.user.nombre} ${docente.user.apellido}`
        : docente.codigo_docente;
      try {
        const res = await fetch(`${BASE}/${docente.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ activo: !docente.activo }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const serverMsg = typeof err.detail === 'string' ? err.detail : null;
          if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          if (res.status === 403) throw new Error(`No tienes permisos para ${accion} este docente.`);
          if (res.status === 409) throw new Error(serverMsg ?? `El docente "${nombre}" tiene horarios activos asignados que impiden ${accion}lo.`);
          if (res.status >= 500) throw new Error(serverMsg ?? `El servidor tuvo un error al intentar ${accion} el docente. Intenta de nuevo.`);
          throw new Error(serverMsg ?? `No se pudo ${accion} el docente (código ${res.status}).`);
        }
        onAfterAction();
        addToast(
          docente.activo ? 'warning' : 'success',
          docente.activo ? 'Docente suspendido' : 'Docente activado',
          `"${nombre}" fue ${docente.activo ? 'suspendido' : 'activado'} exitosamente`
        );
      } catch (e: any) {
        addToast(
          'error',
          `No se pudo ${accion} el docente`,
          e instanceof TypeError
            ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            : e.message
        );
      }
    },
    [onAfterAction, addToast]
  );

  const handleDelete = useCallback(
    async (id: number | undefined, docenteName?: string) => {
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
          if (res.status === 403) throw new Error('No tienes permisos para eliminar este docente.');
          if (res.status === 409) throw new Error(serverMsg ?? `El docente "${docenteName ?? id}" no se puede eliminar porque tiene horarios o asignaciones activas. Elimina o reasigna esos registros primero.`);
          if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un error al eliminar el docente. Intenta de nuevo más tarde.');
          throw new Error(serverMsg ?? `No se pudo eliminar el docente (código ${res.status}).`);
        }
        onAfterAction();
        addToast('info', 'Docente eliminado', `"${docenteName ?? id}" fue eliminado exitosamente`);
      } catch (e: any) {
        addToast(
          'error',
          'No se pudo eliminar el docente',
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
    handleToggleActivo,
    handleDelete,
  };
}
