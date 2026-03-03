"""
Schemas Pydantic para Versionado de Horarios.
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class HorarioVersionBase(BaseModel):
    """Schema base de versión de horario."""
    horario_id: int
    tipo_cambio: str = Field(..., pattern="^(creacion|modificacion|eliminacion|rollback)$")
    descripcion_cambio: str = Field(..., min_length=1, max_length=500)
    razon_cambio: Optional[str] = Field(None, max_length=1000)


class HorarioVersionCreate(HorarioVersionBase):
    """Schema para crear una versión de horario."""
    estado_anterior: Optional[dict[str, Any]] = None
    estado_nuevo: dict[str, Any]
    ciclo_escolar: str
    usuario_id: Optional[int] = None
    usuario_nombre: Optional[str] = None


class HorarioVersionResponse(BaseModel):
    """Schema para respuesta de versión de horario."""
    id: int
    horario_id: int
    version_numero: int
    ciclo_escolar: str
    tipo_cambio: str
    descripcion_cambio: str
    razon_cambio: Optional[str] = None
    usuario_nombre: Optional[str] = None
    estado_anterior: Optional[dict[str, Any]] = None
    estado_nuevo: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class HorarioVersionListResponse(BaseModel):
    """Schema para lista paginada de versiones de horario."""
    total: int
    page: int
    page_size: int
    versiones: list[HorarioVersionResponse]


class HorarioVersionDiffResponse(BaseModel):
    """Schema para mostrar diferencias entre versiones."""
    version_anterior: int
    version_nueva: int
    cambios: dict[str, dict[str, Any]]  # {"campo": {"antes": value, "despues": value}}
    diferencias_totales: int
    fecha_cambio: datetime


class RollbackRequest(BaseModel):
    """Schema para solicitar rollback a una versión anterior."""
    version_numero: int = Field(..., gt=0)
    razon: Optional[str] = Field(None, max_length=500)
