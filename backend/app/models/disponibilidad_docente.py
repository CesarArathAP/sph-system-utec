"""
Modelo de Disponibilidad de Docente.
"""
from datetime import datetime, time
from sqlalchemy import Column, Integer, Time, DateTime, ForeignKey, Enum as SQLEnum, UniqueConstraint, CheckConstraint
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


class DisponibilidadDocente(Base):
    """
    Modelo de Disponibilidad de Docente.
    
    Horarios en los que un docente puede impartir clases.
    """
    __tablename__ = "disponibilidad_docente"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    docente_id = Column(Integer, ForeignKey("docentes.id", ondelete="CASCADE"), nullable=False, index=True)
    dia_semana = Column(SQLEnum(DiaSemanaEnum), nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones
    docente = relationship("Docente", back_populates="disponibilidades")

    # Restricciones
    __table_args__ = (
        CheckConstraint('hora_fin > hora_inicio', name='check_hora_fin_mayor'),
        UniqueConstraint('docente_id', 'dia_semana', 'hora_inicio', 'hora_fin', name='unique_disponibilidad'),
    )

    def __repr__(self):
        return f"<DisponibilidadDocente(docente_id={self.docente_id}, dia='{self.dia_semana.value}', {self.hora_inicio}-{self.hora_fin})>"
