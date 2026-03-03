"""
Router para endpoints de Versionado de Horarios.

Permite ver histórico, comparar versiones y hacer rollback.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.api.dependencies import get_current_active_coordinador, get_current_active_admin
from app.models import User
from app.services import horario_version_service
from app.schemas.horario_version import (
    HorarioVersionResponse,
    HorarioVersionListResponse,
    HorarioVersionDiffResponse,
    RollbackRequest,
)

router = APIRouter()


@router.get("/{horario_id}/versiones", response_model=HorarioVersionListResponse)
def get_versiones_horario(
    horario_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador),
):
    """
    Obtener histórico de versiones de un horario.
    
    Muestra todos los cambios realizados en el horario con metadata
    (quién, cuándo, por qué).
    """
    skip = (page - 1) * page_size
    versiones, total = horario_version_service.get_versiones_horario(
        db=db,
        horario_id=horario_id,
        skip=skip,
        limit=page_size,
    )
    
    return HorarioVersionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        versiones=[HorarioVersionResponse.from_orm(v) for v in versiones],
    )


@router.get("/{horario_id}/versiones/{version_numero}", response_model=HorarioVersionResponse)
def get_version_especifica(
    horario_id: int,
    version_numero: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador),
):
    """
    Obtener una versión específica de un horario.
    
    Retorna el snapshot completo del estado en ese momento.
    """
    version = horario_version_service.get_version_especifica(
        db=db,
        horario_id=horario_id,
        version_numero=version_numero,
    )
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Versión {version_numero} del horario {horario_id} no existe",
        )
    
    return HorarioVersionResponse.from_orm(version)


@router.get(
    "/{horario_id}/versiones/{version_num_1}/diff/{version_num_2}",
    response_model=HorarioVersionDiffResponse
)
def get_diferencias_entre_versiones(
    horario_id: int,
    version_num_1: int,
    version_num_2: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador),
):
    """
    Comparar dos versiones de un horario.
    
    Muestra exactamente qué cambió entre v1 y v2.
    
    **Ejemplo:**
    - GET /horarios/42/versiones/1/diff/3
    - Muestra qué cambió entre v1 y v3
    """
    diff = horario_version_service.get_diff_entre_versiones(
        db=db,
        horario_id=horario_id,
        version_num_1=version_num_1,
        version_num_2=version_num_2,
    )
    
    if not diff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pueden comparar versiones {version_num_1} y {version_num_2}",
        )
    
    return diff


@router.post("/{horario_id}/rollback", response_model=dict)
def rollback_horario(
    horario_id: int,
    request: RollbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin),
):
    """
    Revertir un horario a una versión anterior.
    
    **Importante:**
    - Solo administradores pueden hacer rollback
    - Se registra automáticamente como una nueva versión
    - Se vuelve a validar disponibilidad del docente y aula
    
    **Ejemplo:**
    ```json
    {
        "version_numero": 2,
        "razon": "Error en asignación de aula"
    }
    ```
    """
    horario = horario_version_service.rollback_a_version(
        db=db,
        horario_id=horario_id,
        version_numero=request.version_numero,
        razon=request.razon,
        usuario_id=current_user.id,
        usuario_nombre=f"{current_user.nombre} {current_user.apellido}",
    )
    
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el horario {horario_id} o la versión {request.version_numero}",
        )
    
    return {
        "mensaje": f"Horario {horario_id} revertido exitosamente a versión {request.version_numero}",
        "horario_id": horario_id,
        "nueva_version": horario_version_service.get_version_numero_siguiente(db, horario_id) - 1,
    }
