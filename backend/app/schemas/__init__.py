"""
Schemas Pydantic para el sistema.
"""
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    TokenData,
)
from app.schemas.docente import (
    DocenteBase,
    DocenteCreate,
    DocenteUpdate,
    DocenteResponse,
    DocenteListResponse,
    DisponibilidadBase,
    DisponibilidadCreate,
    DisponibilidadResponse,
)
from app.schemas.materia import (
    MateriaBase,
    MateriaCreate,
    MateriaUpdate,
    MateriaResponse,
    MateriaListResponse,
)
from app.schemas.grupo import (
    GrupoBase,
    GrupoCreate,
    GrupoUpdate,
    GrupoResponse,
    GrupoListResponse,
)
from app.schemas.aula import (
    AulaBase,
    AulaCreate,
    AulaUpdate,
    AulaResponse,
    AulaListResponse,
)
from app.schemas.asignacion import (
    AsignacionBase,
    AsignacionCreate,
    AsignacionUpdate,
    AsignacionResponse,
    AsignacionListResponse,
)
from app.schemas.horario import (
    HorarioBase,
    HorarioCreate,
    HorarioUpdate,
    HorarioResponse,
    HorarioListResponse,
    ConflictoResponse,
)
from app.schemas.conflicto import (
    ConflictoRegistradoResponse,
    ConflictoListResponse,
)

__all__ = [
    "UserBase",
    "UserCreate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenData",
    "DocenteBase",
    "DocenteCreate",
    "DocenteUpdate",
    "DocenteResponse",
    "DocenteListResponse",
    "DisponibilidadBase",
    "DisponibilidadCreate",
    "DisponibilidadResponse",
    "MateriaBase",
    "MateriaCreate",
    "MateriaUpdate",
    "MateriaResponse",
    "MateriaListResponse",
    "GrupoBase",
    "GrupoCreate",
    "GrupoUpdate",
    "GrupoResponse",
    "GrupoListResponse",
    "AulaBase",
    "AulaCreate",
    "AulaUpdate",
    "AulaResponse",
    "AulaListResponse",
    "AsignacionBase",
    "AsignacionCreate",
    "AsignacionUpdate",
    "AsignacionResponse",
    "AsignacionListResponse",
    "HorarioBase",
    "HorarioCreate",
    "HorarioUpdate",
    "HorarioResponse",
    "HorarioListResponse",
    "ConflictoResponse",
    "ConflictoRegistradoResponse",
    "ConflictoListResponse",
]

