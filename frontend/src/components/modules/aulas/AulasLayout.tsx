import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw, Building2, PowerOff, Power } from 'lucide-react';
import AulasModal from './AulasModal';
import { API_CONFIG } from '../../../services/config';

interface Aula {
  id?: string;
  codigo: string;
  nombre: string;
  capacidad: number;
  tipo: string;
  edificio: string;
  piso: number | null;
  equipamiento: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function toBackend(a: Aula) {
  return {
    codigo_aula: a.codigo,
    nombre: a.nombre,
    capacidad: a.capacidad || 1,           // mínimo 1 (schema ge=1)
    tipo: a.tipo,
    edificio: a.edificio || null,
    piso: (a.piso && a.piso > 0) ? a.piso : null,  // null si 0 o vacío (schema ge=1)
    equipamiento: a.equipamiento || null,
    activo: a.activo,
  };
}

function fromBackend(b: any): Aula {
  return {
    id: String(b.id),
    codigo: b.codigo_aula,
    nombre: b.nombre,
    capacidad: b.capacidad,
    tipo: (b.tipo ?? '').toLowerCase(),      // el backend puede devolver 'COMPUTO' en mayúsculas
    edificio: b.edificio ?? '',
    piso: b.piso ?? null,
    equipamiento: b.equipamiento ?? '',     // puede llegar null si no tiene equipamiento
    activo: b.activo ?? true,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}/aulas`;

const tipoColors: Record<string, string> = {
  normal: 'bg-gray-100   text-gray-700',
  computo: 'bg-blue-100   text-blue-700',
  laboratorio: 'bg-green-100  text-green-700',
  auditorio: 'bg-purple-100 text-purple-700',
};

export default function AulasLayout() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);

  /* ─── Fetch ─────────────────────────────────────────────────── */
  const fetchAulas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setAulas((data.aulas ?? []).map(fromBackend));
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar aulas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAulas(); }, [fetchAulas]);

  /* ─── Crear / Editar ─────────────────────────────────────────── */
  const handleSave = async (aula: Aula) => {
    try {
      const method = selectedAula?.id ? 'PUT' : 'POST';
      const url = selectedAula?.id ? `${BASE}/${selectedAula.id}` : BASE;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(toBackend(aula)),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.detail ?? `Error ${res.status}`;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
      setIsModalOpen(false);
      await fetchAulas();
    } catch (e: any) {
      alert(`No se pudo guardar: ${e.message}`);
    }
  };

  /* ─── Suspender / Activar ────────────────────────────────────── */
  const handleToggleActivo = async (aula: Aula) => {
    try {
      const res = await fetch(`${BASE}/${aula.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(toBackend({ ...aula, activo: !aula.activo })),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchAulas();
    } catch (e: any) {
      alert(`No se pudo actualizar: ${e.message}`);
    }
  };

  /* ─── Eliminar ───────────────────────────────────────────────── */
  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm('¿Eliminar esta aula?')) return;
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchAulas();
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e.message}`);
    }
  };

  /* ─── Filtro local ───────────────────────────────────────────── */
  const filtered = aulas.filter(
    (a) =>
      a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.edificio ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ─── UI ─────────────────────────────────────────────────────── */
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Building2 className="text-blue-600 shrink-0" size={26} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Aulas</h1>
            <p className="text-gray-500 text-xs sm:text-sm">{total} aulas registradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAulas}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition shrink-0"
            title="Actualizar"
          >
            <RefreshCw size={14} className={`${loading ? 'animate-spin text-blue-500' : 'text-gray-500'} w-4 h-4 sm:w-5 sm:h-5`} />
          </button>
          <button
            onClick={() => { setSelectedAula(null); setIsModalOpen(true); }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-xs sm:text-sm"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nueva aula</span><span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-4 sm:mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar código, nombre, tipo..."
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
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0\">
              <tr>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap\">Código</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap\">Nombre</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap\">Tipo</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Capacidad</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Edificio</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap">Piso</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap\">Activo</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-600 whitespace-nowrap\">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100\">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 sm:py-12 text-gray-400 px-4 text-xs sm:text-sm\">
                    {searchTerm ? 'Sin resultados para la búsqueda' : 'No hay aulas registradas'}
                  </td>
                </tr>
              ) : (
                filtered.map((aula) => (
                  <tr key={aula.id} className="hover:bg-gray-50 transition\">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono font-semibold text-gray-800 text-xs sm:text-sm\">{aula.codigo}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 max-w-xs truncate text-xs sm:text-sm\" title={aula.nombre}>
                      {aula.nombre}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap\">
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium capitalize inline-block ${tipoColors[aula.tipo?.toLowerCase()] ?? 'bg-gray-100 text-gray-600'}`}>
                        {aula.tipo}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 text-xs sm:text-sm">{aula.capacidad}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-600 text-xs sm:text-sm">{aula.edificio || '—'}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-600 text-xs sm:text-sm">{aula.piso ?? '—'}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap\">
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold inline-block text-nowrap ${aula.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {aula.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3\">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1\">
                        <button
                          onClick={() => { setSelectedAula(aula); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(aula)}
                          className={`p-1.5 rounded-lg transition ${aula.activo
                            ? 'hover:bg-amber-50 text-amber-500'
                            : 'hover:bg-green-50 text-green-600'
                            }`}
                          title={aula.activo ? 'Suspender' : 'Activar'}
                        >
                          {aula.activo ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(aula.id)}
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
      <AulasModal
        isOpen={isModalOpen}
        aula={selectedAula}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
