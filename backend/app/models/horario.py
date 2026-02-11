"""
Modelo de Horario.
"""
from datetime import datetime, time
from sqlalchemy import Column, Integer, Time, Boolean, DateTime, ForeignKey, Enum as SQLEnum, CheckConstraint
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class DiaSemanaEnum(str, enum.Enum):
    """Días de la semana."""
    LUNES = "lunes"
    MARTES = "martes"
    MIERCOLES = "miercoles"
    JUEVES = "jueves"
    VIERNES = "viernes"
    SABADO = "sabado"


class TipoSesionEnum(str, enum.Enum):
    """Tipos de sesión de clase."""
    TEORICA = "teorica"
    PRACTICA = "practica"
    LABORATORIO = "laboratorio"


class Horario(Base):
    """
    Modelo de Horario.
    
    Horarios generados para las clases.
    Define cuándo y dónde se imparte cada asignación.
    """
    __tablename__ = "horarios"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    asignacion_id = Column(Integer, ForeignKey("asignaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    aula_id = Column(Integer, ForeignKey("aulas.id", ondelete="CASCADE"), nullable=False, index=True)
    dia_semana = Column(SQLEnum(DiaSemanaEnum), nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    tipo_sesion = Column(SQLEnum(TipoSesionEnum), default=TipoSesionEnum.TEORICA, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    asignacion = relationship("Asignacion", back_populates="horarios")
    aula = relationship("Aula", back_populates="horarios")
    conflictos = relationship("Conflicto", back_populates="horario", cascade="all, delete-orphan")

    # Restricciones
    __table_args__ = (
        CheckConstraint('hora_fin > hora_inicio', name='check_horario_hora_fin_mayor'),
    )

    def __repr__(self):
        return f"<Horario(id={self.id}, dia='{self.dia_semana.value}', {self.hora_inicio}-{self.hora_fin}, aula_id={self.aula_id})>"
