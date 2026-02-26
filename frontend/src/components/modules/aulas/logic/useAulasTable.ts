/**
 * Custom hook para gestionar la tabla de aulas
 * Maneja fetch, búsqueda y filtros
 */

import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../../../../services/config';
import type { Aula } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}/aulas`;

function fromBackend(b: any): Aula {
  return {
    id: String(b.id),
    codigo: b.codigo_aula,
    nombre: b.nombre,
    capacidad: b.capacidad,
    tipo: (b.tipo ?? '').toLowerCase(),
    edificio: b.edificio ?? '',
    piso: b.piso ?? null,
    equipamiento: b.equipamiento ?? '',
    activo: b.activo ?? true,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

export function useAulasTable() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAulas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }
      const data = await res.json();
      setAulas((data.aulas ?? []).map(fromBackend));
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar aulas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAulas();
  }, [fetchAulas]);

  const filtered = aulas.filter(a =>
    a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.edificio ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    aulas,
    setAulas,
    filtered,
    total,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    fetchAulas,
  };
}
