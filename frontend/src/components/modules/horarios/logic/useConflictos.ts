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
      }
    } catch {
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
          title: 'Resuelto',
          message: 'El conflicto ha sido marcado como resuelto.',
          duration: 3000,
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo resolver el conflicto.',
        duration: 3000,
      });
    }
  };

  const clearConflicts = async (todos = false) => {
    const result = confirm(
      todos
        ? '¿Está seguro que desea borrar todo el historial de conflictos?'
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
          title: 'Historial Limpio',
          duration: 3000,
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo limpiar el historial.',
        duration: 3000,
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
