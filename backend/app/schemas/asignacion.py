"""
Schemas Pydantic para Asignaciones.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.schemas.grupo import GrupoResponse
from app.schemas.materia import MateriaResponse
from app.schemas.docente import DocenteResponse


class AsignacionBase(BaseModel):
    """Schema base de asignación."""
    grupo_id: int = Field(..., gt=0)
    materia_id: int = Field(..., gt=0)
    docente_id: int = Field(..., gt=0)
    ciclo_escolar: str = Field(..., min_length=1, max_length=20)


class AsignacionCreate(AsignacionBase):
    """Schema para crear una asignación."""
    pass


class AsignacionUpdate(BaseModel):
    """Schema para actualizar una asignación."""
    grupo_id: Optional[int] = Field(None, gt=0)
    materia_id: Optional[int] = Field(None, gt=0)
    docente_id: Optional[int] = Field(None, gt=0)
    ciclo_escolar: Optional[str] = Field(None, min_length=1, max_length=20)


class AsignacionResponse(AsignacionBase):
    """Schema para respuesta de asignación."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Relaciones
    grupo: Optional[GrupoResponse] = None
    materia: Optional[MateriaResponse] = None
    docente: Optional[DocenteResponse] = None

    class Config:
        from_attributes = True


class AsignacionListResponse(BaseModel):
    """Schema para lista paginada de asignaciones."""
    total: int
    page: int
    page_size: int
    asignaciones: list[AsignacionResponse]
