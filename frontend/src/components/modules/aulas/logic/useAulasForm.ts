/**
 * Custom hook para gestionar el formulario de aulas
 * Maneja estado del formulario y envío
 */

import { useState, useEffect } from 'react';
import type { Aula } from './types';

const EMPTY_FORM: Aula = {
  codigo: '',
  nombre: '',
  capacidad: 0,
  tipo: '',
  edificio: '',
  piso: null,
  equipamiento: '',
  activo: true,
};

function toBackend(a: Aula) {
  return {
    codigo_aula: a.codigo,
    nombre: a.nombre,
    capacidad: a.capacidad || 1,
    tipo: a.tipo,
    edificio: a.edificio || null,
    piso: a.piso && a.piso > 0 ? a.piso : null,
    equipamiento: a.equipamiento || null,
    activo: a.activo,
  };
}

export function useAulasForm(isOpen: boolean, aula: Aula | null) {
  const [formData, setFormData] = useState<Aula>(EMPTY_FORM);

  useEffect(() => {
    setFormData(aula ?? EMPTY_FORM);
  }, [aula, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;

    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'piso'
          ? value === '' || value === '0'
            ? null
            : parseInt(value as string)
          : name === 'capacidad'
            ? parseInt(value as string) || 1
            : value,
    }));
  };

  const isEditing = !!aula?.id;

  const resetForm = () => {
    setFormData(EMPTY_FORM);
  };

  return {
    formData,
    setFormData,
    isEditing,
    handleChange,
    resetForm,
    toBackend,
  };
}
