"""
Router para endpoints de Asignaciones.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.asignacion import (
    AsignacionCreate,
    AsignacionUpdate,
    AsignacionResponse,
    AsignacionListResponse
)
from app.services import asignacion_service
from app.api.dependencies import get_current_active_admin, get_current_active_coordinador
from app.models import User

router = APIRouter()


@router.get("", response_model=AsignacionListResponse)
def list_asignaciones(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    grupo_id: Optional[int] = Query(None, description="Filtrar por grupo"),
    materia_id: Optional[int] = Query(None, description="Filtrar por materia"),
    docente_id: Optional[int] = Query(None, description="Filtrar por docente"),
    ciclo_escolar: Optional[str] = Query(None, description="Filtrar por ciclo escolar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Listar asignaciones con paginación y filtros.
    
    Requiere rol de coordinador o admin.
    """
    skip = (page - 1) * page_size
    asignaciones, total = asignacion_service.get_asignaciones(
        db=db,
        skip=skip,
        limit=page_size,
        grupo_id=grupo_id,
        materia_id=materia_id,
        docente_id=docente_id,
        ciclo_escolar=ciclo_escolar
    )
    
    return AsignacionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        asignaciones=asignaciones
    )


@router.get("/{asignacion_id}", response_model=AsignacionResponse)
def get_asignacion(
    asignacion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener una asignación por ID.
    
    Requiere rol de coordinador o admin.
    """
    return asignacion_service.get_asignacion_by_id(db, asignacion_id)


@router.post("", response_model=AsignacionResponse, status_code=status.HTTP_201_CREATED)
def create_asignacion(
    asignacion_data: AsignacionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Crear una nueva asignación.
    
    Requiere rol de admin.
    
    - **grupo_id**: ID del grupo
    - **materia_id**: ID de la materia
    - **docente_id**: ID del docente
    - **ciclo_escolar**: Ciclo escolar (ej. 2024-1)
    
    Validaciones:
    - Grupo, materia y docente deben existir y estar activos
    - No puede existir la misma asignación (grupo + materia + ciclo)
    """
    return asignacion_service.create_asignacion(db, asignacion_data)


@router.put("/{asignacion_id}", response_model=AsignacionResponse)
def update_asignacion(
    asignacion_id: int,
    asignacion_data: AsignacionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Actualizar una asignación existente.
    
    Requiere rol de admin.
    """
    return asignacion_service.update_asignacion(db, asignacion_id, asignacion_data)


@router.delete("/{asignacion_id}", response_model=AsignacionResponse)
def delete_asignacion(
    asignacion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Eliminar una asignación.
    
    Requiere rol de admin.
    
    ADVERTENCIA: Esto también eliminará todos los horarios asociados.
    """
    return asignacion_service.delete_asignacion(db, asignacion_id)
