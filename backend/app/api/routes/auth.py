"""
Rutas de autenticación.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.services import auth_service

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
# @router.post("/refresh")
