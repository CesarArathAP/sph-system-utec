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
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setDocentes(data.docentes ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar docentes');
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
