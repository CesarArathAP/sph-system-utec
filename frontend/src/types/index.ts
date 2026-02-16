/* Tipos comunes de la aplicación */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  role: 'Profesor' | 'Administrador' | 'Estudiante';
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string>;
}
