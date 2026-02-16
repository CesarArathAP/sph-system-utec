/* Configuración de la API */

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api';

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
