"""
Servicio para gestión de Aulas.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models import Aula
from app.schemas.aula import AulaCreate, AulaUpdate


def get_aulas(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    tipo: Optional[str] = None,
    edificio: Optional[str] = None,
    capacidad_min: Optional[int] = None,
    activo: Optional[bool] = None
) -> tuple[list[Aula], int]:
    """
    Obtener lista de aulas con filtros opcionales.
    
    Args:
        db: Sesión de base de datos
        skip: Número de registros a saltar
        limit: Número máximo de registros
        tipo: Filtrar por tipo de aula
        edificio: Filtrar por edificio
        capacidad_min: Filtrar por capacidad mínima
        activo: Filtrar por estado activo
        
    Returns:
        Tupla con (lista de aulas, total de registros)
    """
    query = db.query(Aula)
    
    # Aplicar filtros
    if tipo:
        query = query.filter(Aula.tipo.ilike(f"%{tipo}%"))
    if edificio:
        query = query.filter(Aula.edificio.ilike(f"%{edificio}%"))
    if capacidad_min is not None:
        query = query.filter(Aula.capacidad >= capacidad_min)
    if activo is not None:
        query = query.filter(Aula.activo == activo)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginación
    aulas = query.offset(skip).limit(limit).all()
    
    return aulas, total


def get_aula_by_id(db: Session, aula_id: int) -> Aula:
    """
    Obtener un aula por ID.
    
    Args:
        db: Sesión de base de datos
        aula_id: ID del aula
        
    Returns:
        Aula encontrada
        
    Raises:
        HTTPException: Si el aula no existe
    """
    aula = db.query(Aula).filter(Aula.id == aula_id).first()
    
    if not aula:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aula con ID {aula_id} no encontrada"
        )
    
    return aula


def get_aula_by_codigo(db: Session, codigo_aula: str) -> Optional[Aula]:
    """
    Obtener un aula por código.
    
    Args:
        db: Sesión de base de datos
        codigo_aula: Código del aula
        
    Returns:
        Aula encontrada o None
    """
    return db.query(Aula).filter(Aula.codigo_aula == codigo_aula).first()


def create_aula(db: Session, aula_data: AulaCreate) -> Aula:
    """
    Crear un nuevo aula.
    
    Args:
        db: Sesión de base de datos
        aula_data: Datos del aula a crear
        
    Returns:
        Aula creada
        
    Raises:
        HTTPException: Si el código ya existe
    """
    # Verificar que el código no exista
    if get_aula_by_codigo(db, aula_data.codigo_aula):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El código de aula '{aula_data.codigo_aula}' ya existe"
        )
    
    # Crear aula
    db_aula = Aula(
        codigo_aula=aula_data.codigo_aula,
        nombre=aula_data.nombre,
        capacidad=aula_data.capacidad,
        tipo=aula_data.tipo,
        edificio=aula_data.edificio,
        piso=aula_data.piso,
        activo=True
    )
    
    db.add(db_aula)
    db.commit()
    db.refresh(db_aula)
    
    return db_aula


def update_aula(db: Session, aula_id: int, aula_data: AulaUpdate) -> Aula:
    """
    Actualizar un aula existente.
    
    Args:
        db: Sesión de base de datos
        aula_id: ID del aula a actualizar
        aula_data: Datos a actualizar
        
    Returns:
        Aula actualizada
        
    Raises:
        HTTPException: Si el aula no existe o el código ya existe
    """
    aula = get_aula_by_id(db, aula_id)
    
    # Verificar código único si se está actualizando
    if aula_data.codigo_aula and aula_data.codigo_aula != aula.codigo_aula:
        existing = get_aula_by_codigo(db, aula_data.codigo_aula)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El código de aula '{aula_data.codigo_aula}' ya existe"
            )
    
    # Actualizar campos
    update_data = aula_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(aula, field, value)
    
    db.commit()
    db.refresh(aula)
    
    return aula


def delete_aula(db: Session, aula_id: int) -> Aula:
    """
    Eliminar un aula (soft delete).
    
    Args:
        db: Sesión de base de datos
        aula_id: ID del aula a eliminar
        
    Returns:
        Aula eliminada
        
    Raises:
        HTTPException: Si el aula no existe
    """
    aula = get_aula_by_id(db, aula_id)
    
    # Soft delete
    aula.activo = False
    
    db.commit()
    db.refresh(aula)
    
    return aula
