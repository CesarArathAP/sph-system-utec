"""
Modelo de Usuario para autenticación y autorización.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class RolEnum(str, enum.Enum):
    """Roles de usuario en el sistema."""
    ADMIN = "admin"
    COORDINADOR = "coordinador"
    DOCENTE = "docente"
    ESTUDIANTE = "estudiante"


class User(Base):
    """
    Modelo de Usuario.
    
    Almacena la información de todos los usuarios del sistema.
    Cada usuario tiene un rol que determina sus permisos.
    """
    __tablename__ = "users"

    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    rol = Column(SQLEnum(RolEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    activo = Column(Boolean, default=True, nullable=False)
    current_token = Column(String(32), nullable=True, index=True)  # Token de sesión activo
    token_expires_at = Column(DateTime, nullable=True)  # Fecha de expiración del token
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relaciones
    # Un usuario puede ser un docente (relación 1:1)
    docente = relationship("Docente", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', rol='{self.rol.value}')>"
