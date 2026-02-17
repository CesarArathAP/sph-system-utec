"""
Dependencias de autenticación para proteger endpoints.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import TokenData

# Esquema de seguridad Bearer
security = HTTPBearer()


def _get_user_id_from_token(token: str, db: Session) -> int | None:
    """
    Obtener el ID del usuario desde un token de 32 caracteres.
    
    Args:
        token: Token de 32 caracteres
        db: Sesión de base de datos
        
    Returns:
        ID del usuario o None si el token no es válido
    """
    user = db.query(User).filter(User.current_token == token, User.activo == True).first()
    return user.id if user else None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtener el usuario actual desde el token de 32 caracteres.
    
    Args:
        credentials: Credenciales del token Bearer
        db: Sesión de base de datos
        
    Returns:
        Usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extraer el token
        token = credentials.credentials
        
        # Validar longitud del token (debe ser exactamente 32 caracteres)
        if len(token) != 32:
            raise credentials_exception
        
        # Buscar usuario por token en la base de datos
        # Nota: Usamos el token como identificador temporal
        # En producción, deberías tener una tabla de tokens con expiración
        user_id = _get_user_id_from_token(token, db)
        
        if user_id is None:
            raise credentials_exception
            
        token_data = TokenData(user_id=int(user_id))
        
    except JWTError:
        raise credentials_exception
    
    # Buscar el usuario en la base de datos
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    return user


def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verificar que el usuario actual sea administrador.
    
    Args:
        current_user: Usuario autenticado
        
    Returns:
        Usuario si es admin
        
    Raises:
        HTTPException: Si el usuario no es admin
    """
    if current_user.rol.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user


def get_current_active_coordinador(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verificar que el usuario actual sea coordinador o admin.
    
    Args:
        current_user: Usuario autenticado
        
    Returns:
        Usuario si es coordinador o admin
        
    Raises:
        HTTPException: Si el usuario no tiene permisos
    """
    if current_user.rol.value not in ["admin", "coordinador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de coordinador"
        )
    return current_user
