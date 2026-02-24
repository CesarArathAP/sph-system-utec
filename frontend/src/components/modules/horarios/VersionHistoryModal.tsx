import React, { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronUp, ArrowRight, RotateCcw, Eye, X, User, Calendar, Tag, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import Swal from 'sweetalert2';
import { API_CONFIG } from '../../../services/config';

interface Version {
  id: number;
  horario_id: number;
  version_numero: number;
  tipo_cambio: 'creacion' | 'modificacion' | 'eliminacion' | 'rollback';
  descripcion_cambio: string;
  razon_cambio?: string;
  usuario_nombre?: string;
  estado_anterior?: Record<string, any>;
  estado_nuevo: Record<string, any>;
  created_at: string;
}

interface HorarioVersionHistoryModalProps {
  horarioId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function HorarioVersionHistoryModal({
  horarioId,
  isOpen,
  onClose,
}: HorarioVersionHistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    } else {
      setExpandedVersion(null);
    }
  }, [isOpen, horarioId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/horarios/${horarioId}/versiones?page=1&page_size=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('No se pudieron recuperar las versiones del sistema');
      }

      const data = await response.json();
      setVersions(data.versiones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falla crítica de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getTipoCambioColor = (tipo: string) => {
    switch (tipo) {
      case 'creacion':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      case 'modificacion':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'rollback':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
      case 'eliminacion':
        return 'bg-red-500/20 text-red-400 border-red-500/20';
      default:
        return 'bg-white/5 text-white/40 border-white/5';
    }
  };

  const getTipoCambioLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      creacion: 'Génesis',
      modificacion: 'Edición',
      rollback: 'Reversión',
      eliminacion: 'Supresión',
    };
    return labels[tipo] || tipo.toUpperCase();
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      dia_semana: 'Día',
      hora_inicio: 'Apertura',
      hora_fin: 'Clausura',
      aula_id: 'Aula',
      tipo_sesion: 'Categoría',
      materia_id: 'Cátedra',
      grupo_id: 'Comunidad',
      docente_id: 'Titular',
      ciclo_escolar: 'Ciclo',
    };
    return labels[fieldName] || fieldName;
  };

  const getChangedFields = (oldState: Record<string, any>, newState: Record<string, any>) => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
    
    allKeys.forEach((key) => {
      if (oldState[key] !== newState[key] && !key.includes('updated_at') && !key.includes('created_at')) {
        changes.push({
          field: key,
          oldValue: oldState[key],
          newValue: newState[key],
        });
      }
    });
    
    return changes;
  };

  const handleRollback = async (versionNumero: number) => {
    const result = await Swal.fire({
      title: `¿Restaurar v${versionNumero}?`,
      text: 'El horario actual será reemplazado por esta versión histórica.',
      icon: 'warning',
      showCancelButton: true,
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-[2rem] border border-white/10' }
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/horarios/${horarioId}/rollback`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: JSON.stringify({
              version_numero: versionNumero,
              razon: 'Restauración desde panel de auditoría',
            }),
          }
        );

        if (!response.ok) throw new Error('No se pudo ejecutar la reversión');

        fetchVersions();
        Swal.fire({
            icon: 'success', title: 'Restauración Exitosa', text: `Sistema revertido a la versión ${versionNumero}`,
            background: '#0f172a', color: '#f8fafc', timer: 3000, showConfirmButton: false
        });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Falla en Reversión', text: err instanceof Error ? err.message : 'Error desconocido', background: '#0f172a', color: '#f8fafc' });
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xl z-40 transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-[#0a1532] rounded-[2.5rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="px-8 py-7 bg-white/[0.03] border-b border-white/5 flex items-center justify-between relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500">
                <History size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Registro de Auditoría</h2>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Horario de Control #{horarioId}</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all border border-white/10 active:scale-90">
                <X size={20} strokeWidth={3} />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                   <RotateCcw size={32} className="animate-spin text-blue-500" />
                </div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Recuperando Cronología...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="p-4 bg-red-500/10 rounded-2xl inline-block mb-4">
                   <AlertCircle size={32} className="text-red-500" />
                </div>
                <p className="text-red-400 font-bold uppercase tracking-widest text-xs">{error}</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <div className="p-4 bg-white/5 rounded-full inline-block">
                   <Tag size={32} className="text-white/20" />
                </div>
                <p className="text-white/30 font-black uppercase tracking-widest text-xs">Sin registros históricos detectados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div 
                    key={version.id} 
                    className={`rounded-[1.5rem] border transition-all duration-300 overflow-hidden ${expandedVersion === version.id ? 'bg-white/[0.04] border-white/10' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'}`}
                  >
                    {/* Version Row */}
                    <button
                      onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center font-black text-xs text-blue-400 border border-white/5 group-hover:scale-110 transition-transform shrink-0">
                          v{version.version_numero}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getTipoCambioColor(version.tipo_cambio)}`}>
                                {getTipoCambioLabel(version.tipo_cambio)}
                             </span>
                             <span className="text-[9px] font-black text-white/20 uppercase tracking-widest truncate">
                               {new Date(version.created_at).toLocaleDateString('es-ES')} · {new Date(version.created_at).toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}
                             </span>
                          </div>
                          <p className="text-xs font-bold text-white/80 truncate leading-tight">{version.descripcion_cambio}</p>
                        </div>
                      </div>
                      <div className={`ml-4 p-2 rounded-xl bg-white/5 transition-transform duration-300 ${expandedVersion === version.id ? 'rotate-180 text-white' : 'text-white/20'}`}>
                        <ChevronDown size={16} strokeWidth={3} />
                      </div>
                    </button>

                    {/* Details Expanded */}
                    {expandedVersion === version.id && (
                      <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-300">
                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-3">
                           {version.usuario_nombre && (
                             <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center gap-3">
                                <User size={14} className="text-white/20" />
                                <div className="min-w-0">
                                   <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Operador</p>
                                   <p className="text-[11px] font-bold text-white/80 truncate">{version.usuario_nombre}</p>
                                </div>
                             </div>
                           )}
                           {version.razon_cambio && (
                             <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center gap-3">
                                <AlertCircle size={14} className="text-white/20" />
                                <div className="min-w-0">
                                   <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Justificación</p>
                                   <p className="text-[11px] font-bold text-white/80 truncate">{version.razon_cambio}</p>
                                </div>
                             </div>
                           )}
                        </div>

                        {/* Cambio Visual (Diff) */}
                        {version.tipo_cambio === 'creacion' ? (
                          <div className="space-y-2">
                             <p className="text-[9px] font-black text-emerald-400/50 uppercase tracking-[0.2em] ms-1">Estructura Inicial</p>
                             <div className="grid grid-cols-2 gap-2 bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                                {Object.entries(version.estado_nuevo)
                                  .filter(([key]) => !key.startsWith('id') && !key.includes('at'))
                                  .map(([key, value]) => (
                                    <div key={key} className="min-w-0">
                                      <p className="text-[8px] font-black text-emerald-400/40 uppercase mb-0.5">{getFieldLabel(key)}</p>
                                      <p className="text-[11px] font-bold text-emerald-50">{String(value)}</p>
                                    </div>
                                  ))}
                             </div>
                          </div>
                        ) : version.estado_anterior ? (
                          <div className="space-y-3">
                             <p className="text-[9px] font-black text-blue-400/50 uppercase tracking-[0.2em] ms-1">Diferencial de Cambios</p>
                             <div className="space-y-2">
                                {getChangedFields(version.estado_anterior, version.estado_nuevo).map(({ field, oldValue, newValue }) => (
                                  <div key={field} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                     <div className="min-w-[100px]">
                                        <p className="text-[9px] font-black text-white/40 uppercase">{getFieldLabel(field)}</p>
                                     </div>
                                     <div className="flex-1 flex items-center gap-3 min-w-0 text-[11px] font-mono">
                                        <span className="p-1 px-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 truncate line-through opacity-50">{String(oldValue)}</span>
                                        <ArrowRight size={12} className="text-white/20 shrink-0" />
                                        <span className="p-1 px-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 truncate font-bold">{String(newValue)}</span>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                        ) : null}

                        {/* Footer Action */}
                        {index !== 0 && (
                          <button
                            onClick={() => handleRollback(version.version_numero)}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-2xl border border-amber-500/20 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-amber-500/5"
                          >
                            <RotateCcw size={16} strokeWidth={3} />
                            Restaurar Punto de Control
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Banner */}
          <div className="px-8 py-5 bg-black/20 border-t border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{versions.length} Entradas Auditadas</span>
             </div>
             <button onClick={onClose} className="text-[9px] font-black text-white hover:text-blue-400 transition-colors uppercase tracking-[0.2em]">Cerrar Panel</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
