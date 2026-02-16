"""
Schemas Pydantic para Aulas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AulaBase(BaseModel):
    """Schema base de aula."""
    codigo_aula: str = Field(..., min_length=1, max_length=20)
    nombre: str = Field(..., min_length=1, max_length=100)
    capacidad: int = Field(..., ge=1, le=200)
    tipo: str = Field(..., max_length=20)
    edificio: Optional[str] = Field(None, max_length=50)
    piso: Optional[int] = Field(None, ge=1, le=20)


class AulaCreate(AulaBase):
    """Schema para crear un aula."""
    pass


class AulaUpdate(BaseModel):
    """Schema para actualizar un aula."""
    codigo_aula: Optional[str] = Field(None, min_length=1, max_length=20)
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    capacidad: Optional[int] = Field(None, ge=1, le=200)
    tipo: Optional[str] = Field(None, max_length=20)
    edificio: Optional[str] = Field(None, max_length=50)
    piso: Optional[int] = Field(None, ge=1, le=20)
    activo: Optional[bool] = None


class AulaResponse(AulaBase):
    """Schema para respuesta de aula."""
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AulaListResponse(BaseModel):
    """Schema para lista paginada de aulas."""
    total: int
    page: int
    page_size: int
    aulas: list[AulaResponse]
