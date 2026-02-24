import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, UserPlus, CheckCircle, RefreshCw, ChevronRight, ChevronLeft, GraduationCap, X } from 'lucide-react';
import type { Docente } from './ProfesoresLayout';
import { API_CONFIG } from '../../../services/config';

/* ─── Props ─────────────────────────────────────────────────── */
interface ProfesoresModalProps {
  isOpen: boolean;
  docente: Docente | null;
  onClose: () => void;
  onSave: (docente: Docente) => void;
}

/* ─── Tipos ─────────────────────────────────────────────────── */
interface UserResult {
  id: number; nombre: string; apellido: string; email: string; rol: string; activo: boolean;
}

/* ─── Helpers ───────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('auth_token') ?? ''; }
const BASE = API_CONFIG.BASE_URL;

/* ─── Estilos compartidos ───────────────────────────────────── */
const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 text-white text-sm ' +
              'placeholder:text-white/40 outline-none transition focus:border-white/60 focus:bg-white/20';
const LABEL = 'block text-xs font-semibold text-white/70 mb-1.5 tracking-wide uppercase';

const emptyUser    = { nombre: '', apellido: '', email: '', password: '' };
const emptyDocente = { codigo_docente: '', departamento: '', horas_maximas_semana: 20 };

/* ════════════════════════════════════════════════════════════════
   FORM EDITAR
   ══════════════════════════════════════════════════════════════ */
function EditDocenteForm({ docente, onSave, onClose }:
  { docente: Docente; onSave: (d: Docente) => void; onClose: () => void }) {

  const [form, setForm] = useState({
    codigo_docente:      docente.codigo_docente,
    departamento:        docente.departamento ?? '',
    horas_maximas_semana: docente.horas_maximas_semana,
    activo:              docente.activo,
  });

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
          <label className={LABEL}>Código docente <span className="text-red-400">*</span></label>
          <input name="codigo_docente" value={form.codigo_docente} onChange={handleChange}
            required placeholder="ej. DOC-001" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Hrs máx / semana</label>
          <input name="horas_maximas_semana" type="number" min={1} max={60}
            value={form.horas_maximas_semana} onChange={handleChange} className={INPUT} />
        </div>
      </div>

      <div>
        <label className={LABEL}>Departamento</label>
        <input name="departamento" value={form.departamento} onChange={handleChange}
          placeholder="ej. Ing. Sistemas" className={INPUT} />
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
function CreateDocenteWizard({ onSave, onClose }:
  { onSave: (d: Docente) => void; onClose: () => void }) {

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
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [searchQ, mode]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setCreateError(null);
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
      setSelectedUser(created); setStep(2);
    } catch (e: any) { setCreateError(e.message ?? 'Error al crear el usuario'); }
    finally { setCreating(false); }
  };

  const handleSaveDocente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true); setSaveError(null);
    try {
      onSave({
        user_id: selectedUser.id,
        codigo_docente: docenteForm.codigo_docente,
        departamento: docenteForm.departamento || null,
        horas_maximas_semana: docenteForm.horas_maximas_semana,
        activo: true, disponibilidades: [],
      });
    } catch (e: any) { setSaveError(e.message ?? 'Error al guardar'); setSaving(false); }
  };

  /* Stepper */
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

  /* ── Paso 1 */
  const renderStep1 = () => (
    <div className="p-6 space-y-4">
      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/20 text-sm">
        <button type="button"
          onClick={() => { setMode('search'); setSelectedUser(null); }}
          className={`flex-1 py-2.5 font-semibold transition flex items-center justify-center gap-2 cursor-pointer
            ${mode === 'search' ? 'bg-white/20 text-white' : 'bg-transparent text-white/50 hover:bg-white/10'}`}>
          <Search size={13} /> Buscar usuario
        </button>
        <button type="button"
          onClick={() => { setMode('create'); setSelectedUser(null); }}
          className={`flex-1 py-2.5 font-semibold transition flex items-center justify-center gap-2 cursor-pointer
            ${mode === 'create' ? 'bg-white/20 text-white' : 'bg-transparent text-white/50 hover:bg-white/10'}`}>
          <UserPlus size={13} /> Registrar nuevo
        </button>
      </div>

      {mode === 'search' && (
        <div className="space-y-3">
          <p className="text-white/50 text-xs">
            Busca usuarios con rol <strong className="text-white/70">Docente</strong> sin perfil de docente asignado.
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Nombre, apellido o email..." autoFocus
              className={`${INPUT} pl-9`} />
            {searching && <RefreshCw size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />}
          </div>

          {searchResults.length > 0 && (
            <ul className="border border-white/20 rounded-xl overflow-hidden divide-y divide-white/10">
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
            <p className="text-white/40 text-sm text-center py-3">Sin resultados. Prueba registrando un nuevo usuario.</p>
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

      {mode === 'create' && (
        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-3 text-sm">{createError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Nombre <span className="text-red-400">*</span></label>
              <input required value={newUser.nombre} placeholder="Juan"
                onChange={e => setNewUser(p => ({ ...p, nombre: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Apellido <span className="text-red-400">*</span></label>
              <input required value={newUser.apellido} placeholder="Pérez"
                onChange={e => setNewUser(p => ({ ...p, apellido: e.target.value }))} className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Email <span className="text-red-400">*</span></label>
            <input required type="email" value={newUser.email} placeholder="juan.perez@utec.edu.mx"
              onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Contraseña <span className="text-red-400">*</span> (mín. 8 caracteres)</label>
            <input required type="password" minLength={8} value={newUser.password} placeholder="••••••••"
              onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} className={INPUT} />
          </div>
          <p className="text-white/40 text-xs">El rol se asignará automáticamente como <strong className="text-white/60">Docente</strong>.</p>
        </form>
      )}

      {/* Footer */}
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

  /* ── Paso 2 */
  const renderStep2 = () => (
    <form onSubmit={handleSaveDocente} className="p-6 space-y-4">
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
          <label className={LABEL}>Código docente <span className="text-red-400">*</span></label>
          <input required value={docenteForm.codigo_docente} placeholder="ej. DOC-001"
            onChange={e => setDocenteForm(p => ({ ...p, codigo_docente: e.target.value }))} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Hrs máx / semana</label>
          <input type="number" min={1} max={60} value={docenteForm.horas_maximas_semana}
            onChange={e => setDocenteForm(p => ({ ...p, horas_maximas_semana: parseInt(e.target.value) || 0 }))}
            className={INPUT} />
        </div>
      </div>

      <div>
        <label className={LABEL}>Departamento</label>
        <input value={docenteForm.departamento} placeholder="ej. Ing. Sistemas"
          onChange={e => setDocenteForm(p => ({ ...p, departamento: e.target.value }))} className={INPUT} />
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-white/15">
        <button type="button" onClick={() => setStep(1)}
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
                          sticky top-0 bg-[linear-gradient(135deg,#0a2a6e,#0d3494)] rounded-t-2xl">
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
            <CreateDocenteWizard onSave={onSave} onClose={onClose} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
