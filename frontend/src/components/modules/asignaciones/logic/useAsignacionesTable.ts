/**
 * Custom hook para gestionar la tabla de asignaciones
 * Maneja fetch, paginación, búsqueda y filtros
 */

import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../../../../services/config';
import type { Asignacion } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}/asignaciones`;
const PAGE_SIZE = 10;

export function useAsignacionesTable() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCiclo, setFilterCiclo] = useState('');

  const fetchAsignaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      });
      if (filterCiclo.trim()) {
        params.set('ciclo_escolar', filterCiclo.trim());
      }

      const res = await fetch(`${BASE}?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      setAsignaciones(data.asignaciones ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar asignaciones');
    } finally {
      setLoading(false);
    }
  }, [page, filterCiclo]);

  useEffect(() => {
    fetchAsignaciones();
  }, [fetchAsignaciones]);

  const filtered = asignaciones.filter(a => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;

    const materia = a.materia?.nombre ?? '';
    const grupo = a.grupo?.nombre ?? '';
    const codigo = a.grupo?.codigo_grupo ?? '';
    const docente = a.docente?.user
      ? `${a.docente.user.nombre} ${a.docente.user.apellido}`
      : a.docente?.codigo_docente ?? '';

    return (
      materia.toLowerCase().includes(term) ||
      grupo.toLowerCase().includes(term) ||
      codigo.toLowerCase().includes(term) ||
      docente.toLowerCase().includes(term) ||
      a.ciclo_escolar.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    asignaciones,
    setAsignaciones,
    filtered,
    total,
    page,
    setPage,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterCiclo,
    setFilterCiclo,
    totalPages,
    PAGE_SIZE,
    fetchAsignaciones,
  };
}
