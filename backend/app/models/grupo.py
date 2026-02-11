"""
Modelo de Grupo.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class TurnoEnum(str, enum.Enum):
    """Turnos disponibles."""
    MATUTINO = "matutino"
    VESPERTINO = "vespertino"
    NOCTURNO = "nocturno"


class Grupo(Base):
    """
    Modelo de Grupo.
    
    Grupos de estudiantes que cursan materias juntos.
    """
    __tablename__ = "grupos"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    codigo_grupo = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    carrera = Column(String(100), nullable=False)
    semestre = Column(Integer, nullable=False)
    turno = Column(SQLEnum(TurnoEnum), nullable=False)
    num_estudiantes = Column(Integer, nullable=False)
    ciclo_escolar = Column(String(20), nullable=False, index=True)
    activo = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    asignaciones = relationship("Asignacion", back_populates="grupo")

    def __repr__(self):
        return f"<Grupo(id={self.id}, codigo='{self.codigo_grupo}', carrera='{self.carrera}', semestre={self.semestre})>"
