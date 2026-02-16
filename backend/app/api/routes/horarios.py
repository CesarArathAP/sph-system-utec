"""
Router para endpoints de Horarios.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.horario import (
    HorarioCreate,
    HorarioUpdate,
    HorarioResponse,
    HorarioListResponse,
    ConflictoResponse
)
from app.schemas.conflicto import (
    ConflictoRegistradoResponse,
    ConflictoListResponse
)
from app.services import horario_service
from app.api.dependencies import get_current_active_admin, get_current_active_coordinador
from app.models import User

router = APIRouter()


@router.get("", response_model=HorarioListResponse)
def list_horarios(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    asignacion_id: Optional[int] = Query(None, description="Filtrar por asignación"),
    aula_id: Optional[int] = Query(None, description="Filtrar por aula"),
    dia_semana: Optional[str] = Query(None, description="Filtrar por día de la semana"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Listar horarios con paginación y filtros.
    
    Requiere rol de coordinador o admin.
    """
    skip = (page - 1) * page_size
    horarios, total = horario_service.get_horarios(
        db=db,
        skip=skip,
        limit=page_size,
        asignacion_id=asignacion_id,
        aula_id=aula_id,
        dia_semana=dia_semana,
        activo=activo
    )
    
    return HorarioListResponse(
        total=total,
        page=page,
        page_size=page_size,
        horarios=horarios
    )


@router.get("/conflicts", response_model=list[ConflictoResponse])
def list_conflicts(
    ciclo_escolar: Optional[str] = Query(None, description="Filtrar por ciclo escolar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Listar todos los conflictos detectados en los horarios.
    
    Requiere rol de coordinador o admin.
    
    Detecta:
    - Aulas con doble asignación
    - Docentes con doble asignación
    - Grupos con doble asignación
    """
    return horario_service.detect_all_conflicts(db, ciclo_escolar)


@router.get("/{horario_id}", response_model=HorarioResponse)
def get_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener un horario por ID.
    
    Requiere rol de coordinador o admin.
    """
    return horario_service.get_horario_by_id(db, horario_id)


@router.post("", response_model=HorarioResponse, status_code=status.HTTP_201_CREATED)
def create_horario(
    horario_data: HorarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Crear un nuevo horario.
    
    Requiere rol de admin.
    
    - **asignacion_id**: ID de la asignación (grupo + materia + docente)
    - **aula_id**: ID del aula
    - **dia_semana**: Día (lunes, martes, miercoles, jueves, viernes, sabado)
    - **hora_inicio**: Hora de inicio (7:00-22:00)
    - **hora_fin**: Hora de fin (debe ser mayor que hora_inicio)
    - **tipo_sesion**: Tipo (teoria, practica, laboratorio)
    
    Validaciones:
    - Detecta conflictos de aula, docente y grupo
    - Valida que el aula esté activa
    - Valida rangos de tiempo
    """
    return horario_service.create_horario(db, horario_data)


@router.put("/{horario_id}", response_model=HorarioResponse)
def update_horario(
    horario_id: int,
    horario_data: HorarioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Actualizar un horario existente.
    
    Requiere rol de admin.
    
    Valida conflictos si se modifican datos relevantes.
    """
    return horario_service.update_horario(db, horario_id, horario_data)


@router.delete("/{horario_id}", response_model=HorarioResponse)
def delete_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Eliminar un horario (soft delete).
    
    Requiere rol de admin.
    
    El horario se marca como inactivo pero no se elimina de la base de datos.
    """
    return horario_service.delete_horario(db, horario_id)


@router.get("/registered-conflicts/list", response_model=ConflictoListResponse)
def list_registered_conflicts(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    resuelto: Optional[bool] = Query(None, description="Filtrar por estado resuelto"),
    horario_id: Optional[int] = Query(None, description="Filtrar por horario"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Listar conflictos registrados en la base de datos.
    
    Requiere rol de coordinador o admin.
    
    Muestra el historial de conflictos detectados, incluyendo los resueltos.
    """
    skip = (page - 1) * page_size
    conflictos, total = horario_service.get_registered_conflicts(
        db=db,
        skip=skip,
        limit=page_size,
        resuelto=resuelto,
        horario_id=horario_id
    )
    
    return ConflictoListResponse(
        total=total,
        page=page,
        page_size=page_size,
        conflictos=conflictos
    )


@router.put("/conflicts/{conflicto_id}/resolve", response_model=ConflictoRegistradoResponse)
def resolve_conflict(
    conflicto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Marcar un conflicto como resuelto.
    
    Requiere rol de admin.
    
    El conflicto se marca como resuelto pero NO se elimina de la base de datos,
    manteniendo un historial completo de conflictos.
    """
    return horario_service.resolve_conflict(db, conflicto_id)
