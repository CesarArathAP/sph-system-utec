"""
Servicio para gestión de Materias.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models import Materia
from app.schemas.materia import MateriaCreate, MateriaUpdate


def get_materias(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    requiere_laboratorio: Optional[bool] = None,
    tipo_aula: Optional[str] = None,
    activo: Optional[bool] = None
) -> tuple[list[Materia], int]:
    """
    Obtener lista de materias con filtros opcionales.
    
    Args:
        db: Sesión de base de datos
        skip: Número de registros a saltar
        limit: Número máximo de registros
        requiere_laboratorio: Filtrar por requerimiento de laboratorio
        tipo_aula: Filtrar por tipo de aula requerida
        activo: Filtrar por estado activo
        
    Returns:
        Tupla con (lista de materias, total de registros)
    """
    query = db.query(Materia)
    
    # Aplicar filtros
    if requiere_laboratorio is not None:
        query = query.filter(Materia.requiere_laboratorio == requiere_laboratorio)
    if tipo_aula:
        query = query.filter(Materia.tipo_aula_requerida == tipo_aula)
    if activo is not None:
        query = query.filter(Materia.activo == activo)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginación
    materias = query.offset(skip).limit(limit).all()
    
    return materias, total


def get_materia_by_id(db: Session, materia_id: int) -> Materia:
    """
    Obtener una materia por ID.
    
    Args:
        db: Sesión de base de datos
        materia_id: ID de la materia
        
    Returns:
        Materia encontrada
        
    Raises:
        HTTPException: Si la materia no existe
    """
    materia = db.query(Materia).filter(Materia.id == materia_id).first()
    
    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Materia con ID {materia_id} no encontrada"
        )
    
    return materia


def get_materia_by_codigo(db: Session, codigo_materia: str) -> Optional[Materia]:
    """
    Obtener una materia por código.
    
    Args:
        db: Sesión de base de datos
        codigo_materia: Código de la materia
        
    Returns:
        Materia encontrada o None
    """
    return db.query(Materia).filter(Materia.codigo_materia == codigo_materia).first()


def create_materia(db: Session, materia_data: MateriaCreate) -> Materia:
    """
    Crear una nueva materia.
    
    Args:
        db: Sesión de base de datos
        materia_data: Datos de la materia a crear
        
    Returns:
        Materia creada
        
    Raises:
        HTTPException: Si el código ya existe
    """
    # Verificar que el código no exista
    if get_materia_by_codigo(db, materia_data.codigo_materia):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El código de materia '{materia_data.codigo_materia}' ya existe"
        )
    
    # Crear materia
    db_materia = Materia(
        codigo_materia=materia_data.codigo_materia,
        nombre=materia_data.nombre,
        creditos=materia_data.creditos,
        horas_semana=materia_data.horas_semana,
        requiere_laboratorio=materia_data.requiere_laboratorio,
        tipo_aula_requerida=materia_data.tipo_aula_requerida,
        descripcion=materia_data.descripcion,
        activo=True
    )
    
    db.add(db_materia)
    db.commit()
    db.refresh(db_materia)
    
    return db_materia


def update_materia(db: Session, materia_id: int, materia_data: MateriaUpdate) -> Materia:
    """
    Actualizar una materia existente.
    
    Args:
        db: Sesión de base de datos
        materia_id: ID de la materia a actualizar
        materia_data: Datos a actualizar
        
    Returns:
        Materia actualizada
        
    Raises:
        HTTPException: Si la materia no existe o el código ya existe
    """
    materia = get_materia_by_id(db, materia_id)
    
    # Verificar código único si se está actualizando
    if materia_data.codigo_materia and materia_data.codigo_materia != materia.codigo_materia:
        existing = get_materia_by_codigo(db, materia_data.codigo_materia)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El código de materia '{materia_data.codigo_materia}' ya existe"
            )
    
    # Actualizar campos
    update_data = materia_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(materia, field, value)
    
    db.commit()
    db.refresh(materia)
    
    return materia


def delete_materia(db: Session, materia_id: int) -> Materia:
    """
    Eliminar una materia (soft delete).
    
    Args:
        db: Sesión de base de datos
        materia_id: ID de la materia a eliminar
        
    Returns:
        Materia eliminada
        
    Raises:
        HTTPException: Si la materia no existe
    """
    materia = get_materia_by_id(db, materia_id)
    
    # Soft delete
    materia.activo = False
    
    db.commit()
    db.refresh(materia)
    
    return materia
