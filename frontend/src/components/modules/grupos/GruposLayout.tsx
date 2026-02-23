import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw, Users, Eye, PowerOff, Power } from 'lucide-react';
import GruposModal from './GruposModal';
import { API_CONFIG } from '../../../services/config';

interface Grupo {
  id?: string;
  codigo: string;
  nombre: string;
  carrera: string;
  semestre: number;
  turno: string;
  numeroEstudiantes: number;
  cicloEscolar: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Mapeo entre campos del frontend y del backend
function toBackend(g: Grupo) {
  return {
    codigo_grupo: g.codigo,
    nombre: g.nombre,
    carrera: g.carrera,
    semestre: g.semestre,
    turno: g.turno,
    num_estudiantes: g.numeroEstudiantes,
    ciclo_escolar: g.cicloEscolar,
    activo: g.activo,
  };
}

function fromBackend(b: any): Grupo {
  return {
    id: String(b.id),
    codigo: b.codigo_grupo,
    nombre: b.nombre,
    carrera: b.carrera,
    semestre: b.semestre,
    turno: b.turno,
    numeroEstudiantes: b.num_estudiantes,
    cicloEscolar: b.ciclo_escolar,
    activo: b.activo ?? true,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}/grupos`;

const turnoColors: Record<string, string> = {
  matutino: 'bg-amber-100  text-amber-700',
  vespertino: 'bg-blue-100   text-blue-700',
  nocturno: 'bg-indigo-100 text-indigo-700',
};

export default function GruposLayout() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);

  /* ─── Fetch ─────────────────────────────────────────────────── */
  const fetchGrupos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setGrupos((data.grupos ?? []).map(fromBackend));
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrupos(); }, [fetchGrupos]);

  /* ─── Crear / Editar ─────────────────────────────────────────── */
  const handleSave = async (grupo: Grupo) => {
    try {
      const method = selectedGrupo?.id ? 'PUT' : 'POST';
      const url = selectedGrupo?.id ? `${BASE}/${selectedGrupo.id}` : BASE;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(toBackend(grupo)),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setIsModalOpen(false);
      await fetchGrupos();
    } catch (e: any) {
      alert(`No se pudo guardar: ${e.message}`);
    }
  };

  /* ─── Suspender / Activar ────────────────────────────────────── */
  const handleToggleActivo = async (grupo: Grupo) => {
    try {
      const res = await fetch(`${BASE}/${grupo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(toBackend({ ...grupo, activo: !grupo.activo })),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchGrupos();
    } catch (e: any) {
      alert(`No se pudo actualizar: ${e.message}`);
    }
  };

  /* ─── Eliminar ───────────────────────────────────────────────── */
  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm('¿Eliminar este grupo?')) return;
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchGrupos();
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e.message}`);
    }
  };

  /* ─── Filtro local ───────────────────────────────────────────── */
  const filtered = grupos.filter(
    (g) =>
      g.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.carrera.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ─── UI ─────────────────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Users className="text-blue-600 shrink-0" size={26} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Grupos</h1>
            <p className="text-gray-500 text-xs sm:text-sm">{total} grupos registrados</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchGrupos}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition shrink-0"
            title="Actualizar"
          >
            <RefreshCw size={14} className={`${loading ? 'animate-spin text-blue-500' : 'text-gray-500'} w-4 h-4 sm:w-5 sm:h-5`} />
          </button>
          <button
            onClick={() => { setSelectedGrupo(null); setIsModalOpen(true); }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-xs sm:text-sm"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo grupo</span><span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-4 sm:mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar código, nombre, carrera..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Estado de carga / error */}
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
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Carrera</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Semestre</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Turno</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Estudiantes</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Activo</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 sm:py-12 text-gray-400 px-4 text-xs sm:text-sm">
                    {searchTerm ? 'Sin resultados para la búsqueda' : 'No hay grupos registrados'}
                  </td>
                </tr>
              ) : (
                filtered.map((grupo) => (
                  <tr key={grupo.id} className="hover:bg-gray-50 transition">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono font-semibold text-gray-800 text-xs sm:text-sm">{grupo.codigo}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 max-w-xs truncate text-xs sm:text-sm" title={grupo.nombre}>
                      {grupo.nombre}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 max-w-xs truncate text-xs sm:text-sm" title={grupo.carrera}>
                      {grupo.carrera}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 text-xs sm:text-sm">{grupo.semestre}°</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium capitalize inline-block ${turnoColors[grupo.turno?.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                        {grupo.turno}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 text-xs sm:text-sm">{grupo.numeroEstudiantes}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold inline-block text-nowrap">
                        {grupo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <button
                          onClick={() => { setSelectedGrupo(grupo); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(grupo)}
                          className={`p-1.5 rounded-lg transition ${grupo.activo
                            ? 'hover:bg-amber-50 text-amber-500'
                            : 'hover:bg-green-50 text-green-600'
                            }`}
                          title={grupo.activo ? 'Suspender' : 'Activar'}
                        >
                          {grupo.activo ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(grupo.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                          title="Eliminar"
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

      {/* Modal */}
      <GruposModal
        isOpen={isModalOpen}
        grupo={selectedGrupo}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
