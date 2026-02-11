"""
Modelo de Conflicto.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class TipoConflictoEnum(str, enum.Enum):
    """Tipos de conflicto en horarios."""
    DOCENTE_OCUPADO = "docente_ocupado"
    AULA_OCUPADA = "aula_ocupada"
    GRUPO_OCUPADO = "grupo_ocupado"
    CAPACIDAD_EXCEDIDA = "capacidad_excedida"


class Conflicto(Base):
    """
    Modelo de Conflicto.
    
    Registro de conflictos detectados en la generación de horarios.
    Permite rastrear y resolver problemas en la asignación de horarios.
    """
    __tablename__ = "conflictos"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    horario_id = Column(Integer, ForeignKey("horarios.id", ondelete="SET NULL"), nullable=True, index=True)
    tipo_conflicto = Column(SQLEnum(TipoConflictoEnum), nullable=False)
    descripcion = Column(Text, nullable=False)
    resuelto = Column(Boolean, default=False, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relaciones
    horario = relationship("Horario", back_populates="conflictos")

    def __repr__(self):
        return f"<Conflicto(id={self.id}, tipo='{self.tipo_conflicto.value}', resuelto={self.resuelto})>"
