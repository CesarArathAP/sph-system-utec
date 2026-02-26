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
          throw new Error(errData.detail ?? `Error ${res.status}`);
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
            : `"${nombre}" fue actualizado`
        );
      } catch (e: any) {
        addToast('error', 'No se pudo guardar', e.message);
      }
    },
    [onAfterAction, addToast]
  );

  const handleToggleActivo = useCallback(
    async (docente: Docente) => {
      if (!docente.id) return;
      try {
        const res = await fetch(`${BASE}/${docente.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ activo: !docente.activo }),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        onAfterAction();
        const nombre = docente.user
          ? `${docente.user.nombre} ${docente.user.apellido}`
          : docente.codigo_docente;
        addToast(
          docente.activo ? 'warning' : 'success',
          docente.activo ? 'Docente suspendido' : 'Docente activado',
          `"${nombre}" fue ${docente.activo ? 'suspendido' : 'activado'}`
        );
      } catch (e: any) {
        addToast('error', 'No se pudo cambiar el estado', e.message);
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
        if (!res.ok) throw new Error(`Error ${res.status}`);
        onAfterAction();
        addToast('info', 'Docente eliminado', `"${docenteName ?? id}" fue eliminado`);
      } catch (e: any) {
        addToast('error', 'No se pudo eliminar', e.message);
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
