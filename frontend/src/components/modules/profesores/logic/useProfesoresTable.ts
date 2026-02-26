import { useState, useEffect, useCallback } from 'react';
import type { Docente } from './types';
import { API_CONFIG } from '../../../../services/config';

const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCENTES}`;

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

export function useProfesoresTable() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocentes = useCallback(async () => {
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
        if (res.status === 403) throw new Error('No tienes permisos para ver los docentes.');
        if (res.status >= 500) throw new Error(serverMsg ?? 'El servidor tuvo un problema al obtener los docentes. Intenta de nuevo más tarde.');
        throw new Error(serverMsg ?? `No se pudieron cargar los docentes (código ${res.status}).`);
      }
      const data = await res.json();
      setDocentes(data.docentes ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(
        e instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : (e.message ?? 'Ocurrió un error inesperado al cargar los docentes.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocentes();
  }, [fetchDocentes]);

  const filtered = docentes.filter((d) => {
    const term = searchTerm.toLowerCase();
    const nombre = `${d.user?.nombre ?? ''} ${d.user?.apellido ?? ''}`.toLowerCase();
    return (
      d.codigo_docente.toLowerCase().includes(term) ||
      (d.departamento ?? '').toLowerCase().includes(term) ||
      nombre.includes(term) ||
      (d.user?.email ?? '').toLowerCase().includes(term)
    );
  });

  return {
    docentes,
    total,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filtered,
    fetchDocentes,
  };
}
