import React, { useState } from 'react';
import authService from '../../services/authService';

/* ── Clases reutilizables ── */
const CARD_FACE =
  'absolute inset-0 rounded-[20px] p-8 flex flex-col overflow-hidden ' +
  '[backface-visibility:hidden] [-webkit-backface-visibility:hidden] ' +
  'bg-white/[0.12] backdrop-blur-[24px] border border-white/25 ' +
  'shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]';

const INPUT_CLS =
  'w-full bg-white/[0.13] border border-white/[0.28] rounded-[10px] ' +
  'px-[14px] py-[11px] text-white text-[13px] font-[Inter,sans-serif] ' +
  'outline-none transition-[border-color,background] duration-200 ' +
  'focus:border-white/70 focus:bg-white/20 placeholder:text-white/40';

const SELECT_CLS =
  'auth-select w-full bg-white/[0.13] border border-white/[0.28] rounded-[10px] ' +
  'px-[14px] py-[11px] text-white text-[13px] ' +
  'outline-none transition-[border-color,background] duration-200 ' +
  'focus:border-white/70 focus:bg-white/20 cursor-pointer appearance-none';

const BTN_CLS =
  'w-full py-3 rounded-[10px] font-semibold text-[14px] text-white cursor-pointer border-0 ' +
  'bg-[#0f4fc4] hover:bg-[#1259e0] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed ' +
  'shadow-[0_4px_16px_rgba(15,79,196,0.5)] hover:shadow-[0_6px_20px_rgba(15,79,196,0.6)] ' +
  'hover:-translate-y-px active:translate-y-0 transition-all duration-200';

const LABEL_CLS = 'block text-[11px] font-medium text-white/75 mb-1.5 tracking-[0.03em]';

const LINK_BTN_CLS =
  'text-[12px] font-semibold text-white/90 hover:text-white ' +
  'underline underline-offset-2 decoration-white/40 hover:decoration-white/90 ' +
  'transition-colors cursor-pointer bg-transparent border-0 p-0';

/* ══════════════════════════════════════════════
   ÍCONO DE CALENDARIO / HORARIO
══════════════════════════════════════════════ */
function ScheduleIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <rect x="4" y="7"  width="30" height="26" rx="4" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6"/>
      <rect x="4" y="7"  width="30" height="8"  rx="4" fill="rgba(255,255,255,0.25)"/>
      <rect x="4" y="11" width="30" height="4"        fill="rgba(255,255,255,0.25)"/>
      <line x1="13"  y1="4"    x2="13"  y2="10"   stroke="white"                strokeWidth="2" strokeLinecap="round"/>
      <line x1="25"  y1="4"    x2="25"  y2="10"   stroke="white"                strokeWidth="2" strokeLinecap="round"/>
      <line x1="17.5" y1="17" x2="17.5" y2="31"  stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      <line x1="25"  y1="17"  x2="25"  y2="31"   stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      <line x1="6"   y1="21"  x2="32"  y2="21"   stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      <line x1="6"   y1="26"  x2="32"  y2="26"   stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      <rect x="6"    y="17.5" width="10"   height="3" rx="1" fill="rgba(255,255,255,0.75)"/>
      <rect x="18"   y="22"   width="6.5"  height="3" rx="1" fill="rgba(255,255,255,0.75)"/>
      <rect x="6"    y="27"   width="6.5"  height="3" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="18"   y="17.5" width="13.5" height="3" rx="1" fill="rgba(255,255,255,0.5)"/>
      <rect x="25.5" y="27"   width="6"   height="3" rx="1" fill="rgba(255,255,255,0.7)"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL — tarjeta flip 3D
