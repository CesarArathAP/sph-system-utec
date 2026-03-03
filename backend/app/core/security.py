"""
Funciones de seguridad para autenticación.
"""
from datetime import datetime, timedelta
from typing import Any
import bcrypt
from jose import jwt

from app.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verificar si una contraseña coincide con su hash.
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Hash de la contraseña
        
    Returns:
        True si coinciden, False si no
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """
    Generar hash de una contraseña.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Hash de la contraseña
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Crear un token de acceso de 32 caracteres.
    
    Args:
        data: Datos a incluir en el token (se usa user_id)
        expires_delta: Tiempo de expiración del token (no usado, mantenido por compatibilidad)
        
    Returns:
        Token de 32 caracteres hexadecimales
    """
    import secrets
    
    # Generar token aleatorio de 32 caracteres (16 bytes en hexadecimal)
    token = secrets.token_hex(16)
    
    return token
