/**
 * Hook para manejar filtros y datos únicos del horario
 */

import { useState } from 'react';
import type { HorarioResponse } from './types';

export function useScheduleFilters(horarios: HorarioResponse[]) {
  const [filterDia, setFilterDia] = useState<string>('');
  const [cicloInput, setCicloInput] = useState('');
  const [filterDocente, setFilterDocente] = useState('');
  const [filterAula, setFilterAula] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');
  const [filterMateria, setFilterMateria] = useState('');
  const [filterDepartamento, setFilterDepartamento] = useState('');

  // Listas para filtros
  const uniqueDocentes = Array.from(
    new Map(
      horarios
        .filter((h) => h.asignacion?.docente)
        .map((h) => {
          const d = h.asignacion!.docente!;
          return [d.codigo_docente, d.user ? `${d.user.nombre} ${d.user.apellido}` : d.codigo_docente];
        })
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const uniqueAulas = Array.from(
    new Map(horarios.filter((h) => h.aula).map((h) => [h.aula!.codigo_aula, h.aula!.nombre])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const uniqueGrupos = Array.from(
    new Map(
      horarios
        .filter((h) => h.asignacion?.grupo)
        .map((h) => [h.asignacion!.grupo!.codigo_grupo, h.asignacion!.grupo!.nombre])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const uniqueMaterias = Array.from(
    new Map(
      horarios
        .filter((h) => h.asignacion?.materia)
        .map((h) => [h.asignacion!.materia!.codigo_materia, h.asignacion!.materia!.nombre])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const uniqueDepartamentos = Array.from(
    new Set(horarios.map((h) => h.asignacion?.docente?.departamento).filter((d): d is string => !!d))
  ).sort();

  const horariosFiltrados = horarios.filter((h) => {
    if (cicloInput && !h.asignacion?.ciclo_escolar?.toLowerCase().includes(cicloInput.toLowerCase()))
      return false;
    if (filterDocente && h.asignacion?.docente?.codigo_docente !== filterDocente) return false;
    if (filterAula && h.aula?.codigo_aula !== filterAula) return false;
    if (filterGrupo && h.asignacion?.grupo?.codigo_grupo !== filterGrupo) return false;
    if (filterMateria && h.asignacion?.materia?.codigo_materia !== filterMateria) return false;
    if (filterDepartamento && h.asignacion?.docente?.departamento !== filterDepartamento) return false;
    return true;
  });

  const resetFilters = () => {
    setFilterDia('');
    setCicloInput('');
    setFilterDocente('');
    setFilterAula('');
    setFilterGrupo('');
    setFilterMateria('');
    setFilterDepartamento('');
  };

  return {
    filterDia,
    setFilterDia,
    cicloInput,
    setCicloInput,
    filterDocente,
    setFilterDocente,
    filterAula,
    setFilterAula,
    filterGrupo,
    setFilterGrupo,
    filterMateria,
    setFilterMateria,
    filterDepartamento,
    setFilterDepartamento,
    uniqueDocentes,
    uniqueAulas,
    uniqueGrupos,
    uniqueMaterias,
    uniqueDepartamentos,
    horariosFiltrados,
    resetFilters,
  };
}
