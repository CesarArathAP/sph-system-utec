"""
Router para endpoints de generación de horarios.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services import schedule_generator
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
