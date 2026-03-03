"""
Router para endpoints de Materias.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.materia import (
    MateriaCreate,
    MateriaUpdate,
    MateriaResponse,
    MateriaListResponse
)
from app.services import materia_service
from app.api.dependencies import get_current_active_admin, get_current_active_coordinador
from app.models import User

router = APIRouter()


@router.get("", response_model=MateriaListResponse)
def list_materias(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    requiere_laboratorio: Optional[bool] = Query(None, description="Filtrar por requerimiento de laboratorio"),
    tipo_aula: Optional[str] = Query(None, description="Filtrar por tipo de aula"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Listar materias con paginación y filtros.
    
    Requiere rol de coordinador o admin.
    """
    skip = (page - 1) * page_size
    materias, total = materia_service.get_materias(
        db=db,
        skip=skip,
        limit=page_size,
        requiere_laboratorio=requiere_laboratorio,
        tipo_aula=tipo_aula,
        activo=activo
    )
    
    return MateriaListResponse(
        total=total,
        page=page,
        page_size=page_size,
        materias=materias
    )


@router.get("/{materia_id}", response_model=MateriaResponse)
def get_materia(
    materia_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener una materia por ID.
    
    Requiere rol de coordinador o admin.
    """
    return materia_service.get_materia_by_id(db, materia_id)


@router.post("", response_model=MateriaResponse, status_code=status.HTTP_201_CREATED)
def create_materia(
    materia_data: MateriaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Crear una nueva materia.
    
    Requiere rol de admin.
    
    - **codigo_materia**: Código único de la materia
    - **nombre**: Nombre de la materia
    - **creditos**: Número de créditos (1-10)
    - **horas_semana**: Horas por semana (1-20)
    - **requiere_laboratorio**: Si requiere laboratorio
    - **tipo_aula_requerida**: Tipo de aula (normal, computo, laboratorio, auditorio)
    - **descripcion**: Descripción opcional
    """
    return materia_service.create_materia(db, materia_data)


@router.put("/{materia_id}", response_model=MateriaResponse)
def update_materia(
    materia_id: int,
    materia_data: MateriaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Actualizar una materia existente.
    
    Requiere rol de admin.
    """
    return materia_service.update_materia(db, materia_id, materia_data)


@router.patch("/{materia_id}/toggle-activo", response_model=MateriaResponse)
def toggle_materia_activo(
    materia_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Suspender o reactivar una materia.
    
    Requiere rol de admin.
    """
    return materia_service.toggle_materia_activo(db, materia_id)


@router.delete("/{materia_id}", response_model=MateriaResponse)
def delete_materia(
    materia_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Eliminar una materia (soft delete).
    
    Requiere rol de admin.
    """
    return materia_service.delete_materia(db, materia_id)
