"""
Modelo de Aula.
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


class Aula(Base):
    """
    Modelo de Aula.
    
    Espacios físicos donde se imparten clases.
    """
    __tablename__ = "aulas"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    codigo_aula = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    capacidad = Column(Integer, nullable=False)
    tipo = Column(SQLEnum(TipoAulaEnum), nullable=False, index=True)
    edificio = Column(String(50), nullable=True)
    piso = Column(Integer, nullable=True)
    equipamiento = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    horarios = relationship("Horario", back_populates="aula")

    def __repr__(self):
        return f"<Aula(id={self.id}, codigo='{self.codigo_aula}', tipo='{self.tipo.value}', capacidad={self.capacidad})>"
