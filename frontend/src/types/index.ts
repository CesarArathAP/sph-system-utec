/* Tipos comunes de la aplicación */

export interface LoginCredentials {
  email: string;
  password: string;
}

// Formato que envía el formulario
export interface RegisterFormData {
  fullName: string;
  apellido: string;
  role: 'docente' | 'admin' | 'coordinador' | 'estudiante';
  email: string;
  password: string;
  confirmPassword: string;
}

// Formato que espera el backend
export interface RegisterData {
  nombre: string;
  apellido: string;
  rol: 'docente' | 'admin' | 'coordinador' | 'estudiante';
  email: string;
  password: string;
}

// Respuesta del backend al registrar/login
export interface AuthResponse {
  success?: boolean;
  message?: string;
  access_token?: string;
  token_type?: string;
  // Campos del usuario registrado
  id?: number;
  email?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
  activo?: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string>;
}
