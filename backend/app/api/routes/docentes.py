"""
Router para endpoints de Docentes.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.docente import (
    DocenteCreate,
    DocenteUpdate,
    DocenteResponse,
    DocenteListResponse,
    DisponibilidadCreate
)
from app.services import docente_service
from app.api.dependencies import get_current_active_admin, get_current_active_coordinador
from app.models import User

router = APIRouter()


@router.get("", response_model=DocenteListResponse)
def list_docentes(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    departamento: Optional[str] = Query(None, description="Filtrar por departamento"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Listar docentes con paginación y filtros.
    
    Requiere rol de coordinador o admin.
    """
    skip = (page - 1) * page_size
    docentes, total = docente_service.get_docentes(
        db=db,
        skip=skip,
        limit=page_size,
        departamento=departamento,
        activo=activo
    )
    
    return DocenteListResponse(
        total=total,
        page=page,
        page_size=page_size,
        docentes=docentes
    )


@router.get("/{docente_id}", response_model=DocenteResponse)
def get_docente(
    docente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener un docente por ID.
    
    Requiere rol de coordinador o admin.
    """
    return docente_service.get_docente_by_id(db, docente_id)


@router.post("", response_model=DocenteResponse, status_code=status.HTTP_201_CREATED)
def create_docente(
    docente_data: DocenteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Crear un nuevo docente.
    
    Requiere rol de admin.
    
    - **user_id**: ID del usuario asociado
    - **codigo_docente**: Código único del docente
    - **departamento**: Departamento al que pertenece
    - **horas_maximas_semana**: Horas máximas que puede dar por semana
    - **disponibilidades**: Lista opcional de disponibilidades horarias
    """
    return docente_service.create_docente(db, docente_data)


@router.put("/{docente_id}", response_model=DocenteResponse)
def update_docente(
    docente_id: int,
    docente_data: DocenteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Actualizar un docente existente.
    
    Requiere rol de admin.
    """
    return docente_service.update_docente(db, docente_id, docente_data)


@router.delete("/{docente_id}", response_model=DocenteResponse)
def delete_docente(
    docente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Eliminar un docente (soft delete).
    
    Requiere rol de admin.
    """
    return docente_service.delete_docente(db, docente_id)


@router.post("/{docente_id}/disponibilidad", response_model=DocenteResponse)
def add_disponibilidad(
    docente_id: int,
    disponibilidades: list[DisponibilidadCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Agregar disponibilidad horaria a un docente.
    
    Requiere rol de coordinador o admin.
    
    - **dia_semana**: Día de la semana (lunes, martes, etc.)
    - **hora_inicio**: Hora de inicio de disponibilidad
    - **hora_fin**: Hora de fin de disponibilidad
    """
    return docente_service.add_disponibilidad(db, docente_id, disponibilidades)
