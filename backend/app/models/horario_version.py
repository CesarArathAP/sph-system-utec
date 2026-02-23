"""
Modelo de Versionado de Horarios.

Permite mantener un histórico de cambios en horarios con capacidad de rollback.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, 
    JSON, Text, CheckConstraint, Index
)
from sqlalchemy.orm import relationship

from app.database import Base


class HorarioVersion(Base):
    """
    Modelo de Versionado de Horarios.
    
    Registra cada cambio realizado en un horario (creación, modificación, eliminación).
    Permite auditoría completa y rollback a versiones anteriores.
    """
    __tablename__ = "horario_versiones"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    
    # Referencia al horario
    horario_id = Column(Integer, ForeignKey("horarios.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Control de versión
    version_numero = Column(Integer, nullable=False)  # v1, v2, v3...
    ciclo_escolar = Column(String(20), nullable=False, index=True)  # "2024-1"
    
    # Snapshots (estado antes y después)
    estado_anterior = Column(JSON, nullable=True)  # {aula_id: 1, hora_inicio: "07:00"...}
    estado_nuevo = Column(JSON, nullable=False)   # {aula_id: 2, hora_inicio: "08:00"...}
    
    # Metadatos del cambio
    tipo_cambio = Column(
        String(50), 
        nullable=False,
        # Valores: "creacion", "modificacion", "eliminacion", "rollback"
    )
    descripcion_cambio = Column(String(500), nullable=False)  # "Cambió aula de 101 a 102"
    razon_cambio = Column(Text, nullable=True)  # Por qué se hizo el cambio
    
    # Auditoría
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    usuario_nombre = Column(String(255), nullable=True)  # snapshot del nombre
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Restricciones
    __table_args__ = (
        CheckConstraint(
            "version_numero > 0", 
            name="check_version_numero_positivo"
        ),
        CheckConstraint(
            "tipo_cambio IN ('creacion', 'modificacion', 'eliminacion', 'rollback')",
            name="check_tipo_cambio_valido"
        ),
        Index("idx_horario_version", "horario_id", "version_numero", unique=True),
        Index("idx_ciclo_escolar", "ciclo_escolar"),
        Index("idx_created_at", "created_at"),
    )

    # Relaciones
    horario = relationship("Horario", backref="versiones")
    usuario = relationship("User", backref="cambios_horarios")

    def __repr__(self):
        return (
            f"<HorarioVersion(horario_id={self.horario_id}, "
            f"v{self.version_numero}, tipo='{self.tipo_cambio}')>"
        )

    def to_dict(self) -> dict:
        """Retorna el versionado como diccionario."""
        return {
            "id": self.id,
            "horario_id": self.horario_id,
            "version_numero": self.version_numero,
            "tipo_cambio": self.tipo_cambio,
            "descripcion_cambio": self.descripcion_cambio,
            "razon_cambio": self.razon_cambio,
            "usuario_nombre": self.usuario_nombre,
            "created_at": self.created_at.isoformat(),
            "estado_anterior": self.estado_anterior,
            "estado_nuevo": self.estado_nuevo,
        }
