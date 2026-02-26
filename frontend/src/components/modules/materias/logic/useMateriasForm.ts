import { useState, useEffect } from 'react';
import type { Materia } from './types';
import { EMPTY_FORM } from './constants';

export function useMateriasForm(materia: Materia | null, isOpen: boolean) {
  const [formData, setFormData] = useState<Materia>(EMPTY_FORM);

  useEffect(() => {
    setFormData(materia ? { ...materia } : { ...EMPTY_FORM });
  }, [materia, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === 'creditos' || name === 'horas_semana') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 1,
      }));
    } else if (name === 'tipo_aula_requerida') {
      setFormData((prev) => ({
        ...prev,
        tipo_aula_requerida: value || null,
      }));
    } else if (name === 'descripcion') {
      setFormData((prev) => ({
        ...prev,
        descripcion: value || null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const isEditing = !!materia?.id;

  return {
    formData,
    setFormData,
    handleChange,
    isEditing,
  };
}
