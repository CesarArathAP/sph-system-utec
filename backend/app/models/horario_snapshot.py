"""
Modelo de Snapshot de Horarios.

Guarda una versión completa de todos los horarios de un ciclo escolar
en un momento específico para propósitos de auditoría y versionamiento.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Index
from sqlalchemy.orm import relationship

from app.database import Base


class HorarioSnapshot(Base):
    """
    Snapshot de todos los horarios de un ciclo escolar.
    
    Cuando se genera o modifica un horario, se guarda un snapshot
    con todos los horarios activos para poder visualizar versiones anteriores.
    """
    __tablename__ = "horario_snapshots"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificadores
    ciclo_escolar = Column(String(20), nullable=False, index=True)  # "2026-1"
    version_numero = Column(Integer, nullable=False)  # 1, 2, 3...
    __table_args__ = (Index('ix_ciclo_version', 'ciclo_escolar', 'version_numero', unique=True),)
    
    # Snapshot de datos
    # Estructura: {horarios: [{id, asignacion_id, aula_id, dia_semana, hora_inicio, hora_fin, tipo_sesion, docente, materia, grupo}]}
    horarios_data = Column(JSON, nullable=False)
    
    # Metadatos
    tipo_version = Column(String(50), nullable=False)  # "auto", "manual", "backup"
    descripcion = Column(String(500), nullable=True)  # "Generación automática", "Edición manual", etc.
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Referencia opcional al usuario que la creó
    usuario_id = Column(Integer, nullable=True)
    usuario_nombre = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<HorarioSnapshot ciclo={self.ciclo_escolar} v{self.version_numero} {self.created_at}>"
