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

        if (rG.status === 401 || rM.status === 401 || rD.status === 401) {
          setError('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          return;
        }

        const dg = rG.ok ? await rG.json() : {};
        const dm = rM.ok ? await rM.json() : {};
        const dd = rD.ok ? await rD.json() : {};

        if (!rG.ok) setError('No se pudieron cargar los grupos activos. Intenta refrescar la página.');
        else if (!rM.ok) setError('No se pudieron cargar las materias activas. Intenta refrescar la página.');
        else if (!rD.ok) setError('No se pudieron cargar los docentes activos. Intenta refrescar la página.');

        setGrupos(dg.grupos ?? []);
        setMaterias(dm.materias ?? []);
        setDocentes(dd.docentes ?? []);
      } catch {
        setError('No se pudo conectar con el servidor al cargar los datos. Verifica tu conexión a internet.');
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
      setError('Debes seleccionar un grupo, una materia y un docente para continuar.');
      return;
    }

    if (!form.ciclo_escolar.trim()) {
      setError('El ciclo escolar es obligatorio. Ingresa un valor como "2026-1".');
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
        const serverMsg = typeof err?.detail === 'string' ? err.detail : null;
        if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        if (res.status === 403) throw new Error('No tienes permisos para realizar esta acción.');
        if (res.status === 409) throw new Error(serverMsg ?? 'Ya existe una asignación con la misma combinación de grupo, materia y ciclo escolar.');
        if (res.status === 422) throw new Error(serverMsg ?? 'Algunos datos son inválidos. Revisa el formulario e intenta de nuevo.');
        if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un error al guardar. Intenta de nuevo más tarde.');
        throw new Error(serverMsg ?? `No se pudo guardar la asignación (código ${res.status}).`);
      }

      onSaved();
    } catch (e: any) {
      setError(
        e instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : (e.message ?? 'Ocurrió un error inesperado al guardar.')
      );
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
