/**
 * Custom hook para gestionar el estado del modal de asignaciones
 * Maneja carga de datos (asignaciones y aulas) y estado de las pestañas
 */

import { useState, useEffect } from 'react';
import { API_CONFIG } from '../../../../services/config';
import type { AsignacionOption, AulaOption } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = API_CONFIG.BASE_URL;

export function useAssignmentModal(isOpen: boolean) {
  const [tab, setTab] = useState<'manual' | 'auto'>('auto');
  const [asignaciones, setAsignaciones] = useState<AsignacionOption[]>([]);
  const [aulas, setAulas] = useState<AulaOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showDisponibilidad, setShowDisponibilidad] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [resAsig, resAulas] = await Promise.all([
          fetch(`${BASE}/asignaciones?page=1&page_size=100`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          fetch(`${BASE}/aulas?page=1&page_size=100&activo=true`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);

        const da = resAsig.ok ? await resAsig.json() : { asignaciones: [] };
        const dau = resAulas.ok ? await resAulas.json() : { aulas: [] };

        setAsignaciones(da.asignaciones ?? []);
        setAulas(dau.aulas ?? []);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen]);

  return {
    tab,
    setTab,
    asignaciones,
    aulas,
    loadingData,
    showDisponibilidad,
    setShowDisponibilidad,
  };
}
