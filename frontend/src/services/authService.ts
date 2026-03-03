/* Servicio de autenticación */
import { API_CONFIG } from './config';
import type { LoginCredentials, RegisterData, AuthResponse, ApiError } from '../types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // El backend usa OAuth2PasswordRequestForm: necesita form-data con username/password
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        const serverMsg = typeof json.detail === 'string' ? json.detail : null;
        if (response.status === 401)
          return { message: serverMsg ?? 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.' };
        if (response.status === 403)
          return { message: serverMsg ?? 'Tu cuenta está inactiva o no tiene acceso al sistema. Contacta al administrador.' };
        if (response.status === 422)
          return { message: serverMsg ?? 'El formato del correo o la contraseña no es válido.' };
        if (response.status >= 500)
          return { message: serverMsg ?? 'El servidor tuvo un problema al procesar tu solicitud. Intenta de nuevo más tarde.' };
        return { message: serverMsg ?? 'No se pudo iniciar sesión. Intenta de nuevo.' };
      }

      // Guardar token en localStorage
      if (json.access_token) {
        this.setToken(json.access_token);

        // Obtener datos del usuario con el token
        const userInfo = await this.getMe(json.access_token);
        if (userInfo) {
          localStorage.setItem('current_user', JSON.stringify(userInfo));
        }
      }

      return json;
    } catch (error) {
      return {
        message: error instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : (error instanceof Error ? error.message : 'Ocurrió un error inesperado al iniciar sesión.'),
      };
    }
  }

  async getMe(token: string): Promise<AuthResponse | null> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/me`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok) {
        const serverMsg = typeof json.detail === 'string' ? json.detail : null;
        if (response.status === 409)
          return { message: serverMsg ?? `El correo "${data.email}" ya está registrado. Inicia sesión o usa otro correo.` };
        if (response.status === 422)
          return { message: serverMsg ?? 'Algunos datos del formulario no son válidos. Revisa que el correo sea correcto y que la contraseña cumpla los requisitos.' };
        if (response.status >= 500)
          return { message: serverMsg ?? 'El servidor tuvo un problema al crear tu cuenta. Intenta de nuevo más tarde.' };
        return { message: serverMsg ?? 'No se pudo crear la cuenta. Intenta de nuevo.' };
      }

      return json;
    } catch (error) {
      return {
        message: error instanceof TypeError
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : (error instanceof Error ? error.message : 'Ocurrió un error inesperado al registrar la cuenta.'),
      };
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();
