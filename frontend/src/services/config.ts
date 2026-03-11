/* Configuración de la API */

const API_BASE_URL = 'http://localhost:8080/api/v1'; /* const API_BASE_URL = 'http://#:8000/api/v1'; en la imagen de docker se corre en el puerto 8080 y localmente en el 8000*/

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
    },
    DOCENTES: '/docentes',
    HORARIOS: '/horarios',
    AULAS: '/aulas',
    GRUPOS: '/grupos',
    MATERIAS: '/materias',
  },
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  USER_KEY: 'current_user',
  TOKEN_EXPIRY_KEY: 'token_expiry',
};
