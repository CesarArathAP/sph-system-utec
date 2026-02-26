/**
 * Hook para verificar el estado de requisitos iniciales para generar horarios
 */

import { useEffect, useState } from 'react';
import { API_CONFIG } from '../../../../services/config';

const BASE = API_CONFIG.BASE_URL;
const getToken = () => localStorage.getItem('auth_token') ?? '';

async function checkModuleData(endpoint: string): Promise<number> {
  try {
    const response = await fetch(`${BASE}${endpoint}?page=1&page_size=1`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) return 0;
    const data = await response.json();
    return data?.total || data?.length || 0;
  } catch {
    return 0;
  }
}

export interface SetupStatus {
  materias: { count: number; label: string; icon: string };
  docentes: { count: number; label: string; icon: string };
  aulas: { count: number; label: string; icon: string };
  grupos: { count: number; label: string; icon: string };
  asignaciones: { count: number; label: string; icon: string };
  isReady: boolean;
  missingModules: string[];
}

export function useScheduleSetupStatus() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      const [materias, docentes, aulas, grupos, asignaciones] = await Promise.all([
        checkModuleData('/materias'),
        checkModuleData('/docentes'),
        checkModuleData('/aulas'),
        checkModuleData('/grupos'),
        checkModuleData('/asignaciones'),
      ]);

      const missing: string[] = [];
      if (materias === 0) missing.push('Materias');
      if (docentes === 0) missing.push('Docentes');
      if (aulas === 0) missing.push('Aulas');
      if (grupos === 0) missing.push('Grupos');
      if (asignaciones === 0) missing.push('Asignaciones');

      const statusData: SetupStatus = {
        materias: { count: materias, label: 'Materias', icon: 'BookOpen' },
        docentes: { count: docentes, label: 'Docentes', icon: 'GraduationCap' },
        aulas: { count: aulas, label: 'Aulas', icon: 'Building2' },
        grupos: { count: grupos, label: 'Grupos', icon: 'Users' },
        asignaciones: { count: asignaciones, label: 'Asignaciones', icon: 'Layers' },
        isReady: missing.length === 0,
        missingModules: missing,
      };

      setStatus(statusData);
      setLoading(false);
    };

    checkSetup();
  }, []);

  return { status, loading };
}
