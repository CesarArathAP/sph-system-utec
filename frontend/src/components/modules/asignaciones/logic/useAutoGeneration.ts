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
      setErrorAuto('Ingresa el ciclo escolar');
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
        throw new Error(err?.detail ?? `Error ${res.status}`);
      }

      const result = await res.json();
      setGenResult(result);

      // Mostrar Toast de éxito o error según las alertas
      if (!result.alertas || result.alertas.length === 0) {
        addToast({
          type: 'success',
          title: '✓ Horarios generados',
          message: `Se crearon ${result.horarios_creados ?? 0} horarios exitosamente para el ciclo ${ciclo}`,
          duration: 4000,
        });
      } else {
        addToast({
          type: 'error',
          title: '✗ Error en la generación',
          message: `No se pudieron generar los horarios. ${result.alertas[0]?.titulo ?? 'Verifique los datos'}`,
          duration: 5000,
        });
      }

      onSaved?.();
    } catch (e: any) {
      const errorMsg = e.message ?? 'Error al generar horarios';
      setErrorAuto(errorMsg);
      addToast({
        type: 'error',
        title: '✗ Error',
        message: errorMsg,
        duration: 4000,
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
