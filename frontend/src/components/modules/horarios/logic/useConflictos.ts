/**
 * Hook para manejar conflictos de horarios
 */

import { useState, useCallback } from 'react';
import { API_CONFIG } from '../../../../services/config';
import { useToast } from '../../../common/Toast';
import type { ConflictoRegistrado } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = API_CONFIG.BASE_URL;

export function useConflictos() {
  const { addToast } = useToast();
  const [conflictos, setConflictos] = useState<ConflictoRegistrado[]>([]);
  const [loadingConf, setLoadingConf] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchConflictos = useCallback(async () => {
    setLoadingConf(true);
    try {
      const res = await fetch(`${BASE}/horarios/registered-conflicts/list?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConflictos(data.conflictos ?? []);
      } else if (res.status === 401) {
        // Se ignora silenciosamente para no interrumpir la vista principal
        setConflictos([]);
      } else {
        setConflictos([]);
      }
    } catch {
      // Sin conexión: se mantiene lista vacía silenciosamente
      setConflictos([]);
    } finally {
      setLoadingConf(false);
    }
  }, []);

  const resolveConflict = async (id: number) => {
    try {
      const res = await fetch(`${BASE}/horarios/conflicts/${id}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        await fetchConflictos();
        addToast({
          type: 'success',
          title: '✓ Conflicto resuelto',
          message: 'El conflicto ha sido marcado como resuelto exitosamente.',
          duration: 3500,
        });
      } else {
        const err = await res.json().catch(() => null);
        const serverMsg = typeof err?.detail === 'string' ? err.detail : null;
        let msg = 'No se pudo resolver el conflicto.';
        if (res.status === 401) msg = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
        else if (res.status === 403) msg = 'No tienes permisos para resolver este conflicto.';
        else if (res.status === 404) msg = 'El conflicto ya no existe o fue eliminado previamente.';
        else if (res.status >= 500) msg = serverMsg ?? 'El servidor tuvo un error al resolver el conflicto. Intenta de nuevo.';
        else if (serverMsg) msg = serverMsg;
        addToast({ type: 'error', title: '✗ No se pudo resolver', message: msg, duration: 5000 });
      }
    } catch (e) {
      addToast({
        type: 'error',
        title: '✗ Error de conexión',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        duration: 4000,
      });
    }
  };

  const clearConflicts = async (todos = false) => {
    const accion = todos ? 'todo el historial de conflictos' : 'los conflictos resueltos';
    const result = confirm(
      todos
        ? '¿Está seguro que desea borrar todo el historial de conflictos? Esta acción no se puede deshacer.'
        : '¿Está seguro que desea limpiar los conflictos resueltos?'
    );

    if (!result) return;

    setClearing(true);
    try {
      const res = await fetch(`${BASE}/horarios/conflicts/clear${todos ? '?todos=true' : ''}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        await fetchConflictos();
        addToast({
          type: 'success',
          title: '✓ Historial limpiado',
          message: `Se eliminó ${accion} exitosamente.`,
          duration: 3500,
        });
      } else {
        const err = await res.json().catch(() => null);
        const serverMsg = typeof err?.detail === 'string' ? err.detail : null;
        let msg = `No se pudo limpiar ${accion}.`;
        if (res.status === 401) msg = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
        else if (res.status === 403) msg = 'No tienes permisos para limpiar el historial de conflictos.';
        else if (res.status >= 500) msg = serverMsg ?? 'El servidor tuvo un error al limpiar el historial. Intenta de nuevo.';
        else if (serverMsg) msg = serverMsg;
        addToast({ type: 'error', title: '✗ No se pudo limpiar', message: msg, duration: 5000 });
      }
    } catch {
      addToast({
        type: 'error',
        title: '✗ Error de conexión',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        duration: 4000,
      });
    } finally {
      setClearing(false);
    }
  };

  return {
    conflictos,
    loadingConf,
    clearing,
    fetchConflictos,
    resolveConflict,
    clearConflicts,
  };
}
