/**
 * Hook para manejar fetch de horarios y versiones
 */

import { useState, useCallback } from 'react';
import { API_CONFIG } from '../../../../services/config';
import type { HorarioResponse, HorarioVersion } from './types';

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = API_CONFIG.BASE_URL;

export function useScheduleTable(filterDia: string, refreshKey: number) {
  const [horarios, setHorarios] = useState<HorarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horarioVersiones, setHorarioVersiones] = useState<Record<number, HorarioVersion>>({});

  const fetchHorarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: '1', page_size: '100' });
      if (filterDia) params.set('dia_semana', filterDia);
      const res = await fetch(`${BASE}/horarios?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error de Conexión: ${res.status}`);
      const data = await res.json();
      const rawHorarios = data.horarios ?? [];
      setHorarios(rawHorarios);

      // Obtener versiones
      if (rawHorarios.length > 0) {
        const versionesMap: Record<number, HorarioVersion> = {};
        const slice = rawHorarios.slice(0, 100);

        await Promise.all(
          slice.map(async (h: HorarioResponse) => {
            try {
              const vRes = await fetch(`${BASE}/horarios/${h.id}/versiones?page=1&page_size=100`, {
                headers: { Authorization: `Bearer ${getToken()}` },
              });
              if (vRes.ok) {
                const vData = await vRes.json();
                const allVersions = vData.versiones || [];
                if (allVersions.length > 0) {
                  const maxVersion = Math.max(...allVersions.map((v: any) => v.version_numero));
                  const lastVersion = allVersions.find((v: any) => v.version_numero === maxVersion);

                  let cambioTexto = '';
                  if (lastVersion && lastVersion.estado_anterior) {
                    const cambios = [];
                    const oldState = lastVersion.estado_anterior;
                    const newState = lastVersion.estado_nuevo;
                    if (oldState.hora_inicio !== newState.hora_inicio || oldState.hora_fin !== newState.hora_fin) {
                      cambios.push(`Hora: ${oldState.hora_inicio.slice(0, 5)}→${newState.hora_inicio.slice(0, 5)}`);
                    }
                    if (oldState.aula_id !== newState.aula_id) cambios.push(`Aula`);
                    if (oldState.dia_semana !== newState.dia_semana) cambios.push(`Día`);
                    if (oldState.tipo_sesion !== newState.tipo_sesion) cambios.push(`Tipo`);
                    cambioTexto = cambios.length > 0 ? cambios.join(' | ') : 'Modificado';
                  } else {
                    cambioTexto = 'Creado';
                  }
                  versionesMap[h.id] = { version: maxVersion, cambios: cambioTexto };
                }
              }
            } catch {
              // Silent fail
            }
          })
        );
        setHorarioVersiones(versionesMap);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterDia, refreshKey]);

  return {
    horarios,
    loading,
    error,
    horarioVersiones,
    fetchHorarios,
  };
}
