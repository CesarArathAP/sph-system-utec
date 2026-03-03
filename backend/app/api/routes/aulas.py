"""
Router para endpoints de Aulas.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.aula import (
    AulaCreate,
    AulaUpdate,
    AulaResponse,
    AulaListResponse
)
from app.services import aula_service
from app.api.dependencies import get_current_active_admin, get_current_active_coordinador
from app.models import User

router = APIRouter()


@router.get("", response_model=AulaListResponse)
def list_aulas(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de aula"),
    edificio: Optional[str] = Query(None, description="Filtrar por edificio"),
    capacidad_min: Optional[int] = Query(None, ge=1, description="Filtrar por capacidad mínima"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Listar aulas con paginación y filtros.
    
    Requiere rol de coordinador o admin.
    """
    skip = (page - 1) * page_size
    aulas, total = aula_service.get_aulas(
        db=db,
        skip=skip,
        limit=page_size,
        tipo=tipo,
        edificio=edificio,
        capacidad_min=capacidad_min,
        activo=activo
    )
    
    return AulaListResponse(
        total=total,
        page=page,
        page_size=page_size,
        aulas=aulas
    )


@router.get("/{aula_id}", response_model=AulaResponse)
def get_aula(
    aula_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener un aula por ID.
    
    Requiere rol de coordinador o admin.
    """
    return aula_service.get_aula_by_id(db, aula_id)


@router.post("", response_model=AulaResponse, status_code=status.HTTP_201_CREATED)
def create_aula(
    aula_data: AulaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Crear un nuevo aula.
    
    Requiere rol de admin.
    
    - **codigo_aula**: Código único del aula
    - **nombre**: Nombre del aula
    - **capacidad**: Capacidad de estudiantes (1-200)
    - **tipo**: Tipo de aula (normal, computo, laboratorio, auditorio)
    - **edificio**: Edificio donde se ubica (opcional)
    - **piso**: Piso donde se ubica (1-20, opcional)
    """
    return aula_service.create_aula(db, aula_data)


@router.put("/{aula_id}", response_model=AulaResponse)
def update_aula(
    aula_id: int,
    aula_data: AulaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Actualizar un aula existente.
    
    Requiere rol de admin.
    """
    return aula_service.update_aula(db, aula_id, aula_data)


@router.delete("/{aula_id}", response_model=AulaResponse)
def delete_aula(
    aula_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Eliminar un aula (soft delete).
    
    Requiere rol de admin.
    """
    return aula_service.delete_aula(db, aula_id)
