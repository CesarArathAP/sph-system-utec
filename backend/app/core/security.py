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
    Crear un token JWT.
    
    Args:
        data: Datos a incluir en el token
        expires_delta: Tiempo de expiración del token
        
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
