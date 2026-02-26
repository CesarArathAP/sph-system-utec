/**
 * Hook para manejar la lógica del grid de horarios
 */

import { useMemo } from 'react';
import { DAYS, HOURS } from './constants';
import type { HorarioResponse, GridCell } from './types';

export function useScheduleGrid(horariosFiltrados: HorarioResponse[], filterDia: string) {
  function timeToHour(t: string): number {
    return parseInt(t.split(':')[0], 10);
  }

  const gridData = useMemo(() => {
    // Construcción del Grid Map con rowSpan
    interface MapType {
      [key: string]: Map<number, GridCell[]>;
    }
    const gridMap: MapType = {};
    DAYS.forEach(({ value }) => {
      gridMap[value] = new Map();
    });

    // Rastreamos qué celdas están bloqueadas
    interface BlockMapType {
      [key: string]: Map<number, Set<number>>;
    }
    const blocked: BlockMapType = {};
    DAYS.forEach(({ value }) => {
      blocked[value] = new Map();
    });

    horariosFiltrados
      .filter((h) => h.activo)
      .forEach((h) => {
        const dayMap = gridMap[h.dia_semana];
        const blockMap = blocked[h.dia_semana];
        const startH = timeToHour(h.hora_inicio);
        const endH = timeToHour(h.hora_fin);
        const span = Math.max(1, endH - startH);

        // Registrar la celda de inicio (rowSpan real)
        if (!dayMap.has(startH)) dayMap.set(startH, []);
        dayMap.get(startH)!.push({ horario: h, rowSpan: span, isStart: true });

        // Marcar las horas siguientes como bloqueadas
        for (let hh = startH + 1; hh < endH; hh++) {
          if (!blockMap.has(hh)) blockMap.set(hh, new Set());
          blockMap.get(hh)!.add(h.id);
        }
      });

    return { gridMap, blocked };
  }, [horariosFiltrados]);

  return {
    ...gridData,
    HOURS,
    DAYS,
    filterDia,
  };
}
