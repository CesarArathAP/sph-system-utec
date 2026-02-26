/**
 * Custom hook para gestionar la creación manual de horarios
 * Incluye validación, manejo de errores, y feedback con Toast
 */

import { useState } from 'react';
import { API_CONFIG } from '../../../../services/config';
import { useToast } from '../../../common/Toast';
import type { ManualFormState, AsignacionOption, DisponibilidadError, HorasMaxError } from './types';
import type { Docente } from '../../profesores/ProfesoresLayout';
import { EMPTY_FORM } from './constants';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = API_CONFIG.BASE_URL;

export function useManualSchedule(onSaved?: () => void, onClose?: () => void) {
  const { addToast } = useToast();
  const [form, setForm] = useState<ManualFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errorManual, setErrorManual] = useState<string | null>(null);
  const [disponibilidadError, setDisponibilidadError] = useState<DisponibilidadError | null>(null);
  const [horasMaxError, setHorasMaxError] = useState<HorasMaxError | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación: hora de fin mayor que hora de inicio
    if (form.hora_fin <= form.hora_inicio) {
      const errorMsg = 'La hora de fin debe ser posterior a la hora de inicio. Revisa los campos de horario.';
      setErrorManual(errorMsg);
      addToast({
        type: 'error',
        title: '✗ Horario inválido',
        message: errorMsg,
        duration: 3500,
      });
      return;
    }

    // Validación: campos requeridos
    if (!form.asignacion_id || !form.aula_id) {
      const errorMsg = 'Debes seleccionar una asignación y un aula antes de guardar el horario.';
      setErrorManual(errorMsg);
      addToast({
        type: 'error',
        title: '✗ Campos incompletos',
        message: errorMsg,
        duration: 3500,
      });
      return;
    }

    setSaving(true);
    setErrorManual(null);
    setDisponibilidadError(null);
    setHorasMaxError(null);

    try {
      const res = await fetch(`${BASE}/horarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...form,
          hora_inicio: `${form.hora_inicio}:00`,
          hora_fin: `${form.hora_fin}:00`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const detail = err?.detail;

        if (detail && typeof detail === 'object' && detail.mensaje) {
          setErrorManual(detail.mensaje);
          addToast({
            type: 'error',
            title: '✗ No se pudo crear el horario',
            message: detail.mensaje,
            duration: 5000,
          });

          if (detail.disponibilidad_docente) {
            setDisponibilidadError(detail.disponibilidad_docente);
          }
          if (detail.horas_maximas) {
            setHorasMaxError(detail.horas_maximas);
          }
          return;
        }

        // Mensajes según código HTTP
        const serverMsg = typeof detail === 'string' ? detail : null;
        if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        if (res.status === 403) throw new Error('No tienes permisos para crear horarios.');
        if (res.status === 409) throw new Error(serverMsg ?? 'El aula o el docente ya tiene un horario en ese intervalo. Elige otro horario o aula.');
        if (res.status === 422) throw new Error(serverMsg ?? 'Los datos del horario son inválidos. Revisa los campos e intenta de nuevo.');
        if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un error al crear el horario. Intenta de nuevo más tarde.');
        throw new Error(serverMsg ?? `No se pudo crear el horario (código ${res.status}).`);
      }

      addToast({
        type: 'success',
        title: '✓ Horario creado',
        message: 'El horario se creó y quedó registrado correctamente.',
        duration: 3000,
      });

      onSaved?.();
      onClose?.();
      setForm(EMPTY_FORM);
    } catch (e: any) {
      const errorMsg =
        e instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : (e.message ?? 'Ocurrió un error inesperado al crear el horario.');
      setErrorManual(errorMsg);
      addToast({
        type: 'error',
        title: '✗ Error al crear el horario',
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrorManual(null);
    setDisponibilidadError(null);
    setHorasMaxError(null);
  };

  return {
    form,
    setForm,
    saving,
    errorManual,
    disponibilidadError,
    horasMaxError,
    handleManualSubmit,
    resetForm,
  };
}
