import React from 'react';
import { X, AlertTriangle, CheckCircle, Eye, RefreshCw, Trash2, Zap } from 'lucide-react';
import Swal from 'sweetalert2';

interface Conflicto {
  id: number;
  horario_id?: number | null;
  tipo_conflicto: string;
  descripcion: string;
  resuelto: boolean;
}

interface ConflictosModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictos: Conflicto[];
  loading: boolean;
  clearing: boolean;
  onRefresh: () => void;
  onResolve: (conflictoId: number) => void;
  onClearResolved: () => void;
  onClearAll: () => void;
  onViewHorario: (horarioId: number) => void;
}

const CONFLICTO_COLORS: Record<string, string> = {
  'solapamiento_docente': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'solapamiento_aula': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  'solapamiento_grupo': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'docente_no_disponible': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'aula_no_disponible': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  'grupo_no_disponible': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
};

export default function ConflictosModal({
  isOpen,
  onClose,
  conflictos,
  loading,
  clearing,
  onRefresh,
  onResolve,
  onClearResolved,
  onClearAll,
  onViewHorario
}: ConflictosModalProps) {
  if (!isOpen) return null;

  const irresueltos = conflictos.filter(c => !c.resuelto);

  const confirmClearAll = () => {
    Swal.fire({
      title: '¿Limpiar todo?',
      text: 'Se eliminarán todos los registros de conflictos permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, limpiar todo',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl border border-white/10 shadow-2xl',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onClearAll();
      }
    });
  };

  const confirmClearResolved = () => {
    Swal.fire({
      title: '¿Limpiar resueltos?',
      text: 'Se eliminarán solo los conflictos marcados como resueltos.',
      icon: 'question',
      showCancelButton: true,
      background: '#0f172a',
      color: '#f8fafc',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl border border-white/10 shadow-2xl',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onClearResolved();
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#0a1532] rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-br from-red-600/90 to-red-800/90 px-8 py-7 flex items-center justify-between shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Conflictos del Sistema</h2>
                <p className="text-xs font-bold text-red-100/60 uppercase tracking-widest mt-1">Detección y Gestión de Colisiones</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white active:scale-90 border border-white/10 relative z-10"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>

          {/* Toolbar */}
          <div className="border-b border-white/5 px-8 py-5 flex items-center justify-between bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={onRefresh}
                disabled={loading || clearing}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all disabled:opacity-30 text-blue-400 active:scale-90"
                title="Actualizar conflictos"
              >
                <RefreshCw size={18} className={loading || clearing ? 'animate-spin' : ''} />
              </button>
              
              <div className="relative group">
                <button
                  disabled={clearing || conflictos.length === 0}
                  className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2.5 text-xs font-black uppercase tracking-widest"
                >
                  <Trash2 size={16} className="text-orange-400" />
                  Acciones ▾
                </button>
                {/* Menú desplegable Estilizado */}
                <div className="absolute left-0 top-full mt-3 w-64 bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl z-50
                                invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={confirmClearResolved}
                    className="w-full text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-3 transition-colors border-b border-white/5"
                  >
                    <CheckCircle size={16} />
                    Limpiar Resueltos
                  </button>
                  <button
                    type="button"
                    onClick={confirmClearAll}
                    className="w-full text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                  >
                    <AlertTriangle size={16} />
                    Limpiar Todo
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                {conflictos.length} Resguardados
              </div>
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${irresueltos.length > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                {irresueltos.length > 0 ? `${irresueltos.length} Pendientes` : 'Sistema Limpio'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-6">
                 <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 animate-pulse">
                    <RefreshCw size={40} className="animate-spin text-red-500" />
                 </div>
                 <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">Sincronizando registros...</p>
              </div>
            ) : conflictos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in duration-500">
                <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <CheckCircle size={48} className="text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-xl uppercase tracking-tight">Cielo Despejado</p>
                  <p className="text-xs text-white/30 mt-2 font-bold uppercase tracking-widest">No se detectaron conflictos de agenda</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {conflictos.map((c) => (
                  <div
                    key={c.id}
                    className={`p-6 rounded-3xl border transition-all duration-300 group hover:scale-[1.01] ${c.resuelto ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10 shadow-xl'}`}
                  >
                    <div className="flex items-start justify-between gap-6 mb-5">
                      <span
                        className={`shrink-0 text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest ${
                          c.resuelto
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            : CONFLICTO_COLORS[c.tipo_conflicto] ?? 'bg-white/5 text-white/40 border border-white/5'
                        }`}
                      >
                        {c.tipo_conflicto.replace(/_/g, ' ')}
                      </span>
                      
                      {!c.resuelto && (
                        <button
                          type="button"
                          onClick={() => onResolve(c.id)}
                          disabled={clearing}
                          className="shrink-0 text-[10px] font-black px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all disabled:opacity-20 uppercase tracking-widest flex items-center gap-2"
                        >
                          <Zap size={14} fill="currentColor" />
                          Resolver
                        </button>
                      )}
                      {c.resuelto && (
                        <div className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle size={14} /> Auditoría OK
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-white/70 leading-relaxed font-bold mb-5 tracking-tight">{c.descripcion}</p>

                    {c.horario_id && (
                      <button
                        onClick={() => {
                          onViewHorario(c.horario_id!);
                          onClose();
                        }}
                        className="inline-flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-5 py-2.5 rounded-xl border border-blue-500/20 transition-all active:scale-95"
                      >
                        <Eye size={14} />
                        Historial de Sesión #{c.horario_id}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-8 py-6 bg-[#0a1532] flex items-center justify-between shrink-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Registros Validados: <span className="text-white font-black">{conflictos.filter(c => c.resuelto).length}</span>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 hover:shadow-xl active:scale-95 transition-all text-xs border border-white/10 uppercase tracking-[0.2em]"
            >
              Cerrar Tablero
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
