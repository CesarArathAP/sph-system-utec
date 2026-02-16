"""
Schemas Pydantic para Horarios.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, time

from app.schemas.asignacion import AsignacionResponse
from app.schemas.aula import AulaResponse


class HorarioBase(BaseModel):
    """Schema base de horario."""
    asignacion_id: int = Field(..., gt=0)
    aula_id: int = Field(..., gt=0)
    dia_semana: str = Field(..., pattern="^(lunes|martes|miercoles|jueves|viernes|sabado)$")
    hora_inicio: time
    hora_fin: time
    tipo_sesion: str = Field(..., pattern="^(teorica|practica|laboratorio)$")

    
    @field_validator('hora_fin')
    @classmethod
    def validate_hora_fin(cls, v, info):
        """Validar que hora_fin sea mayor que hora_inicio."""
        if 'hora_inicio' in info.data and v <= info.data['hora_inicio']:
            raise ValueError('hora_fin debe ser mayor que hora_inicio')
        return v
    
    @field_validator('hora_inicio', 'hora_fin')
    @classmethod
    def validate_horario_valido(cls, v):
        """Validar que las horas estén en rango válido (7:00-22:00)."""
        if v.hour < 7 or v.hour >= 22:
            raise ValueError('Las horas deben estar entre 7:00 y 22:00')
        return v


class HorarioCreate(HorarioBase):
    """Schema para crear un horario."""
    pass


class HorarioUpdate(BaseModel):
    """Schema para actualizar un horario."""
    asignacion_id: Optional[int] = Field(None, gt=0)
    aula_id: Optional[int] = Field(None, gt=0)
    dia_semana: Optional[str] = Field(None, pattern="^(lunes|martes|miercoles|jueves|viernes|sabado)$")
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    tipo_sesion: Optional[str] = Field(None, pattern="^(teorica|practica|laboratorio)$")
    activo: Optional[bool] = None


class HorarioResponse(HorarioBase):
    """Schema para respuesta de horario."""
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime
    
    # Relaciones
    asignacion: Optional[AsignacionResponse] = None
    aula: Optional[AulaResponse] = None

    class Config:
        from_attributes = True


class HorarioListResponse(BaseModel):
    """Schema para lista paginada de horarios."""
    total: int
    page: int
    page_size: int
    horarios: list[HorarioResponse]


class ConflictoResponse(BaseModel):
    """Schema para respuesta de conflicto detectado."""
    tipo: str
    descripcion: str
    horario1_id: Optional[int] = None
    horario2_id: Optional[int] = None
    detalles: dict = {}
