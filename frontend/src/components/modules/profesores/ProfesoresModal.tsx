import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, UserPlus, CheckCircle, RefreshCw, ChevronRight, ChevronLeft, GraduationCap, X } from 'lucide-react';
import { INPUT_CLASS, LABEL_CLASS } from './logic/constants';
import type { Docente, ProfesoresModalProps } from './logic/types';
import { API_CONFIG } from '../../../services/config';

/* ─── Tipos ─────────────────────────────────────────────────── */
interface UserResult {
  id: number; nombre: string; apellido: string; email: string; rol: string; activo: boolean;
}

/* ─── Helpers ───────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('auth_token') ?? ''; }

// URL base para docentes: /api/v1/docentes
const BASE_DOCENTES = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCENTES}`;
// URL base para usuarios: /api/v1/users
const BASE_USERS = `${API_CONFIG.BASE_URL}/users`;
// URL para registro: /api/v1/auth/register
const AUTH_REGISTER = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`;

const emptyUser    = { nombre: '', apellido: '', email: '', password: '' };
const emptyDocente = { codigo_docente: '', departamento: '', horas_maximas_semana: 20 };


/* ════════════════════════════════════════════════════════════════
   FORM EDITAR
   ══════════════════════════════════════════════════════════════ */
function EditDocenteForm({ docente, onSave, onClose }:
  { docente: Docente; onSave: (d: Docente) => void; onClose: () => void }) {

  const [form, setForm] = useState({
    codigo_docente:       docente.codigo_docente,
    departamento:         docente.departamento ?? '',
    horas_maximas_semana: docente.horas_maximas_semana,
    activo:               docente.activo,
  });

  // Actualizar el form cuando cambia el docente seleccionado
  useEffect(() => {
    setForm({
      codigo_docente:       docente.codigo_docente,
      departamento:         docente.departamento ?? '',
      horas_maximas_semana: docente.horas_maximas_semana,
      activo:               docente.activo,
    });
  }, [docente.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setForm(prev => ({
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
      {/* Usuario vinculado */}
      {docente.user && (
        <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-xs font-bold text-white">
            {docente.user.nombre[0]}{docente.user.apellido[0]}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{docente.user.nombre} {docente.user.apellido}</p>
            <p className="text-white/50 text-xs">{docente.user.email}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Código docente <span className="text-red-400">*</span></label>
          <input name="codigo_docente" value={form.codigo_docente} onChange={handleChange}
            required placeholder="ej. DOC-001" className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Hrs máx / semana</label>
          <input name="horas_maximas_semana" type="number" min={1} max={60}
            value={form.horas_maximas_semana} onChange={handleChange} className={INPUT_CLASS} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Departamento</label>
        <input name="departamento" value={form.departamento} onChange={handleChange}
          placeholder="ej. Ing. Sistemas" className={INPUT_CLASS} />
      </div>

      <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
        <input type="checkbox" name="activo" id="activo_edit"
          checked={form.activo} onChange={handleChange}
          className="w-4 h-4 accent-green-400 cursor-pointer" />
        <label htmlFor="activo_edit" className="text-sm font-medium text-white/80 cursor-pointer select-none">
          Docente activo
        </label>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-white/15">
        <button type="button" onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-white/25 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
          Cancelar
        </button>
        <button type="submit"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                     bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                     hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)]
                     hover:-translate-y-px transition-all duration-200">
          Guardar cambios
        </button>
      </div>
    </form>
  );
}

/* ════════════════════════════════════════════════════════════════
   WIZARD CREAR (2 pasos)
   ══════════════════════════════════════════════════════════════ */
function CreateDocenteWizard({ isOpen, onSave, onClose }:
  { isOpen: boolean; onSave: (d: Docente) => void; onClose: () => void }) {

  const [step, setStep]                     = useState<1 | 2>(1);
  const [mode, setMode]                     = useState<'search' | 'create'>('search');
  const [searchQ, setSearchQ]               = useState('');
  const [searchResults, setSearchResults]   = useState<UserResult[]>([]);
  const [searching, setSearching]           = useState(false);
  const [selectedUser, setSelectedUser]     = useState<UserResult | null>(null);
  const [newUser, setNewUser]               = useState(emptyUser);
  const [creating, setCreating]             = useState(false);
  const [createError, setCreateError]       = useState<string | null>(null);
  const [docenteForm, setDocenteForm]       = useState(emptyDocente);
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resetear todo el wizard cuando el modal se cierra
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setMode('search');
      setSearchQ('');
      setSearchResults([]);
      setSearching(false);
      setSelectedUser(null);
      setNewUser(emptyUser);
      setCreating(false);
      setCreateError(null);
      setDocenteForm(emptyDocente);
      setSaving(false);
      setSaveError(null);
    }
  }, [isOpen]);

  // Búsqueda de usuarios con debounce
  useEffect(() => {
    if (mode !== 'search') return;
    if (searchQ.length < 2) { setSearchResults([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${BASE_USERS}?q=${encodeURIComponent(searchQ)}&rol=docente&sin_docente=true&limit=10`,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        setSearchResults(await res.json());
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [searchQ, mode]);

  /* Paso 1 — Crear nuevo usuario con rol docente */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(AUTH_REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ...newUser, rol: 'docente' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const detail = err?.detail;
        if (res.status === 409) throw new Error('Ya existe un usuario con ese email.');
        if (res.status === 422) throw new Error(typeof detail === 'string' ? detail : 'Datos inválidos. Revisa el formulario.');
        throw new Error(typeof detail === 'string' ? detail : `Error ${res.status} al crear el usuario.`);
      }
      const created: UserResult = await res.json();
      setSelectedUser(created);
      setStep(2);
    } catch (e: any) {
      setCreateError(e.message ?? 'Error al crear el usuario.');
    } finally {
      setCreating(false);
    }
  };

  /* Paso 2 — Guardar perfil docente */
  const handleSaveDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!docenteForm.codigo_docente.trim()) {
      setSaveError('El código docente es obligatorio.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      // Hacer el POST directamente aquí para manejar errores correctamente
      const res = await fetch(BASE_DOCENTES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          codigo_docente: docenteForm.codigo_docente.trim(),
          departamento: docenteForm.departamento.trim() || null,
          horas_maximas_semana: docenteForm.horas_maximas_semana,
          disponibilidades: [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = typeof err?.detail === 'string' ? err.detail : null;
        if (res.status === 401) throw new Error('Tu sesión ha expirado. Vuelve a iniciar sesión.');
        if (res.status === 403) throw new Error('No tienes permisos para crear docentes.');
        if (res.status === 409) throw new Error(detail ?? `El código "${docenteForm.codigo_docente}" ya está en uso o el usuario ya está vinculado a otro docente.`);
        if (res.status === 422) throw new Error(detail ?? 'Datos inválidos. Revisa el formulario.');
        if (res.status >= 500) throw new Error(detail ?? 'Error del servidor. Intenta de nuevo.');
        throw new Error(detail ?? `Error ${res.status} al crear el docente.`);
      }

      const docenteCreado: Docente = await res.json();
      // Notificar al padre con el docente recién creado y cerrar
      onSave(docenteCreado);
    } catch (e: any) {
      setSaveError(e.message ?? 'Error al guardar el docente.');
      setSaving(false);
    }
  };

  /* ── Stepper ── */
  const Stepper = () => (
    <div className="flex items-center gap-2 px-6 pt-5 pb-3">
      <div className={`flex items-center gap-2 text-sm font-semibold ${step === 1 ? 'text-white' : 'text-emerald-400'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${step === 1 ? 'bg-white text-[#0d3494]' : 'bg-emerald-500 text-white'}`}>
          {step === 1 ? '1' : '✓'}
        </span>
        Usuario
      </div>
      <div className="flex-1 h-0.5 bg-white/20 mx-1">
        <div className={`h-full bg-blue-400 transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`} />
      </div>
      <div className={`flex items-center gap-2 text-sm font-semibold ${step === 2 ? 'text-white' : 'text-white/40'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${step === 2 ? 'bg-white text-[#0d3494]' : 'bg-white/20 text-white/40'}`}>2</span>
        Perfil docente
      </div>
    </div>
  );

  /* ── Paso 1 ── */
  const renderStep1 = () => (
    <div className="p-6 space-y-4">
      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/20 text-sm">
        <button type="button"
          onClick={() => { setMode('search'); setSelectedUser(null); setSearchQ(''); setSearchResults([]); }}
          className={`flex-1 py-2.5 font-semibold transition flex items-center justify-center gap-2 cursor-pointer
            ${mode === 'search' ? 'bg-white/20 text-white' : 'bg-transparent text-white/50 hover:bg-white/10'}`}>
          <Search size={13} /> Buscar usuario existente
        </button>
        <button type="button"
          onClick={() => { setMode('create'); setSelectedUser(null); setCreateError(null); }}
          className={`flex-1 py-2.5 font-semibold transition flex items-center justify-center gap-2 cursor-pointer
            ${mode === 'create' ? 'bg-white/20 text-white' : 'bg-transparent text-white/50 hover:bg-white/10'}`}>
          <UserPlus size={13} /> Registrar nuevo
        </button>
      </div>

      {/* ── Tab: Buscar ── */}
      {mode === 'search' && (
        <div className="space-y-3">
          <p className="text-white/50 text-xs">
            Busca usuarios con rol <strong className="text-white/70">Docente</strong> que aún no tengan perfil docente asignado.
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Nombre, apellido o email..." autoFocus
              className={`${INPUT_CLASS} pl-9`} />
            {searching && <RefreshCw size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />}
          </div>

          {searchResults.length > 0 && (
            <ul className="border border-white/20 rounded-xl overflow-hidden divide-y divide-white/10 max-h-48 overflow-y-auto">
              {searchResults.map(u => (
                <li key={u.id}>
                  <button type="button" onClick={() => setSelectedUser(u)}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition cursor-pointer
                      ${selectedUser?.id === u.id ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                    <div>
                      <p className="font-semibold text-white">{u.nombre} {u.apellido}</p>
                      <p className="text-white/50 text-xs">{u.email}</p>
                    </div>
                    {selectedUser?.id === u.id && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searchQ.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-white/40 text-sm text-center py-3">Sin resultados. Prueba la pestaña "Registrar nuevo".</p>
          )}

          {selectedUser && (
            <div className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-4 py-3">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span className="text-white text-sm">
                Seleccionado: <strong>{selectedUser.nombre} {selectedUser.apellido}</strong>
                <span className="text-white/60"> — {selectedUser.email}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Crear nuevo usuario ── */}
      {mode === 'create' && (
        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm">{createError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Nombre <span className="text-red-400">*</span></label>
              <input required value={newUser.nombre} placeholder="Juan"
                onChange={e => setNewUser(p => ({ ...p, nombre: e.target.value }))} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Apellido <span className="text-red-400">*</span></label>
              <input required value={newUser.apellido} placeholder="Pérez"
                onChange={e => setNewUser(p => ({ ...p, apellido: e.target.value }))} className={INPUT_CLASS} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASS}>Email <span className="text-red-400">*</span></label>
            <input required type="email" value={newUser.email} placeholder="juan.perez@utec.edu.mx"
              onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Contraseña <span className="text-red-400">*</span> (mín. 8 caracteres)</label>
            <input required type="password" minLength={8} value={newUser.password} placeholder="••••••••"
              onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} className={INPUT_CLASS} />
          </div>
          <p className="text-white/40 text-xs">El rol se asignará automáticamente como <strong className="text-white/60">Docente</strong>.</p>
        </form>
      )}

      {/* Footer Paso 1 */}
      <div className="flex justify-between items-center pt-2 border-t border-white/15">
        <button type="button" onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-white/25 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
          Cancelar
        </button>
        {mode === 'search' ? (
          <button type="button" disabled={!selectedUser} onClick={() => setStep(2)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                       bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                       hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)] transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed">
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button type="submit" form="create-user-form" disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                       bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                       hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)] transition-all duration-200
                       disabled:opacity-60 disabled:cursor-not-allowed">
            {creating && <RefreshCw size={14} className="animate-spin" />}
            {creating ? 'Creando...' : 'Crear y continuar'} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );

  /* ── Paso 2 ── */
  const renderStep2 = () => (
    <form onSubmit={handleSaveDocente} className="p-6 space-y-4">
      {/* Usuario seleccionado */}
      {selectedUser && (
        <div className="flex items-center gap-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span className="text-white text-sm">
            Usuario: <strong>{selectedUser.nombre} {selectedUser.apellido}</strong>
            <span className="text-white/60"> — {selectedUser.email}</span>
          </span>
        </div>
      )}

      {saveError && (
        <div className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm">{saveError}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Código docente <span className="text-red-400">*</span></label>
          <input required value={docenteForm.codigo_docente} placeholder="ej. DOC-001"
            onChange={e => setDocenteForm(p => ({ ...p, codigo_docente: e.target.value }))} className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Hrs máx / semana</label>
          <input type="number" min={1} max={60} value={docenteForm.horas_maximas_semana}
            onChange={e => setDocenteForm(p => ({ ...p, horas_maximas_semana: parseInt(e.target.value) || 0 }))}
            className={INPUT_CLASS} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Departamento</label>
        <input value={docenteForm.departamento} placeholder="ej. Ing. Sistemas"
          onChange={e => setDocenteForm(p => ({ ...p, departamento: e.target.value }))} className={INPUT_CLASS} />
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-white/15">
        <button type="button" onClick={() => { setStep(1); setSaveError(null); }}
          className="flex items-center gap-1 px-5 py-2.5 rounded-xl border border-white/25 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer">
          <ChevronLeft size={16} /> Atrás
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer
                     bg-[linear-gradient(135deg,#1e56d9,#0d3ab0)]
                     hover:shadow-[0_4px_16px_rgba(15,63,196,0.45)] transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed">
          {saving && <RefreshCw size={14} className="animate-spin" />}
          {saving ? 'Guardando...' : 'Crear docente'}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <Stepper />
      {step === 1 ? renderStep1() : renderStep2()}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHELL PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
export default function ProfesoresModal({ isOpen, docente, onClose, onSave }: ProfesoresModalProps) {
  const isEditing = !!docente?.id;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     w-11/12 sm:w-full max-w-xl max-h-[90vh] overflow-y-auto
                     rounded-2xl shadow-2xl focus:outline-none
                     bg-[linear-gradient(145deg,#0a2460cc,#0d3494cc)]
                     backdrop-blur-xl border border-white/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/15
                          sticky top-0 bg-[linear-gradient(135deg,#0a2a6e,#0d3494)] rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 border border-white/25">
                <GraduationCap size={16} className="text-white" />
              </div>
              <Dialog.Title className="text-white font-bold text-base">
                {isEditing ? 'Editar docente' : 'Nuevo docente'}
              </Dialog.Title>
            </div>
            <Dialog.Close onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/15 rounded-lg p-1.5 transition cursor-pointer"
              aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>
          </div>

          {isEditing ? (
            <EditDocenteForm docente={docente!} onSave={onSave} onClose={onClose} />
          ) : (
            <CreateDocenteWizard isOpen={isOpen} onSave={onSave} onClose={onClose} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
