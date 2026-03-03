import { useState, useEffect, useCallback } from 'react';
import type { Materia } from './types';
import { API_CONFIG } from '../../../../services/config';

const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIAS}`;

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

export function useMateriasTable() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMaterias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const serverMsg = typeof err?.detail === 'string' ? err.detail : null;
        if (res.status === 401) throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        if (res.status === 403) throw new Error('No tienes permisos para ver las materias.');
        if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un problema al obtener las materias. Intenta de nuevo más tarde.');
        throw new Error(serverMsg ?? `No se pudieron cargar las materias (código ${res.status}).`);
      }
      const data = await res.json();
      setMaterias(data.materias ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(
        e instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : (e.message ?? 'Ocurrió un error inesperado al cargar las materias.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterias();
  }, [fetchMaterias]);

  const filtered = materias.filter(
    (m) =>
      m.codigo_materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    materias,
    total,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filtered,
    fetchMaterias,
  };
}
