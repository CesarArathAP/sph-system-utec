"""
Modelo de Asignación.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Asignacion(Base):
    """
    Modelo de Asignación.
    
    Asignación de materias a grupos con docentes.
    Representa qué docente imparte qué materia a qué grupo en un ciclo escolar.
    """
    __tablename__ = "asignaciones"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    grupo_id = Column(Integer, ForeignKey("grupos.id", ondelete="CASCADE"), nullable=False, index=True)
    materia_id = Column(Integer, ForeignKey("materias.id", ondelete="CASCADE"), nullable=False, index=True)
    docente_id = Column(Integer, ForeignKey("docentes.id", ondelete="CASCADE"), nullable=False, index=True)
    ciclo_escolar = Column(String(20), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    grupo = relationship("Grupo", back_populates="asignaciones")
    materia = relationship("Materia", back_populates="asignaciones")
    docente = relationship("Docente", back_populates="asignaciones")
    horarios = relationship("Horario", back_populates="asignacion", cascade="all, delete-orphan")

    # Restricciones
    __table_args__ = (
        UniqueConstraint('grupo_id', 'materia_id', 'ciclo_escolar', name='unique_asignacion_grupo_materia_ciclo'),
    )

    def __repr__(self):
        return f"<Asignacion(id={self.id}, grupo_id={self.grupo_id}, materia_id={self.materia_id}, docente_id={self.docente_id})>"
