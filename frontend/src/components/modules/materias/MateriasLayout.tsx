import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Search, Pencil, Trash2, RefreshCw, Plus, FlaskConical, Monitor, Mic, LayoutGrid } from 'lucide-react';
import MateriasModal from './MateriasModal';
import { API_CONFIG } from '../../../services/config';

/* ── Tipos ─────────────────────────────────────────────────────────── */
export interface Materia {
  id?: number;
  codigo_materia: string;
  nombre: string;
  creditos: number;
  horas_semana: number;
  requiere_laboratorio: boolean;
  tipo_aula_requerida: string | null;
  descripcion: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MATERIAS}`;

const tipoAulaInfo: Record<string, { label: string; className: string; Icon: React.FC<any> }> = {
  normal:       { label: 'Normal',      className: 'bg-gray-100   text-gray-700',   Icon: LayoutGrid  },
  computo:      { label: 'Cómputo',     className: 'bg-blue-100   text-blue-700',   Icon: Monitor     },
  laboratorio:  { label: 'Laboratorio', className: 'bg-purple-100 text-purple-700', Icon: FlaskConical },
  auditorio:    { label: 'Auditorio',   className: 'bg-amber-100  text-amber-700',  Icon: Mic         },
};

function TipoAulaBadge({ tipo }: { tipo: string | null }) {
  if (!tipo) return <span className="text-gray-400 text-xs">—</span>;
  const info = tipoAulaInfo[tipo.toLowerCase()] ?? { label: tipo, className: 'bg-gray-100 text-gray-600', Icon: LayoutGrid };
  const Icon = info.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.className}`}>
      <Icon size={11} />
      {info.label}
    </span>
  );
}

/* ── Componente principal ───────────────────────────────────────────── */
export default function MateriasLayout() {
  const [materias, setMaterias]         = useState<Materia[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  /* ── Fetch ─────────────────────────────────────────────────────── */
  const fetchMaterias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setMaterias(data.materias ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar materias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterias(); }, [fetchMaterias]);

  /* ── Guardar (crear / actualizar) ─────────────────────────────── */
  const handleSave = async (materia: Materia) => {
    try {
      const isEditing = !!selectedMateria?.id;
      const method    = isEditing ? 'PUT' : 'POST';
      const url       = isEditing ? `${BASE}/${selectedMateria!.id}` : BASE;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(materia),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Error ${res.status}`);
      }
      setIsModalOpen(false);
      await fetchMaterias();
    } catch (e: any) {
      alert(`No se pudo guardar: ${e.message}`);
    }
  };

  /* ── Eliminar ──────────────────────────────────────────────────── */
  const handleDelete = async (id: number | undefined) => {
    if (!id || !confirm('¿Eliminar esta materia? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchMaterias();
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e.message}`);
    }
  };

  /* ── Filtro local ──────────────────────────────────────────────── */
  const filtered = materias.filter(
    (m) =>
      m.codigo_materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── UI ────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <BookOpen className="text-blue-600 shrink-0" size={26} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Materias</h1>
            <p className="text-gray-500 text-xs sm:text-sm">{total} materias registradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMaterias}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition shrink-0"
            title="Actualizar lista"
          >
            <RefreshCw size={14} className={`${loading ? 'animate-spin text-blue-500' : 'text-gray-500'} w-4 h-4 sm:w-5 sm:h-5`} />
          </button>
          <button
            onClick={() => { setSelectedMateria(null); setIsModalOpen(true); }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-xs sm:text-sm"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nueva materia</span><span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-4 sm:mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar código o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Estado carga / error */}
      {loading && (
        <div className="flex justify-center py-12 sm:py-16">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm mb-4">
          {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Código</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Nombre</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Créditos</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Hrs/Semana</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Tipo Aula</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Laboratorio</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Estado</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 sm:py-12 text-gray-400 px-4 text-xs sm:text-sm">
                    {searchTerm ? 'Sin resultados para la búsqueda' : 'No hay materias registradas'}
                  </td>
                </tr>
              ) : (
                filtered.map((materia) => (
                  <tr key={materia.id} className="hover:bg-gray-50 transition">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono font-semibold text-gray-800 text-xs sm:text-sm">
                      {materia.codigo_materia}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 max-w-xs truncate text-xs sm:text-sm" title={materia.nombre}>
                      {materia.nombre}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 text-xs sm:text-sm">{materia.creditos}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 text-xs sm:text-sm">{materia.horas_semana}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                      <TipoAulaBadge tipo={materia.tipo_aula_requerida} />
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                      {materia.requiere_laboratorio ? (
                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 whitespace-nowrap">
                          <FlaskConical size={11} /> Sí
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${materia.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {materia.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedMateria(materia); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          title="Editar materia"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(materia.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                          title="Eliminar materia"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear / editar */}
      <MateriasModal
        isOpen={isModalOpen}
        materia={selectedMateria}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
