/**
 * Custom hook para gestionar el formulario de asignaciones
 * Maneja carga de opciones (grupos, materias, docentes) y submit del formulario
 */

import { useState, useEffect } from 'react';
import { API_CONFIG } from '../../../../services/config';
import type { Asignacion, AsignacionFormState, GrupoOption, MateriaOption, DocenteOption } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = API_CONFIG.BASE_URL;
const EMPTY = { grupo_id: 0, materia_id: 0, docente_id: 0, ciclo_escolar: '' };

export function useAsignacionesForm(isOpen: boolean, editing: Asignacion | null, onSaved: () => void) {
  const isEdit = !!editing;
  const [form, setForm] = useState<AsignacionFormState>(EMPTY);
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [materias, setMaterias] = useState<MateriaOption[]>([]);
  const [docentes, setDocentes] = useState<DocenteOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load options when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setForm(
      isEdit && editing
        ? {
            grupo_id: editing.grupo_id,
            materia_id: editing.materia_id,
            docente_id: editing.docente_id,
            ciclo_escolar: editing.ciclo_escolar,
          }
        : EMPTY
    );

    const load = async () => {
      setLoadingData(true);
      try {
        const [rG, rM, rD] = await Promise.all([
          fetch(`${BASE}/grupos?page=1&page_size=100&activo=true`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          fetch(`${BASE}/materias?page=1&page_size=100&activo=true`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          fetch(`${BASE}/docentes?page=1&page_size=100&activo=true`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);

        const dg = rG.ok ? await rG.json() : {};
        const dm = rM.ok ? await rM.json() : {};
        const dd = rD.ok ? await rD.json() : {};

        setGrupos(dg.grupos ?? []);
        setMaterias(dm.materias ?? []);
        setDocentes(dd.docentes ?? []);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(p => ({
      ...p,
      [name]: ['grupo_id', 'materia_id', 'docente_id'].includes(name) ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.grupo_id || !form.materia_id || !form.docente_id) {
      setError('Selecciona grupo, materia y docente');
      return;
    }

    if (!form.ciclo_escolar.trim()) {
      setError('El ciclo escolar es requerido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = isEdit ? `${BASE}/asignaciones/${editing!.id}` : `${BASE}/asignaciones`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? `Error ${res.status}`);
      }

      onSaved();
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY);
    setError(null);
  };

  return {
    form,
    setForm,
    grupos,
    materias,
    docentes,
    loadingData,
    saving,
    error,
    isEdit,
    handleChange,
    handleSubmit,
    resetForm,
  };
}
