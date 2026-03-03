"""
Schemas Pydantic para Grupos.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class GrupoBase(BaseModel):
    """Schema base de grupo."""
    codigo_grupo: str = Field(..., min_length=1, max_length=20)
    nombre: str = Field(..., min_length=1, max_length=100)
    carrera: str = Field(..., min_length=1, max_length=100)
    semestre: int = Field(..., ge=1, le=10)
    turno: str = Field(..., max_length=20)
    num_estudiantes: int = Field(..., ge=1, le=100)
    ciclo_escolar: str = Field(..., min_length=1, max_length=20)


class GrupoCreate(GrupoBase):
    """Schema para crear un grupo."""
    pass


class GrupoUpdate(BaseModel):
    """Schema para actualizar un grupo."""
    codigo_grupo: Optional[str] = Field(None, min_length=1, max_length=20)
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    carrera: Optional[str] = Field(None, min_length=1, max_length=100)
    semestre: Optional[int] = Field(None, ge=1, le=10)
    turno: Optional[str] = Field(None, max_length=20)
    num_estudiantes: Optional[int] = Field(None, ge=1, le=100)
    ciclo_escolar: Optional[str] = Field(None, min_length=1, max_length=20)
    activo: Optional[bool] = None


class GrupoResponse(GrupoBase):
    """Schema para respuesta de grupo."""
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GrupoListResponse(BaseModel):
    """Schema para lista paginada de grupos."""
    total: int
    page: int
    page_size: int
    grupos: list[GrupoResponse]
