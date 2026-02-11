"""
Rutas de autenticación.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.services import auth_service
from app.models.user import User
from app.api.dependencies import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Registrar un nuevo usuario.
    
    - **email**: Email único del usuario
    - **password**: Contraseña (mínimo 8 caracteres)
    - **nombre**: Nombre completo del usuario
    - **rol**: Rol del usuario (admin, coordinador, docente, estudiante)
    """
    return auth_service.create_user(db, user_data)


@router.post("/login", response_model=Token)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Iniciar sesión y obtener token JWT.
    
    - **email**: Email del usuario
    - **password**: Contraseña del usuario
    
    Returns:
        Token JWT para autenticación
    """
    return auth_service.login_user(db, credentials.email, credentials.password)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Obtener información del usuario autenticado.
    
    Requiere autenticación con token JWT en el header:
    Authorization: Bearer <token>
    
    Returns:
        Información del usuario actual
    """
    return current_user
# @router.post("/refresh")
