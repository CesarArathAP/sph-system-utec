"""
Configuración de la aplicación usando Pydantic Settings.
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Configuración de la aplicación.
    """
    # Información del proyecto
    PROJECT_NAME: str = "SPH System UTEC"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Base de datos
    DATABASE_URL: str = "sqlite:///./sph_system.db"
    
    # Seguridad
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:4321"]
    
    # Entorno
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
