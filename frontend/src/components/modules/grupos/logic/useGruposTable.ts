import { useState, useCallback, useEffect } from 'react';
import type { Grupo } from './types';
import { API_CONFIG } from '../../../../services/config';

const BASE = `${API_CONFIG.BASE_URL}/grupos`;

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

export function toBackend(g: Grupo) {
  return {
    codigo_grupo: g.codigo,
    nombre: g.nombre,
    carrera: g.carrera,
    semestre: g.semestre,
    turno: g.turno,
    num_estudiantes: g.numeroEstudiantes,
    ciclo_escolar: g.cicloEscolar,
    activo: g.activo,
  };
}

export function fromBackend(b: any): Grupo {
  return {
    id: String(b.id),
    codigo: b.codigo_grupo,
    nombre: b.nombre,
    carrera: b.carrera,
    semestre: b.semestre,
    turno: b.turno,
    numeroEstudiantes: b.num_estudiantes,
    cicloEscolar: b.ciclo_escolar,
    activo: b.activo ?? true,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

export function useGruposTable() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchGrupos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setGrupos((data.grupos ?? []).map(fromBackend));
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrupos();
  }, [fetchGrupos]);

  const filtered = grupos.filter(
    (g) =>
      g.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.carrera.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    grupos,
    total,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filtered,
    fetchGrupos,
  };
}
