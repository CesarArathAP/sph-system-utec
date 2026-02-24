import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X, RefreshCw, Calendar, Clock, BookOpen,
  Users, Building2, GraduationCap,
} from 'lucide-react';
import { API_CONFIG } from '../../../services/config';
import type { Docente } from './ProfesoresLayout';

/* ─── Tipos ─────────────────────────────────────────────────── */
interface Horario {
  id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_sesion: string;
  activo: boolean;
  asignacion?: {
    id: number;
    ciclo_escolar: string;
    materia?: { nombre: string; codigo: string };
    grupo?:   { nombre: string; codigo_grupo: string };
    docente?: { codigo_docente: string };
  };
  aula?: { nombre: string; codigo_aula: string };
}

interface DocenteHorarioModalProps {
  isOpen:  boolean;
  docente: Docente | null;
  onClose: () => void;
}

/* ─── Constantes ────────────────────────────────────────────── */
const DIAS_ORDEN = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIAS_LABEL: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb',
};

/* colores para las tarjetas de sesión (sobre fondo oscuro) */
const TIPO_CARD: Record<string, string> = {
  teorica:     'bg-blue-500/20   border-blue-400/30   text-blue-100',
  practica:    'bg-emerald-500/20 border-emerald-400/30 text-emerald-100',
  laboratorio: 'bg-violet-500/20  border-violet-400/30  text-violet-100',
};
const TIPO_BADGE: Record<string, string> = {
  teorica:     'bg-blue-400/20   text-blue-300',
  practica:    'bg-emerald-400/20 text-emerald-300',
  laboratorio: 'bg-violet-400/20  text-violet-300',
};

const BASE = API_CONFIG.BASE_URL;
function getToken() { return localStorage.getItem('auth_token') ?? ''; }

