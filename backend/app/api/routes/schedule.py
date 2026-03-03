"""
Router para endpoints de generación de horarios.
"""
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services import schedule_generator
from app.services.snapshot_service import SnapshotService
from app.api.dependencies import get_current_active_admin, get_current_active_coordinador
from app.models import User

router = APIRouter()


@router.post("/generate", response_model=dict)
def generate_schedule(
    ciclo_escolar: str = Query(..., description="Ciclo escolar para generar horarios"),
    clear_existing: bool = Query(False, description="Eliminar horarios existentes del ciclo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Generar horarios automáticamente para un ciclo escolar.
    
    Requiere rol de admin.
    
    **Proceso:**
    1. Obtiene todas las asignaciones del ciclo
    2. Para cada asignación:
       - Calcula horas necesarias según materia
       - Busca aulas disponibles que cumplan requisitos
       - Asigna slots de tiempo (7:00-21:00 en bloques de 2 horas)
       - Valida conflictos
    3. Registra conflictos detectados en la BD
    
    **Parámetros:**
    - **ciclo_escolar**: Ciclo para generar (ej: "2024-1")
    - **clear_existing**: Si True, elimina horarios existentes del ciclo antes de generar
    
    **Retorna:**
    - Estadísticas de generación
    - Número de horarios creados
    - Conflictos detectados
    - Asignaciones fallidas
    """
    return schedule_generator.generate_schedule(db, ciclo_escolar, clear_existing)


@router.get("/{ciclo_escolar}/summary", response_model=dict)
def get_schedule_summary(
    ciclo_escolar: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener resumen del horario generado para un ciclo.
    
    Requiere rol de coordinador o admin.
    
    **Retorna:**
    - Total de asignaciones
    - Total de horarios generados
    - Conflictos pendientes
    - Porcentaje de cobertura
    """
    return schedule_generator.get_schedule_summary(db, ciclo_escolar)


@router.delete("/{ciclo_escolar}", response_model=dict)
def clear_schedule(
    ciclo_escolar: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Eliminar todos los horarios de un ciclo escolar.
    
    Requiere rol de admin.
    
    Los horarios se marcan como inactivos (soft delete).
    """
    schedule_generator._clear_schedule(db, ciclo_escolar)
    return {
        "message": f"Horarios del ciclo {ciclo_escolar} eliminados exitosamente"
    }


@router.get("/{ciclo_escolar}/versions", response_model=list)
def get_schedule_versions(
    ciclo_escolar: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener lista de todas las versiones (snapshots) del horario de un ciclo.
    
    Requiere rol de coordinador o admin.
    
    **Retorna:**
    Lista de versiones con:
    - id: ID del snapshot
    - version_numero: Número de versión (1, 2, 3...)
    - tipo_version: "auto", "manual", "backup"
    - descripcion: Descripción del cambio
    - created_at: Fecha/hora de creación
    - usuario_nombre: Nombre del usuario que la creó (si aplica)
    """
    versiones = SnapshotService.obtener_versiones(db, ciclo_escolar)
    return [
        {
            "id": v.id,
            "version_numero": v.version_numero,
            "tipo_version": v.tipo_version,
            "descripcion": v.descripcion,
            "created_at": v.created_at.isoformat(),
            "usuario_nombre": v.usuario_nombre,
            "num_horarios": len(v.horarios_data),
        }
        for v in versiones
    ]


@router.get("/versions/{snapshot_id}/grid", response_model=dict)
def get_schedule_grid(
    snapshot_id: int,
    grupo_id: Optional[int] = Query(None, description="Filtrar por grupo (opcional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener una vista de grid (Hora × Día de semana) de un snapshot.
    
    Requiere rol de coordinador o admin.
    
    **Parámetros:**
    - **snapshot_id**: ID del snapshot a visualizar
    - **grupo_id**: Filtrar por grupo (opcional)
    
    **Retorna:**
    Grid con estructura {dias: [...], horas: [...], grid: {dia: {hora: [horarios]}}}
    """
    grid = SnapshotService.obtener_grid_horarios(db, snapshot_id, grupo_id)
    if not grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Snapshot {snapshot_id} no encontrado"
        )
    return grid


@router.get("/versions/{snapshot_id}", response_model=dict)
def get_schedule_version(
    snapshot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_coordinador)
):
    """
    Obtener detalles de un snapshot específico.
    
    Requiere rol de coordinador o admin.
    
    **Retorna:**
    - Información del snapshot
    - Lista detallada de todos los horarios
    """
    snapshot = SnapshotService.obtener_version(db, snapshot_id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Snapshot {snapshot_id} no encontrado"
        )
    
    return {
        "id": snapshot.id,
        "ciclo_escolar": snapshot.ciclo_escolar,
        "version_numero": snapshot.version_numero,
        "tipo_version": snapshot.tipo_version,
        "descripcion": snapshot.descripcion,
        "created_at": snapshot.created_at.isoformat(),
        "usuario_nombre": snapshot.usuario_nombre,
        "horarios": snapshot.horarios_data,
    }
