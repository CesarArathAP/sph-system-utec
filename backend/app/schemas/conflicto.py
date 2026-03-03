"""
Schemas Pydantic para Conflictos.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ConflictoRegistradoResponse(BaseModel):
    """Schema de respuesta para conflicto registrado."""
    id: int
    horario_id: Optional[int]
    tipo_conflicto: str
    descripcion: str
    resuelto: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ConflictoListResponse(BaseModel):
    """Schema de respuesta para lista de conflictos."""
    total: int
    page: int
    page_size: int
    conflictos: list[ConflictoRegistradoResponse]
