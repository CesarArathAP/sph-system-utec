import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, UserPlus, CheckCircle, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Docente } from './ProfesoresLayout';
import { API_CONFIG } from '../../../services/config';

// BASE_URL ya incluye /api/v1, p.ej. http://localhost:8000/api/v1

/* ── Props ──────────────────────────────────────────────────────────── */
interface ProfesoresModalProps {
  isOpen: boolean;
  docente: Docente | null;   // null = crear, objeto = editar
  onClose: () => void;
  onSave: (docente: Docente) => void;
}

/* ── Tipos locales ──────────────────────────────────────────────────── */
interface UserResult {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  activo: boolean;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('auth_token') ?? '';
}

const BASE = API_CONFIG.BASE_URL;   // http://localhost:8000/api/v1

/* ── Formularios vacíos ─────────────────────────────────────────────── */
const emptyUser = { nombre: '', apellido: '', email: '', password: '' };
const emptyDocente = { codigo_docente: '', departamento: '', horas_maximas_semana: 20 };

/* ════════════════════════════════════════════════════════════════════
   MODAL EDITAR (simple, sin wizard)
   ══════════════════════════════════════════════════════════════════ */
function EditDocenteForm({
  docente,
  onSave,
  onClose,
}: {
  docente: Docente;
  onSave: (d: Docente) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    codigo_docente: docente.codigo_docente,
    departamento: docente.departamento ?? '',
    horas_maximas_semana: docente.horas_maximas_semana,
    activo: docente.activo,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'horas_maximas_semana' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...docente, ...form, departamento: form.departamento || null });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Info del usuario (solo lectura) */}
      {docente.user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <span className="font-semibold">Usuario vinculado:</span>{' '}
          {docente.user.nombre} {docente.user.apellido} — {docente.user.email}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código docente *</label>
          <input
            name="codigo_docente" value={form.codigo_docente} onChange={handleChange}
            required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ej. DOC-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hrs máx / semana</label>
          <input
            name="horas_maximas_semana" type="number" min={1} max={60}
            value={form.horas_maximas_semana} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
        <input
          name="departamento" value={form.departamento} onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ej. Ing. Sistemas"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="activo" id="activo" checked={form.activo} onChange={handleChange} className="rounded" />
        <label htmlFor="activo" className="text-sm text-gray-700">Docente activo</label>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-200">
        <button type="button" onClick={onClose}
          className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition text-sm">
          Cancelar
        </button>
        <button type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-sm">
          Guardar cambios
        </button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════════════
   WIZARD CREAR (2 pasos)
   ══════════════════════════════════════════════════════════════════ */
function CreateDocenteWizard({
  onSave,
  onClose,
}: {
  onSave: (d: Docente) => void;
  onClose: () => void;
}) {
  // ── Step 1: selección / creación de usuario ──
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  const [newUser, setNewUser] = useState(emptyUser);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Step 2: datos del docente ──
  const [docenteForm, setDocenteForm] = useState(emptyDocente);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Debounce búsqueda de usuarios existentes */
  useEffect(() => {
    if (mode !== 'search') return;
    if (searchQ.length < 2) { setSearchResults([]); return; }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${BASE}/users?q=${encodeURIComponent(searchQ)}&rol=docente&sin_docente=true&limit=10`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (!res.ok) throw new Error();
        setSearchResults(await res.json());
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [searchQ, mode]);

  /* Crear nuevo usuario vía /auth/register */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`${BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...newUser, rol: 'docente' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? `Error ${res.status}`);
      }
      const created: UserResult = await res.json();
      setSelectedUser(created);
      setStep(2);
    } catch (e: any) {
      setCreateError(e.message ?? 'Error al crear el usuario');
    } finally {
      setCreating(false);
    }
  };

  /* Guardar docente en paso 2 */
  const handleSaveDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setSaveError(null);
    try {
      onSave({
        user_id: selectedUser.id,
        codigo_docente: docenteForm.codigo_docente,
        departamento: docenteForm.departamento || null,
        horas_maximas_semana: docenteForm.horas_maximas_semana,
        activo: true,
        disponibilidades: [],
      });
    } catch (e: any) {
      setSaveError(e.message ?? 'Error al guardar');
      setSaving(false);
    }
  };

  /* ─── RENDER PASO 1 ──────────────────────────────────────────── */
  const renderStep1 = () => (
    <div className="p-6 space-y-5">
      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => { setMode('search'); setSelectedUser(null); }}
          className={`flex-1 py-2.5 font-semibold transition flex items-center justify-center gap-2
            ${mode === 'search' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <Search size={14} /> Buscar usuario existente
        </button>
        <button
          type="button"
          onClick={() => { setMode('create'); setSelectedUser(null); }}
          className={`flex-1 py-2.5 font-semibold transition flex items-center justify-center gap-2
            ${mode === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <UserPlus size={14} /> Registrar nuevo usuario
        </button>
      </div>

      {/* ── Tab Buscar ── */}
      {mode === 'search' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Busca usuarios con rol <strong>Docente</strong> que aún no tienen perfil de docente creado.
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Nombre, apellido o email..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {searching && <RefreshCw size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />}
          </div>

          {/* Resultados */}
          {searchResults.length > 0 && (
            <ul className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {searchResults.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition
                      ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{u.nombre} {u.apellido}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </div>
                    {selectedUser?.id === u.id && <CheckCircle size={18} className="text-blue-500 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searchQ.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">
              Sin resultados. Puedes registrar un nuevo usuario en la otra pestaña.
            </p>
          )}

          {/* Usuario seleccionado */}
          {selectedUser && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500 shrink-0" />
              <span>
                Seleccionado: <strong>{selectedUser.nombre} {selectedUser.apellido}</strong> — {selectedUser.email}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Crear usuario ── */}
      {mode === 'create' && (
        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                required value={newUser.nombre}
                onChange={(e) => setNewUser((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Apellido *</label>
              <input
                required value={newUser.apellido}
                onChange={(e) => setNewUser((p) => ({ ...p, apellido: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pérez"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
            <input
              required type="email" value={newUser.email}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="juan.perez@utec.edu.mx"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña * (mín. 8 caracteres)</label>
            <input
              required type="password" minLength={8} value={newUser.password}
              onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <p className="text-xs text-gray-400">El rol se asignará automáticamente como <strong>Docente</strong>.</p>
        </form>
      )}

      {/* Footer paso 1 */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
        <button type="button" onClick={onClose}
          className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition text-sm">
          Cancelar
        </button>
        {mode === 'search' ? (
          <button
            type="button"
            disabled={!selectedUser}
            onClick={() => setStep(2)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-sm disabled:opacity-50"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="submit" form="create-user-form" disabled={creating}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-sm disabled:opacity-60"
          >
            {creating && <RefreshCw size={14} className="animate-spin" />}
            {creating ? 'Creando usuario...' : 'Crear y continuar'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );

  /* ─── RENDER PASO 2 ──────────────────────────────────────────── */
  const renderStep2 = () => (
    <form onSubmit={handleSaveDocente} className="p-6 space-y-4">
      {/* Usuario seleccionado (info) */}
      {selectedUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
          <CheckCircle size={16} className="text-blue-500 shrink-0" />
          <span>
            Usuario: <strong>{selectedUser.nombre} {selectedUser.apellido}</strong> — {selectedUser.email}
          </span>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código docente *</label>
          <input
            required
            value={docenteForm.codigo_docente}
            onChange={(e) => setDocenteForm((p) => ({ ...p, codigo_docente: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ej. DOC-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hrs máx / semana</label>
          <input
            type="number" min={1} max={60}
            value={docenteForm.horas_maximas_semana}
            onChange={(e) => setDocenteForm((p) => ({ ...p, horas_maximas_semana: parseInt(e.target.value) || 0 }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
        <input
          value={docenteForm.departamento}
          onChange={(e) => setDocenteForm((p) => ({ ...p, departamento: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ej. Ing. Sistemas"
        />
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
        <button type="button" onClick={() => setStep(1)}
          className="flex items-center gap-1 px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition text-sm">
          <ChevronLeft size={16} /> Atrás
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-sm disabled:opacity-60">
          {saving && <RefreshCw size={14} className="animate-spin" />}
          {saving ? 'Guardando...' : 'Crear docente'}
        </button>
      </div>
    </form>
  );

  return (
    <>
      {/* Progress bar / stepper */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-2">
        <div className={`flex items-center gap-2 text-sm font-semibold ${step === 1 ? 'text-blue-600' : 'text-green-600'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
            {step === 1 ? '1' : '✓'}
          </span>
          Usuario
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 mx-1">
          <div className={`h-full bg-blue-500 transition-all ${step === 2 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className={`flex items-center gap-2 text-sm font-semibold ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
            2
          </span>
          Perfil docente
        </div>
      </div>
      {step === 1 ? renderStep1() : renderStep2()}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL (shell del dialog)
   ══════════════════════════════════════════════════════════════════ */
export default function ProfesoresModal({ isOpen, docente, onClose, onSave }: ProfesoresModalProps) {
  const isEditing = !!docente?.id;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />

        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh]
                     overflow-y-auto focus:outline-none"
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
            <Dialog.Title className="text-xl font-bold text-gray-800">
              {isEditing ? 'Editar docente' : 'Nuevo docente'}
            </Dialog.Title>
            <Dialog.Close
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition"
              aria-label="Cerrar"
            >
              ×
            </Dialog.Close>
          </div>

          {/* Contenido */}
          {isEditing ? (
            <EditDocenteForm docente={docente!} onSave={onSave} onClose={onClose} />
          ) : (
            <CreateDocenteWizard onSave={onSave} onClose={onClose} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
