/* Servicio de autenticación */
import { API_CONFIG } from './config';
import type { LoginCredentials, RegisterData, AuthResponse, ApiError } from '../types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`,
        {
          method: 'POST',
          headers: API_CONFIG.HEADERS,
          body: JSON.stringify(credentials),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en la autenticación',
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`,
        {
          method: 'POST',
          headers: API_CONFIG.HEADERS,
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
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