/* ─── Fetch ─────────────────────────────────────────────────── */
async function fetchHorariosDocente(docenteId: number): Promise<Horario[]> {
  const asigRes = await fetch(
    `${BASE}/asignaciones?docente_id=${docenteId}&page=1&page_size=100`,
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  if (!asigRes.ok) throw new Error(`Error fetching asignaciones: ${asigRes.status}`);
  const asigData = await asigRes.json();
  const asignaciones: { id: number }[] = asigData.asignaciones ?? [];
  if (asignaciones.length === 0) return [];

  const results = await Promise.all(
    asignaciones.map(async a => {
      const r = await fetch(
        `${BASE}/horarios?asignacion_id=${a.id}&page=1&page_size=50&activo=true`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!r.ok) return [];
      const d = await r.json();
      return (d.horarios ?? []) as Horario[];
    })
  );
  return results.flat();
}

/* ─── Componente ────────────────────────────────────────────── */
export default function DocenteHorarioModal({ isOpen, docente, onClose }: DocenteHorarioModalProps) {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !docente?.id) return;
    setLoading(true); setError(null); setHorarios([]);
    fetchHorariosDocente(docente.id)
      .then(setHorarios)
      .catch(e => setError(e.message ?? 'Error al cargar horarios'))
      .finally(() => setLoading(false));
  }, [isOpen, docente?.id]);

  /* Agrupar por día */
  const porDia: Record<string, Horario[]> = {};
  DIAS_ORDEN.forEach(d => { porDia[d] = []; });
  horarios.forEach(h => {
    const dia = h.dia_semana?.toLowerCase();
    if (porDia[dia]) {
      porDia[dia].push(h);
      porDia[dia].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }
  });

  const tieneHorarios  = horarios.length > 0;
  const nombreDocente  = docente?.user
    ? `${docente.user.nombre} ${docente.user.apellido}`
    : docente?.codigo_docente ?? 'Docente';
  const horasTotales   = horarios.reduce((acc, h) => {
    const [hi, mi] = h.hora_inicio.split(':').map(Number);
    const [hf, mf] = h.hora_fin.split(':').map(Number);
    return acc + ((hf * 60 + mf) - (hi * 60 + mi)) / 60;
  }, 0);
  const maxHoras = docente?.horas_maximas_semana ?? 0;
  const pct      = maxHoras ? Math.min((horasTotales / maxHoras) * 100, 100) : 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col
                     rounded-2xl shadow-2xl focus:outline-none
                     bg-[linear-gradient(145deg,#081d54f2,#0d3494f2)]
                     backdrop-blur-xl border border-white/20"
          onEscapeKeyDown={onClose}
        >
          {/* ── Header ── */}
          <div className="px-6 py-4 border-b border-white/15 flex items-center justify-between
                          bg-[linear-gradient(135deg,#0a2a6e,#0d3494)] rounded-t-2xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 border border-white/25">
                <GraduationCap size={18} className="text-white" />
              </div>
              <div>
                <Dialog.Title className="text-white font-bold text-base leading-tight">{nombreDocente}</Dialog.Title>
                <p className="text-blue-200 text-xs mt-0.5">
                  {docente?.codigo_docente} · {docente?.departamento ?? 'Sin departamento'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!loading && tieneHorarios && (
                <div className="text-right">
                  <p className="text-white font-bold text-lg leading-none">
                    {horasTotales.toFixed(1)}<span className="text-white/50 text-sm font-normal">h/{maxHoras}h</span>
                  </p>
                  <div className="w-24 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              <Dialog.Close onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">

            {/* Información del Docente */}
            {!loading && docente && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tarjeta 1: Datos Personales */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-3">
                  <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider">Datos Personales</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide font-semibold mb-1">Nombre completo</p>
                      <p className="text-white font-semibold text-sm">
                        {docente.user?.nombre} {docente.user?.apellido}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide font-semibold mb-1">Código docente</p>
                      <p className="text-blue-300 font-mono text-sm">{docente.codigo_docente}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide font-semibold mb-1">Departamento</p>
                      <p className="text-white/80 text-sm">{docente.departamento ?? 'Sin asignar'}</p>
                    </div>
                    {docente.user?.email && (
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wide font-semibold mb-1">Email</p>
                        <p className="text-blue-200 text-sm break-all">{docente.user.email}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-white/50 text-xs uppercase tracking-wide font-semibold mb-2">Estado</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full transition-all ${docente.activo ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-red-400 shadow-lg shadow-red-500/50'}`}></span>
                        <span className={`text-sm font-semibold ${docente.activo ? 'text-emerald-300' : 'text-red-300'}`}>
                          {docente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta 2: Carga Horaria */}
                {tieneHorarios && (
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-xl p-4 space-y-4">
                    <h3 className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Carga Horaria</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-emerald-100 text-sm font-semibold">Horas por semana</p>
                          <p className="text-emerald-300 font-bold text-lg">
                            {horasTotales.toFixed(1)}h
                            <span className="text-emerald-200/60 text-xs font-normal ml-1">/ {maxHoras}h</span>
                          </p>
                        </div>
                        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden border border-emerald-400/20">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/50" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-400/20">
                        <p className="text-emerald-200 text-xs">
                          {pct >= 100 ? '✓ Carga completa' : `${(100 - pct).toFixed(0)}% disponible`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tarjeta Si no tiene horarios */}
                {!tieneHorarios && !error && (
                  <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 space-y-3">
                    <h3 className="text-amber-100 text-xs font-bold uppercase tracking-wider">Estado</h3>
                    <p className="text-amber-100 text-sm">
                      Sin horarios asignados aún
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Separador visual */}
            {!loading && docente && tieneHorarios && (
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-4">Horarios de la semana</h3>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <RefreshCw size={28} className="animate-spin text-blue-400" />
                <p className="text-white/50 text-sm">Cargando horario…</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Sin horarios */}
            {!loading && !error && !tieneHorarios && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Calendar size={32} className="text-white/20" />
                </div>
                <div>
                  <p className="text-white/70 font-semibold">Sin horarios asignados</p>
                  <p className="text-white/35 text-xs mt-1 max-w-xs">
                    Agrega horarios desde el módulo de Asignaciones.
                  </p>
                </div>
              </div>
            )}

            {/* Grid de días */}
            {!loading && !error && tieneHorarios && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {DIAS_ORDEN.map(dia => {
                  const sesiones = porDia[dia];
                  const tieneS   = sesiones.length > 0;
                  return (
                    <div key={dia} className="flex flex-col gap-2">
                      {/* Cabecera día */}
                      <div className={`text-center py-2 px-1 rounded-xl text-xs font-bold uppercase tracking-wider
                        ${tieneS
                          ? 'bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)] text-white shadow-[0_2px_12px_rgba(15,63,196,0.35)]'
                          : 'bg-white/5 text-white/25 border border-white/10'}`}>
                        {DIAS_LABEL[dia]}
                        {tieneS && (
                          <span className="block text-[10px] font-normal text-blue-200 mt-0.5">
                            {sesiones.length} sesión{sesiones.length !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>

                      {/* Sesiones */}
                      {sesiones.length === 0 ? (
                        <div className="flex-1 border border-dashed border-white/10 rounded-xl flex items-center justify-center min-h-[80px]">
                          <span className="text-xs text-white/20">Libre</span>
                        </div>
                      ) : (
                        sesiones.map(h => {
                          const cardCls  = TIPO_CARD[h.tipo_sesion]  ?? 'bg-white/10 border-white/15 text-white/70';
                          const badgeCls = TIPO_BADGE[h.tipo_sesion] ?? 'bg-white/10 text-white/50';
                          return (
                            <div key={h.id} className={`border rounded-xl p-3 space-y-1.5 ${cardCls}`}>
                              {/* Hora */}
                              <div className="flex items-center gap-1 text-xs font-bold">
                                <Clock size={10} className="shrink-0 opacity-70" />
                                {h.hora_inicio.slice(0, 5)} – {h.hora_fin.slice(0, 5)}
                              </div>
                              {/* Materia */}
                              {h.asignacion?.materia && (
                                <div className="flex items-start gap-1 text-[11px] leading-tight">
                                  <BookOpen size={9} className="shrink-0 mt-0.5 opacity-70" />
                                  <span className="font-semibold line-clamp-2">{h.asignacion.materia.nombre}</span>
                                </div>
                              )}
                              {/* Grupo */}
                              {h.asignacion?.grupo && (
                                <div className="flex items-center gap-1 text-[11px] opacity-80">
                                  <Users size={9} className="shrink-0" />
                                  <span>{h.asignacion.grupo.nombre}</span>
                                </div>
                              )}
                              {/* Aula */}
                              {h.aula && (
                                <div className="flex items-center gap-1 text-[11px] opacity-80">
                                  <Building2 size={9} className="shrink-0" />
                                  <span>{h.aula.codigo_aula}</span>
                                </div>
                              )}
                              {/* Badge tipo */}
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeCls}`}>
                                {h.tipo_sesion}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          {!loading && tieneHorarios && (
            <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between
                            bg-white/5 rounded-b-2xl shrink-0">
              <div className="flex gap-3">
                {Object.entries(TIPO_BADGE).map(([tipo, cls]) => (
                  <span key={tipo} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${cls}`}>
                    {tipo}
                  </span>
                ))}
              </div>
              <p className="text-white/30 text-xs">{horarios.length} sesiones en total</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
