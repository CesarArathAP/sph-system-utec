"""
Modelo de Docente.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Docente(Base):
    """
    Modelo de Docente.
    
    Información específica de los docentes del sistema.
    Cada docente está vinculado a un usuario.
    """
    __tablename__ = "docentes"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    codigo_docente = Column(String(20), unique=True, nullable=False, index=True)
    departamento = Column(String(100), nullable=True)
    horas_maximas_semana = Column(Integer, default=40, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    # Relación con User (1:1)
    user = relationship("User", back_populates="docente")
    
    # Relación con DisponibilidadDocente (1:N)
    disponibilidades = relationship("DisponibilidadDocente", back_populates="docente", cascade="all, delete-orphan")
    
    # Relación con Asignacion (1:N)
    asignaciones = relationship("Asignacion", back_populates="docente")

    def __repr__(self):
        return f"<Docente(id={self.id}, codigo='{self.codigo_docente}', departamento='{self.departamento}')>"
