import React from 'react';
import { X, AlertTriangle, CheckCircle, Eye, RefreshCw } from 'lucide-react';

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
  'solapamiento_docente': 'bg-red-100 text-red-700',
  'solapamiento_aula': 'bg-orange-100 text-orange-700',
  'solapamiento_grupo': 'bg-yellow-100 text-yellow-700',
  'docente_no_disponible': 'bg-red-100 text-red-700',
  'aula_no_disponible': 'bg-orange-100 text-orange-700',
  'grupo_no_disponible': 'bg-yellow-100 text-yellow-700',
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-lg">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Conflictos del Sistema</h2>
                <p className="text-xs text-red-100 mt-1">Gestiona los conflictos detectados</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Toolbar */}
          <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={loading || clearing}
                className="p-2 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition disabled:opacity-50 text-gray-600 hover:text-blue-600"
                title="Actualizar conflictos"
              >
                <RefreshCw size={16} className={loading || clearing ? 'animate-spin' : ''} />
              </button>
              
              {/* Dropdown Limpiar */}
              <div className="relative group">
                <button
                  title="Limpiar historial"
                  disabled={clearing || conflictos.length === 0}
                  className="text-xs font-bold px-3.5 py-2 rounded-lg border-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-400 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>🗑️</span> Limpiar ▾
                </button>
                {/* Menú desplegable */}
                <div className="absolute left-0 top-full mt-2 w-60 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50
                                invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      onClearResolved();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 flex items-center gap-2 rounded-t-xl font-semibold transition border-b border-gray-100"
                  >
                    <CheckCircle size={16} className="text-emerald-600" />
                    Limpiar resueltos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAll();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 rounded-b-xl font-bold transition"
                  >
                    <AlertTriangle size={16} className="text-red-600" />
                    Limpiar todo
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                Total: {conflictos.length}
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${irresueltos.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {irresueltos.length > 0 ? `⚠️ ${irresueltos.length} pendiente(s)` : '✅ Sin problemas'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <RefreshCw size={32} className="animate-spin text-red-600" />
                <p className="text-sm text-gray-600 font-medium">Cargando conflictos...</p>
              </div>
            ) : conflictos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="p-4 bg-emerald-100 rounded-full">
                  <CheckCircle size={40} className="text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-lg">Sin conflictos</p>
                  <p className="text-sm text-gray-500 mt-1">Todo en orden ✓</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conflictos.map((c) => (
                  <div
                    key={c.id}
                    className={`px-6 py-4 transition hover:bg-gray-50 ${c.resuelto ? 'bg-emerald-50/40' : 'bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <span
                        className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg inline-block ${
                          c.resuelto
                            ? 'bg-emerald-100 text-emerald-700'
                            : CONFLICTO_COLORS[c.tipo_conflicto] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.tipo_conflicto.replace('_', ' ').toUpperCase()}
                      </span>
                      {/* Botón Resolver o estado */}
                      {!c.resuelto && (
                        <button
                          type="button"
                          onClick={() => onResolve(c.id)}
                          title="Marcar como resuelto"
                          disabled={clearing}
                          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✓ Resolver
                        </button>
                      )}
                      {c.resuelto && (
                        <span className="shrink-0 text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle size={14} /> Resuelto
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed font-medium mb-3">{c.descripcion}</p>

                    {c.horario_id && (
                      <button
                        onClick={() => {
                          onViewHorario(c.horario_id!);
                          onClose();
                        }}
                        className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-semibold transition group"
                      >
                        <Eye size={14} className="group-hover:scale-110 transition-transform" />
                        Ver horario #{c.horario_id}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between shrink-0">
            <div className="text-xs text-gray-600">
              Resueltos: <span className="font-bold text-gray-900">{conflictos.filter(c => c.resuelto).length}</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 hover:shadow-lg active:scale-95 transition text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
