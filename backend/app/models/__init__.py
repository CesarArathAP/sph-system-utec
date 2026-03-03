"""
Modelos SQLAlchemy del sistema de planificación de horarios.
"""
from app.models.user import User, RolEnum
from app.models.docente import Docente
from app.models.disponibilidad_docente import DisponibilidadDocente, DiaSemanaEnum
from app.models.materia import Materia, TipoAulaEnum
from app.models.aula import Aula
from app.models.grupo import Grupo, TurnoEnum
from app.models.asignacion import Asignacion
from app.models.horario import Horario, TipoSesionEnum
from app.models.conflicto import Conflicto, TipoConflictoEnum
from app.models.horario_version import HorarioVersion
from app.models.horario_snapshot import HorarioSnapshot

__all__ = [
    # Modelos
    "User",
    "Docente",
    "DisponibilidadDocente",
    "Materia",
    "Aula",
    "Grupo",
    "Asignacion",
    "Horario",
    "HorarioVersion",
    "HorarioSnapshot",
    "Conflicto",
    # Enums
    "RolEnum",
    "DiaSemanaEnum",
    "TipoAulaEnum",
    "TurnoEnum",
    "TipoSesionEnum",
    "TipoConflictoEnum",
]
