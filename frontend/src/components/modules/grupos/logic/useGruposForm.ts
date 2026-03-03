import { useState, useEffect } from 'react';
import type { Grupo } from './types';
import { EMPTY_FORM } from './constants';

export function useGruposForm(grupo: Grupo | null, isOpen: boolean) {
  const [formData, setFormData] = useState<Grupo>(EMPTY_FORM);

  useEffect(() => {
    setFormData(grupo ?? EMPTY_FORM);
  }, [grupo, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'semestre' || name === 'numeroEstudiantes'
          ? parseInt(value as string) || 0
          : value,
    }));
  };

  return {
    formData,
    setFormData,
    handleChange,
    isEditing: !!grupo?.id,
  };
}
