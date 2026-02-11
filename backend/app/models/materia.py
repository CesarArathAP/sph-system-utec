"""
Modelo de Materia.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class TipoAulaEnum(str, enum.Enum):
    """Tipos de aula disponibles."""
    NORMAL = "normal"
    LABORATORIO = "laboratorio"
    COMPUTO = "computo"
    AUDITORIO = "auditorio"


class Materia(Base):
    """
    Modelo de Materia.
    
    Catálogo de materias académicas del sistema.
    """
    __tablename__ = "materias"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    codigo_materia = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    creditos = Column(Integer, nullable=False)
    horas_semana = Column(Integer, nullable=False)
    requiere_laboratorio = Column(Boolean, default=False, nullable=False)
    tipo_aula_requerida = Column(SQLEnum(TipoAulaEnum), nullable=True)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    asignaciones = relationship("Asignacion", back_populates="materia")

    def __repr__(self):
        return f"<Materia(id={self.id}, codigo='{self.codigo_materia}', nombre='{self.nombre}')>"
