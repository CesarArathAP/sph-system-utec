"""
Schemas Pydantic para Materias.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MateriaBase(BaseModel):
    """Schema base de materia."""
    codigo_materia: str = Field(..., min_length=1, max_length=20)
    nombre: str = Field(..., min_length=1, max_length=200)
    creditos: int = Field(..., ge=1, le=10)
    horas_semana: int = Field(..., ge=1, le=20)
    requiere_laboratorio: bool = Field(default=False)
    tipo_aula_requerida: Optional[str] = Field(None, max_length=20)
    descripcion: Optional[str] = None


class MateriaCreate(MateriaBase):
    """Schema para crear una materia."""
    pass


class MateriaUpdate(BaseModel):
    """Schema para actualizar una materia."""
    codigo_materia: Optional[str] = Field(None, min_length=1, max_length=20)
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    creditos: Optional[int] = Field(None, ge=1, le=10)
    horas_semana: Optional[int] = Field(None, ge=1, le=20)
    requiere_laboratorio: Optional[bool] = None
    tipo_aula_requerida: Optional[str] = Field(None, max_length=20)
    descripcion: Optional[str] = None
    activo: Optional[bool] = None


class MateriaResponse(MateriaBase):
    """Schema para respuesta de materia."""
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MateriaListResponse(BaseModel):
    """Schema para lista paginada de materias."""
    total: int
    page: int
    page_size: int
    materias: list[MateriaResponse]
