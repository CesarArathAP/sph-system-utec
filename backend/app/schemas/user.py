"""
Schemas Pydantic para autenticación de usuarios.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.models.user import RolEnum


# Schemas para User
class UserBase(BaseModel):
    """Schema base de usuario."""
    email: EmailStr
    nombre: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """Schema para crear un usuario."""
    password: str = Field(..., min_length=8, max_length=100)
    rol: RolEnum = Field(default=RolEnum.ESTUDIANTE)


class UserResponse(UserBase):
    """Schema para respuesta de usuario (sin password)."""
    id: int
    rol: RolEnum
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Antes era orm_mode en Pydantic v1


class UserLogin(BaseModel):
    """Schema para login de usuario."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema para respuesta de token JWT."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema para datos dentro del token JWT."""
    user_id: Optional[int] = None
    email: Optional[str] = None
    rol: Optional[str] = None
