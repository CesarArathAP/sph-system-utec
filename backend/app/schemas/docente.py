"""
Schemas Pydantic para Docentes.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, time

from app.models.disponibilidad_docente import DiaSemanaEnum


# Schemas para Disponibilidad
class DisponibilidadBase(BaseModel):
    """Schema base de disponibilidad."""
    dia_semana: DiaSemanaEnum
    hora_inicio: time
    hora_fin: time


class DisponibilidadCreate(DisponibilidadBase):
    """Schema para crear disponibilidad."""
    pass


class DisponibilidadResponse(DisponibilidadBase):
    """Schema para respuesta de disponibilidad."""
    id: int
    docente_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Info del usuario vinculado al docente ───────────────────────────────
class UserInfo(BaseModel):
    """Información básica del usuario asociado al docente."""
    id: int
    nombre: str
    apellido: str
    email: str
    activo: bool

    class Config:
        from_attributes = True


# Schemas para Docente
class DocenteBase(BaseModel):
    """Schema base de docente."""
    codigo_docente: str = Field(..., min_length=1, max_length=20)
    departamento: Optional[str] = Field(None, max_length=100)
    horas_maximas_semana: int = Field(default=40, ge=1, le=60)


class DocenteCreate(DocenteBase):
    """Schema para crear un docente."""
    user_id: int
    disponibilidades: Optional[List[DisponibilidadCreate]] = []


class DocenteUpdate(BaseModel):
    """Schema para actualizar un docente."""
    codigo_docente: Optional[str] = Field(None, min_length=1, max_length=20)
    departamento: Optional[str] = Field(None, max_length=100)
    horas_maximas_semana: Optional[int] = Field(None, ge=1, le=60)
    activo: Optional[bool] = None


class DocenteResponse(DocenteBase):
    """Schema para respuesta de docente — incluye datos del usuario vinculado."""
    id: int
    user_id: int
    user: Optional[UserInfo] = None      # datos del user (nombre, apellido, email)
    activo: bool
    created_at: datetime
    updated_at: datetime
    disponibilidades: List[DisponibilidadResponse] = []

    class Config:
        from_attributes = True


class DocenteListResponse(BaseModel):
    """Schema para lista paginada de docentes."""
    total: int
    page: int
    page_size: int
    docentes: List[DocenteResponse]
