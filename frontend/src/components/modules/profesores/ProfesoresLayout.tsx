import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Search, Pencil, Trash2, RefreshCw, Plus, CalendarDays, PowerOff, Power } from 'lucide-react';
import ProfesoresModal from './ProfesoresModal';
import DisponibilidadModal from './DisponibilidadModal';
import DocenteHorarioModal from './DocenteHorarioModal';
import { API_CONFIG } from '../../../services/config';

/* ── Tipos ─────────────────────────────────────────────────────────── */
export interface Disponibilidad {
  id: number;
  docente_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  created_at: string;
}

export interface UserInfo {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
}

export interface Docente {
  id?: number;
  user_id: number;
  user?: UserInfo;              // datos del user vinculado (Opción A)
  codigo_docente: string;
  departamento: string | null;
  horas_maximas_semana: number;
  activo: boolean;
  disponibilidades: Disponibilidad[];
  created_at?: string;
  updated_at?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCENTES}`;

/* ── Componente principal ───────────────────────────────────────────── */
export default function ProfesoresLayout() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisponibilidadOpen, setIsDisponibilidadOpen] = useState(false);
  const [isHorarioOpen, setIsHorarioOpen] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);

  /* ── Fetch ─────────────────────────────────────────────────────── */
  const fetchDocentes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setDocentes(data.docentes ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar docentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocentes(); }, [fetchDocentes]);

  /* ── Guardar (crear / actualizar) ─────────────────────────────── */
  const handleSave = async (docente: Docente) => {
    try {
      const isEditing = !!selectedDocente?.id;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${BASE}/${selectedDocente!.id}` : BASE;

      const body = isEditing
        ? {
          codigo_docente: docente.codigo_docente,
          departamento: docente.departamento,
          horas_maximas_semana: docente.horas_maximas_semana,
          activo: docente.activo,
        }
        : {
          user_id: docente.user_id,
          codigo_docente: docente.codigo_docente,
          departamento: docente.departamento,
          horas_maximas_semana: docente.horas_maximas_semana,
          disponibilidades: [],
        };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail ?? `Error ${res.status}`);
      }
      setIsModalOpen(false);
      await fetchDocentes();
    } catch (e: any) {
      alert(`No se pudo guardar: ${e.message}`);
    }
  };

  /* ── Toggle activo ─────────────────────────────────────────────── */
  const handleToggleActivo = async (docente: Docente) => {
    if (!docente.id) return;
    try {
      const res = await fetch(`${BASE}/${docente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ activo: !docente.activo }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchDocentes();
    } catch (e: any) {
      alert(`No se pudo cambiar el estado: ${e.message}`);
    }
  };

  /* ── Eliminar ──────────────────────────────────────────────────── */
  const handleDelete = async (id: number | undefined) => {
    if (!id || !confirm('¿Eliminar este docente? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchDocentes();
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e.message}`);
    }
  };

  /* ── Filtro local ──────────────────────────────────────────────── */
  const filtered = docentes.filter((d) => {
    const term = searchTerm.toLowerCase();
    const nombre = `${d.user?.nombre ?? ''} ${d.user?.apellido ?? ''}`.toLowerCase();
    return (
      d.codigo_docente.toLowerCase().includes(term) ||
      (d.departamento ?? '').toLowerCase().includes(term) ||
      nombre.includes(term) ||
      (d.user?.email ?? '').toLowerCase().includes(term)
    );
  });

  /* ── UI ────────────────────────────────────────────────────────── */
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Docentes</h1>
            <p className="text-gray-500 text-sm">{total} docentes registrados</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDocentes}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            title="Actualizar lista"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
          </button>
          <button
            onClick={() => { setSelectedDocente(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-sm"
          >
            <Plus size={16} />
            Nuevo docente
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, código, departamento o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Estado carga / error */}
      {loading && (
        <div className="flex justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Departamento</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hrs/semana</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Disponibilidad</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    {searchTerm ? 'Sin resultados para la búsqueda' : 'No hay docentes registrados'}
                  </td>
                </tr>
              ) : (
                filtered.map((docente) => (
                  <tr key={docente.id} className="hover:bg-gray-50 transition">
                    {/* Código */}
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                      {docente.codigo_docente}
                    </td>

                    {/* Nombre completo */}
                    <td className="px-4 py-3">
                      {docente.user ? (
                        <button
                          onClick={() => { setSelectedDocente(docente); setIsHorarioOpen(true); }}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left transition"
                          title="Ver horario del docente"
                        >
                          {docente.user.nombre} {docente.user.apellido}
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">Sin usuario vinculado</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {docente.user?.email ?? <span className="text-gray-400">—</span>}
                    </td>

                    {/* Departamento */}
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={docente.departamento ?? ''}>
                      {docente.departamento ?? <span className="text-gray-400">—</span>}
                    </td>

                    {/* Horas máximas */}
                    <td className="px-4 py-3 text-center text-gray-700">
                      {docente.horas_maximas_semana}h
                    </td>

                    {/* Disponibilidades */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => { setSelectedDocente(docente); setIsDisponibilidadOpen(true); }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                        title="Ver disponibilidad"
                      >
                        <CalendarDays size={11} />
                        {docente.disponibilidades?.length ?? 0} bloques
                      </button>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${docente.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {docente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedDocente(docente); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          title="Editar docente"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(docente)}
                          className={`p-1.5 rounded-lg transition ${docente.activo ? 'hover:bg-orange-50 text-orange-500' : 'hover:bg-green-50 text-green-600'}`}
                          title={docente.activo ? 'Suspender' : 'Activar'}
                        >
                          {docente.activo ? <PowerOff size={14} /> : <Power size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(docente.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                          title="Eliminar docente"
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
      <ProfesoresModal
        isOpen={isModalOpen}
        docente={selectedDocente}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Modal disponibilidad */}
      <DisponibilidadModal
        isOpen={isDisponibilidadOpen}
        docente={selectedDocente}
        onClose={() => setIsDisponibilidadOpen(false)}
        onSaved={fetchDocentes}
      />

      {/* Modal horario del docente */}
      <DocenteHorarioModal
        isOpen={isHorarioOpen}
        docente={selectedDocente}
        onClose={() => setIsHorarioOpen(false)}
      />
    </div>
  );
}
