import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_CONFIG } from '../../../services/config';

/* ── Tipos ────────────────────────────────────────────────────────── */
interface GridHorario {
  id: number;
  materia: string;
  docente: string;
  grupo: string;
  aula: string;
  tipo_sesion: string;
  hora_fin: string;
}

interface GridData {
  snapshot_id: number;
  ciclo_escolar: string;
  version_numero: number;
  created_at: string;
  dias: string[];
  horas: string[];
  grid: Record<string, Record<string, GridHorario[]>>;
}

interface VersionInfo {
  id: number;
  version_numero: number;
  tipo_version: string;
  descripcion: string;
  created_at: string;
  usuario_nombre: string | null;
  num_horarios: number;
}

interface Props {
  cicloEscolar: string;
}

const ScheduleGridView: React.FC<Props> = ({ cicloEscolar }) => {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  // Cargar versiones
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/schedule/${cicloEscolar}/versions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setVersions(data);
          if (data.length > 0) {
            setSelectedVersionId(data[0].id);
            setCurrentVersionIndex(0);
          }
        } else {
          setError('No se pudieron cargar las versiones');
        }
      } catch (err) {
        setError('Error al cargar versiones');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [cicloEscolar]);

  // Cargar grid cuando cambia la versión seleccionada
  useEffect(() => {
    if (!selectedVersionId) return;

    const fetchGrid = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await fetch(
          `${API_CONFIG.BASE_URL}/schedule/versions/${selectedVersionId}/grid`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setGridData(data);
          setError(null);
        } else {
          setError('No se pudo cargar el horario');
        }
      } catch (err) {
        setError('Error al cargar el horario');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrid();
  }, [selectedVersionId]);

  const handlePrevVersion = () => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      setSelectedVersionId(versions[newIndex].id);
    }
  };

  const handleNextVersion = () => {
    if (currentVersionIndex < versions.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      setSelectedVersionId(versions[newIndex].id);
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // "HH:MM"
  };

  const getSessionColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'teorica':
        return 'bg-blue-100 border-l-4 border-blue-500';
      case 'practica':
        return 'bg-green-100 border-l-4 border-green-500';
      case 'laboratorio':
        return 'bg-purple-100 border-l-4 border-purple-500';
      default:
        return 'bg-gray-100 border-l-4 border-gray-500';
    }
  };

  if (loading && !gridData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin mr-2" />
        <span>Cargando horario...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
        <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Versiones */}
      {versions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Historial de Versiones
            </h3>
            <span className="text-sm text-gray-500">
              {currentVersionIndex + 1} de {versions.length}
            </span>
          </div>

          {gridData && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Versión:</span>
                  <p className="font-semibold text-gray-900">
                    v{gridData.version_numero}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <p className="font-semibold text-gray-900">
                    {gridData.created_at
                      ? new Date(gridData.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navegación de Versiones */}
          <div className="flex gap-2">
            <button
              onClick={handlePrevVersion}
              disabled={currentVersionIndex === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              <ChevronLeft size={18} />
              Anterior
            </button>
            <button
              onClick={handleNextVersion}
              disabled={currentVersionIndex === versions.length - 1}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Grid de Horarios */}
      {gridData && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="text-green-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">
              Vista General de Horarios
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Tabla de Horarios */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-gray-100 border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-900 min-w-24">
                      Hora
                    </th>
                    {gridData.dias.map((dia) => (
                      <th
                        key={dia}
                        className="bg-gray-100 border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-900 min-w-48"
                      >
                        {dia.charAt(0).toUpperCase() + dia.slice(1).toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.horas.map((hora) => (
                    <tr key={hora}>
                      <td className="sticky left-0 bg-gray-50 border border-gray-300 px-2 py-2 text-sm font-medium text-gray-900 min-w-24">
                        {formatTime(hora)}
                      </td>
                      {gridData.dias.map((dia) => {
                        const sessions = gridData.grid[dia.toUpperCase()]?.[hora] || [];
                        return (
                          <td
                            key={`${dia}-${hora}`}
                            className="border border-gray-300 px-2 py-2 text-xs align-top"
                          >
                            <div className="space-y-1">
                              {sessions.map((session, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded text-xs ${getSessionColor(
                                    session.tipo_sesion
                                  )}`}
                                >
                                  <div className="font-semibold text-gray-900">
                                    {session.materia}
                                  </div>
                                  <div className="text-gray-700">
                                    {session.docente}
                                  </div>
                                  <div className="text-gray-600">
                                    {session.grupo} | {session.aula}
                                  </div>
                                  <div className="text-gray-500 mt-1">
                                    {session.tipo_sesion.charAt(0).toUpperCase() +
                                      session.tipo_sesion.slice(1)}
                                  </div>
                                </div>
                              ))}
                              {sessions.length === 0 && (
                                <div className="p-2 text-gray-400">—</div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leyenda */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Leyenda:</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-300 rounded border-l-4 border-blue-500"></div>
                <span className="text-sm text-gray-700">Sesión Teórica</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-300 rounded border-l-4 border-green-500"></div>
                <span className="text-sm text-gray-700">Sesión Práctica</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-300 rounded border-l-4 border-purple-500"></div>
                <span className="text-sm text-gray-700">Laboratorio</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleGridView;