══════════════════════════════════════════════ */
export default function AuthCard() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-[390px] h-[620px] max-sm:w-[340px] [perspective:1200px]">
      <div
        className={`relative w-full h-full [transform-style:preserve-3d]
                    [transition:transform_0.75s_cubic-bezier(0.4,0.2,0.2,1)]
                    ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* ── FRONTAL: LOGIN ── */}
        <div className={CARD_FACE}>
          <LoginFace onFlip={() => setIsFlipped(true)} />
        </div>

        {/* ── TRASERA: REGISTRO ── */}
        <div className={`${CARD_FACE} [transform:rotateY(180deg)]`}>
          <RegisterFace onFlip={() => setIsFlipped(false)} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CARA LOGIN
══════════════════════════════════════════════ */
function LoginFace({ onFlip }: { onFlip: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.access_token) {
        window.location.href = '/auth/dashboard';
      } else {
        setError(res.message || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">

      {/* Brand */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-[18px] mb-3
                        bg-[linear-gradient(145deg,#1e56d9_0%,#0d3ab0_100%)]
                        shadow-[0_6px_24px_rgba(15,63,196,0.55),inset_0_1px_0_rgba(255,255,255,0.15)]">
          <ScheduleIcon size={38} />
        </div>
        <span className="text-[10px] font-medium text-white/65 tracking-[0.04em] text-center leading-[1.5] max-w-[260px]">
          Sistema digital para la planificación inteligente<br />
          de horarios académicos en centros educativos
        </span>
      </div>

      {/* Título */}
      <div className="mb-5">
        <div className="w-10 h-[3px] rounded-full bg-[linear-gradient(90deg,#60a5fa,#3b82f6)] mb-2" />
        <h1 className="text-[24px] font-bold text-white tracking-tight">¡Bienvenido!</h1>
      </div>

      {/* Correo */}
      <div className="mb-3">
        <label className={LABEL_CLS}>Correo electrónico</label>
        <input id="login-email" type="email" className={INPUT_CLS}
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="usuario@utec.edu.mx" required />
      </div>

      {/* Contraseña */}
      <div className="mb-1.5">
        <label className={LABEL_CLS}>Contraseña</label>
        <input id="login-password" type="password" className={INPUT_CLS}
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña" required />
      </div>

      {/* Olvidaste */}
      <div className="text-right mb-4">
        <span className="text-[11px] text-white/55 cursor-default">¿Olvidaste tu contraseña?</span>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 px-3 py-2.5 rounded-[8px] text-[12px] text-red-300
                        bg-red-500/20 border border-red-500/40">{error}</div>
      )}

      {/* Botón */}
      <button type="submit" disabled={loading} className={`${BTN_CLS} mb-5`}>
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>

      {/* Enlace */}
      <div className="text-center mt-auto">
        <span className="text-[12px] text-white/55">¿No tienes cuenta? </span>
        <button type="button" onClick={onFlip} className={LINK_BTN_CLS}>
          Crear cuenta
        </button>
      </div>

    </form>
  );
}

/* ══════════════════════════════════════════════
   CARA REGISTRO
══════════════════════════════════════════════ */
function RegisterFace({ onFlip }: { onFlip: () => void }) {
  const [formData, setFormData] = useState({
    nombre: '', apellido: '',
    rol: 'docente' as 'docente' | 'admin' | 'coordinador' | 'estudiante',
    email: '', password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await authService.register(formData);
      if (res.id) {
        setSuccess('¡Cuenta creada! Redirigiendo...');
        setTimeout(() => onFlip(), 1500);
      } else {
        setError(res.message || 'Error al crear la cuenta');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">

      {/* Brand compacto */}
      <div className="flex flex-col items-center mb-3">
        <div className="w-14 h-14 flex items-center justify-center rounded-[15px] mb-2.5
                        bg-[linear-gradient(145deg,#1e56d9_0%,#0d3ab0_100%)]
                        shadow-[0_6px_20px_rgba(15,63,196,0.55),inset_0_1px_0_rgba(255,255,255,0.15)]">
          <ScheduleIcon size={30} />
        </div>
        <span className="text-[9.5px] font-medium text-white/65 tracking-[0.03em] text-center leading-[1.4] max-w-[240px]">
          Sistema digital para la planificación inteligente de horarios académicos
        </span>
      </div>

      {/* Título */}
      <div className="mb-3">
        <div className="w-10 h-[3px] rounded-full bg-[linear-gradient(90deg,#60a5fa,#3b82f6)] mb-2" />
        <h1 className="text-[20px] font-bold text-white tracking-tight">Crear cuenta</h1>
      </div>

      {/* Nombre + Apellido */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <div>
          <label className={LABEL_CLS}>Nombre</label>
          <input id="reg-nombre" type="text" name="nombre" className={INPUT_CLS}
            value={formData.nombre} onChange={handleChange} placeholder="Juan" required />
        </div>
        <div>
          <label className={LABEL_CLS}>Apellido</label>
          <input id="reg-apellido" type="text" name="apellido" className={INPUT_CLS}
            value={formData.apellido} onChange={handleChange} placeholder="Pérez" required />
        </div>
      </div>

      {/* Rol */}
      <div className="mb-2.5">
        <label className={LABEL_CLS}>Rol</label>
        <select id="reg-rol" name="rol" className={SELECT_CLS}
          value={formData.rol} onChange={handleChange}>
          <option value="docente">Docente</option>
          <option value="coordinador">Coordinador</option>
          <option value="admin">Administrador</option>
          <option value="estudiante">Estudiante</option>
        </select>
      </div>

      {/* Correo */}
      <div className="mb-2.5">
        <label className={LABEL_CLS}>Correo electrónico</label>
        <input id="reg-email" type="email" name="email" className={INPUT_CLS}
          value={formData.email} onChange={handleChange} placeholder="hola@utec.edu.mx" required />
      </div>

      {/* Contraseña */}
      <div className="mb-3">
        <label className={LABEL_CLS}>Contraseña</label>
        <input id="reg-password" type="password" name="password" className={INPUT_CLS}
          value={formData.password} onChange={handleChange} placeholder="Contraseña" required />
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-2.5 px-3 py-2 rounded-[8px] text-[12px] text-red-300
                        bg-red-500/20 border border-red-500/40">{error}</div>
      )}
      {success && (
        <div className="mb-2.5 px-3 py-2 rounded-[8px] text-[12px] text-green-300
                        bg-green-500/20 border border-green-500/40">{success}</div>
      )}

      {/* Botón */}
      <button type="submit" disabled={loading} className={`${BTN_CLS} mb-3`}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      {/* Enlace */}
      <div className="text-center mt-auto">
        <span className="text-[12px] text-white/55">¿Ya tienes cuenta? </span>
        <button type="button" onClick={onFlip} className={LINK_BTN_CLS}>
          Inicia sesión aquí
        </button>
      </div>

    </form>
  );
}
