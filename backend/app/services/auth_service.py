"""
Servicio de autenticación de usuarios.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password, create_access_token


def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Obtener usuario por email.
    
    Args:
        db: Sesión de base de datos
        email: Email del usuario
        
    Returns:
        Usuario si existe, None si no
    """
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Crear un nuevo usuario.
    
    Args:
        db: Sesión de base de datos
        user_data: Datos del usuario a crear
        
    Returns:
        Usuario creado
        
    Raises:
        HTTPException: Si el email ya está registrado
    """
    # Verificar si el email ya existe
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Hashear la contraseña
    hashed_password = get_password_hash(user_data.password)
    
    # Crear el usuario
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        nombre=user_data.nombre,
        rol=user_data.rol,
        activo=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Autenticar un usuario.
    
    Args:
        db: Sesión de base de datos
        email: Email del usuario
        password: Contraseña del usuario
        
    Returns:
        Usuario si las credenciales son correctas, None si no
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.activo:
        return None
    return user


def login_user(db: Session, email: str, password: str) -> dict:
    """
    Login de usuario y generación de token.
    
    Args:
        db: Sesión de base de datos
        email: Email del usuario
        password: Contraseña del usuario
        
    Returns:
        Diccionario con access_token y token_type
        
    Raises:
        HTTPException: Si las credenciales son incorrectas
    """
    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token JWT
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "rol": user.rol.value
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
