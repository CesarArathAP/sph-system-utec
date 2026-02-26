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
      const errorMsg = 'La hora de fin debe ser mayor que la de inicio';
      setErrorManual(errorMsg);
      addToast({
        type: 'error',
        title: '✗ Error en horario',
        message: errorMsg,
        duration: 3000,
      });
      return;
    }

    // Validación: campos requeridos
    if (!form.asignacion_id || !form.aula_id) {
      const errorMsg = 'Debes seleccionar una asignación y un aula';
      setErrorManual(errorMsg);
      addToast({
        type: 'error',
        title: '✗ Campos incompletos',
        message: errorMsg,
        duration: 3000,
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
            title: '✗ No se pudo crear',
            message: detail.mensaje,
            duration: 4000,
          });

          if (detail.disponibilidad_docente) {
            setDisponibilidadError(detail.disponibilidad_docente);
          }
          if (detail.horas_maximas) {
            setHorasMaxError(detail.horas_maximas);
          }
          return;
        }

        throw new Error(typeof detail === 'string' ? detail : `Error ${res.status}`);
      }

      addToast({
        type: 'success',
        title: '✓ Horario creado',
        message: 'El horario se creó correctamente',
        duration: 3000,
      });

      onSaved?.();
      onClose?.();
      setForm(EMPTY_FORM);
    } catch (e: any) {
      const errorMsg = e.message ?? 'Error al crear el horario';
      setErrorManual(errorMsg);
      addToast({
        type: 'error',
        title: '✗ Error',
        message: errorMsg,
        duration: 4000,
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
