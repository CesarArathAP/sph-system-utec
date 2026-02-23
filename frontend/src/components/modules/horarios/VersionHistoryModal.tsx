import React, { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronUp, ArrowRight, RotateCcw, Eye, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
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
        throw new Error('Error al cargar versiones');
      }

      const data = await response.json();
      setVersions(data.versiones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getTipoCambioColor = (tipo: string) => {
    switch (tipo) {
      case 'creacion':
        return 'bg-green-100 text-green-800';
      case 'modificacion':
        return 'bg-blue-100 text-blue-800';
      case 'rollback':
        return 'bg-orange-100 text-orange-800';
      case 'eliminacion':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoCambioLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      creacion: 'Creación',
      modificacion: 'Modificación',
      rollback: 'Reversión',
      eliminacion: 'Eliminación',
    };
    return labels[tipo] || tipo;
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      dia_semana: 'Día de la Semana',
      hora_inicio: 'Hora de Inicio',
      hora_fin: 'Hora de Fin',
      aula_id: 'Aula',
      tipo_sesion: 'Tipo de Sesión',
      materia_id: 'Materia',
      grupo_id: 'Grupo',
      docente_id: 'Docente',
      ciclo_escolar: 'Ciclo Escolar',
    };
    return labels[fieldName] || fieldName;
  };

  const getChangedFields = (oldState: Record<string, any>, newState: Record<string, any>) => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
    
    allKeys.forEach((key) => {
      if (oldState[key] !== newState[key]) {
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
    if (!window.confirm(`¿Revertir a versión ${versionNumero}?`)) {
      return;
    }

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
            razon: 'Reversión manual desde histórico',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al revertir versión');
      }

      // Recargar versiones
      fetchVersions();
      alert('Horario revertido exitosamente');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={24} />
                <h2 className="text-xl font-bold">Histórico de Versiones - Horario #{horarioId}</h2>
              </div>
              <Dialog.Close asChild>
                <button className="text-white hover:bg-blue-700 p-2 rounded-full transition">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin border-4 border-blue-200 border-t-blue-600 rounded-full w-10 h-10" />
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No hay versiones registradas para este horario.
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div key={version.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Version Header */}
                  <button
                    onClick={() =>
                      setExpandedVersion(
                        expandedVersion === version.id ? null : version.id
                      )
                    }
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="font-bold text-gray-700">v{version.version_numero}</div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getTipoCambioColor(
                          version.tipo_cambio
                        )}`}
                      >
                        {getTipoCambioLabel(version.tipo_cambio)}
                      </span>
                      <div className="text-sm text-gray-600 flex-1 text-left">
                        {version.descripcion_cambio}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(version.created_at).toLocaleString('es-ES')}
                      </div>
                    </div>
                    <div className="ml-2">
                      {expandedVersion === version.id ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </div>
                  </button>

                  {/* Version Details */}
                  {expandedVersion === version.id && (
                    <div className="px-4 py-4 border-t border-gray-200 bg-white space-y-4">
                      {/* Usuario */}
                      {version.usuario_nombre && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Usuario</p>
                          <p className="text-sm text-gray-800">{version.usuario_nombre}</p>
                        </div>
                      )}

                      {/* Razón */}
                      {version.razon_cambio && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Razón</p>
                          <p className="text-sm text-gray-800">{version.razon_cambio}</p>
                        </div>
                      )}

                      {/* Cambios */}
                      {version.tipo_cambio === 'creacion' ? (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                            Datos Creados
                          </p>
                          <div className="bg-green-50 rounded p-3 text-sm space-y-2 border border-green-200">
                            {Object.entries(version.estado_nuevo)
                              .filter(([key]) => !key.startsWith('id'))
                              .map(([key, value]) => (
                                <div key={key} className="flex items-start gap-2 text-gray-700">
                                  <span className="font-semibold text-green-700 min-w-[140px]">
                                    {getFieldLabel(key)}:
                                  </span>
                                  <span className="text-gray-800 font-medium">{String(value)}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : version.estado_anterior ? (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                            Cambios Realizados
                          </p>
                          <div className="bg-yellow-50 rounded p-3 text-sm space-y-3 border border-yellow-200">
                            {getChangedFields(version.estado_anterior, version.estado_nuevo).length === 0 ? (
                              <p className="text-gray-500 italic">No hay cambios en los datos</p>
                            ) : (
                              getChangedFields(version.estado_anterior, version.estado_nuevo).map(
                                ({ field, oldValue, newValue }) => (
                                  <div key={field} className="border-l-4 border-yellow-400 pl-3">
                                    <p className="font-semibold text-gray-800">{getFieldLabel(field)}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Anterior:</p>
                                        <p className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-mono">
                                          {String(oldValue)}
                                        </p>
                                      </div>
                                      <div className="flex items-center text-gray-400">
                                        <ArrowRight size={18} />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Nuevo:</p>
                                        <p className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                                          {String(newValue)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Estado Nuevo */}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                          Estado Actual
                        </p>
                        <div className="bg-blue-50 rounded p-3 text-sm space-y-1">
                          <div>
                            <span className="font-semibold text-gray-700">Día:</span>{' '}
                            <span className="text-gray-600">
                              {version.estado_nuevo.dia_semana}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Hora:</span>{' '}
                            <span className="text-gray-600">
                              {version.estado_nuevo.hora_inicio} -{' '}
                              {version.estado_nuevo.hora_fin}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Aula:</span>{' '}
                            <span className="text-gray-600">#{version.estado_nuevo.aula_id}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Tipo:</span>{' '}
                            <span className="text-gray-600">{version.estado_nuevo.tipo_sesion}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rollback Button */}
                      {index !== 0 && (
                        <button
                          onClick={() => handleRollback(version.version_numero)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-semibold flex items-center justify-center gap-2 transition"
                        >
                          <RotateCcw size={18} />
                          Revertir a esta versión
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
