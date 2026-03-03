"""
Router para endpoints de Grupos.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.grupo import (
    GrupoCreate,
    GrupoUpdate,
    GrupoResponse,
    GrupoListResponse
)
from app.services import grupo_service
from app.api.dependencies import get_current_active_admin, get_current_active_coordinador
from app.models import User

router = APIRouter()


@router.get("", response_model=GrupoListResponse)
def list_grupos(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    carrera: Optional[str] = Query(None, description="Filtrar por carrera"),
    semestre: Optional[int] = Query(None, ge=1, le=10, description="Filtrar por semestre"),
    turno: Optional[str] = Query(None, description="Filtrar por turno"),
    ciclo_escolar: Optional[str] = Query(None, description="Filtrar por ciclo escolar"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Listar grupos con paginación y filtros.
    
    Requiere rol de coordinador o admin.
    """
    skip = (page - 1) * page_size
    grupos, total = grupo_service.get_grupos(
        db=db,
        skip=skip,
        limit=page_size,
        carrera=carrera,
        semestre=semestre,
        turno=turno,
        ciclo_escolar=ciclo_escolar,
        activo=activo
    )
    
    return GrupoListResponse(
        total=total,
        page=page,
        page_size=page_size,
        grupos=grupos
    )


@router.get("/{grupo_id}", response_model=GrupoResponse)
def get_grupo(
    grupo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener un grupo por ID.
    
    Requiere rol de coordinador o admin.
    """
    return grupo_service.get_grupo_by_id(db, grupo_id)


@router.post("", response_model=GrupoResponse, status_code=status.HTTP_201_CREATED)
def create_grupo(
    grupo_data: GrupoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Crear un nuevo grupo.
    
    Requiere rol de admin.
    
    - **codigo_grupo**: Código único del grupo
    - **nombre**: Nombre del grupo
    - **carrera**: Carrera a la que pertenece
    - **semestre**: Semestre (1-10)
    - **turno**: Turno (matutino, vespertino, nocturno)
    - **num_estudiantes**: Número de estudiantes (1-100)
    - **ciclo_escolar**: Ciclo escolar (ej. 2024-1)
    """
    return grupo_service.create_grupo(db, grupo_data)


@router.put("/{grupo_id}", response_model=GrupoResponse)
def update_grupo(
    grupo_id: int,
    grupo_data: GrupoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Actualizar un grupo existente.
    
    Requiere rol de admin.
    """
    return grupo_service.update_grupo(db, grupo_id, grupo_data)


@router.delete("/{grupo_id}", response_model=GrupoResponse)
def delete_grupo(
    grupo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Eliminar un grupo (soft delete).
    
    Requiere rol de admin.
    """
    return grupo_service.delete_grupo(db, grupo_id)
