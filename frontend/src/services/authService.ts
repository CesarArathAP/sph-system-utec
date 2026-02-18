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
        return { message: json.detail || 'Credenciales incorrectas' };
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
        message: error instanceof Error ? error.message : 'Error en la autenticación',
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
      console.log('[AuthService] register URL:', url); // debug
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          message: json.detail || `Error: ${response.statusText}`,
        };
      }

      return json;
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error en el registro',
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
