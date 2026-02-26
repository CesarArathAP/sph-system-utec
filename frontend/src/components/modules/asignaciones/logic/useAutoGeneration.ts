/**
 * Custom hook para gestionar la generación automática de horarios
 * Incluye validación, manejo de errores, y feedback con Toast
 */

import { useState } from 'react';
import { API_CONFIG } from '../../../../services/config';
import { useToast } from '../../../common/Toast';
import type { GenerateResult } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = API_CONFIG.BASE_URL;

export function useAutoGeneration(onSaved?: () => void) {
  const { addToast } = useToast();
  const [ciclo, setCiclo] = useState('');
  const [clearExisting, setClearExisting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<GenerateResult | null>(null);
  const [errorAuto, setErrorAuto] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ciclo.trim()) {
      setErrorAuto('El ciclo escolar es obligatorio. Ingresa un valor como "2026-1" para continuar.');
      return;
    }

    setGenerating(true);
    setErrorAuto(null);
    setGenResult(null);

    try {
      const params = new URLSearchParams({ ciclo_escolar: ciclo.trim() });
      if (clearExisting) {
        params.set('clear_existing', 'true');
      }

      const res = await fetch(`${BASE}/schedule/generate?${params}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const serverMsg = typeof err?.detail === 'string' ? err.detail : null;
        if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        if (res.status === 403) throw new Error('No tienes permisos para generar horarios.');
        if (res.status === 404) throw new Error(`No se encontraron asignaciones para el ciclo "${ciclo}". Verifica que el ciclo exista y tenga asignaciones registradas.`);
        if (res.status === 422) throw new Error(serverMsg ?? 'No fue posible generar los horarios. Verifica que haya grupos, docentes y aulas activos con disponibilidad definida.');
        if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un error al generar los horarios. Intenta de nuevo más tarde.');
        throw new Error(serverMsg ?? err?.detail ?? `No se pudo generar (código ${res.status}).`);
      }

      const result = await res.json();
      setGenResult(result);

      // Mostrar Toast de éxito o error según las alertas
      if (!result.alertas || result.alertas.length === 0) {
        addToast({
          type: 'success',
          title: '✓ Horarios generados',
          message: `Se crearon ${result.horarios_creados ?? 0} horarios exitosamente para el ciclo "${ciclo}".`,
          duration: 5000,
        });
      } else {
        addToast({
          type: 'error',
          title: '✗ Generación con alertas',
          message: `No se pudieron generar todos los horarios. ${result.alertas[0]?.titulo ?? 'Revisa las alertas para más detalles.'}`,
          duration: 6000,
        });
      }

      onSaved?.();
    } catch (e: any) {
      const errorMsg =
        e instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : (e.message ?? 'Ocurrió un error inesperado al generar los horarios.');
      setErrorAuto(errorMsg);
      addToast({
        type: 'error',
        title: '✗ Error al generar horarios',
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setGenerating(false);
    }
  };

  const resetGeneration = () => {
    setCiclo('');
    setClearExisting(false);
    setGenResult(null);
    setErrorAuto(null);
  };

  return {
    ciclo,
    setCiclo,
    clearExisting,
    setClearExisting,
    generating,
    genResult,
    errorAuto,
    handleGenerate,
    resetGeneration,
  };
}
