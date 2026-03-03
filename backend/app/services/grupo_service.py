"""
Servicio para gestión de Grupos.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models import Grupo
from app.schemas.grupo import GrupoCreate, GrupoUpdate


def get_grupos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    carrera: Optional[str] = None,
    semestre: Optional[int] = None,
    turno: Optional[str] = None,
    ciclo_escolar: Optional[str] = None,
    activo: Optional[bool] = None
) -> tuple[list[Grupo], int]:
    """
    Obtener lista de grupos con filtros opcionales.
    
    Args:
        db: Sesión de base de datos
        skip: Número de registros a saltar
        limit: Número máximo de registros
        carrera: Filtrar por carrera
        semestre: Filtrar por semestre
        turno: Filtrar por turno
        ciclo_escolar: Filtrar por ciclo escolar
        activo: Filtrar por estado activo
        
    Returns:
        Tupla con (lista de grupos, total de registros)
    """
    query = db.query(Grupo)
    
    # Aplicar filtros
    if carrera:
        query = query.filter(Grupo.carrera.ilike(f"%{carrera}%"))
    if semestre is not None:
        query = query.filter(Grupo.semestre == semestre)
    if turno:
        query = query.filter(Grupo.turno.ilike(f"%{turno}%"))
    if ciclo_escolar:
        query = query.filter(Grupo.ciclo_escolar == ciclo_escolar)
    if activo is not None:
        query = query.filter(Grupo.activo == activo)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginación
    grupos = query.offset(skip).limit(limit).all()
    
    return grupos, total


def get_grupo_by_id(db: Session, grupo_id: int) -> Grupo:
    """
    Obtener un grupo por ID.
    
    Args:
        db: Sesión de base de datos
        grupo_id: ID del grupo
        
    Returns:
        Grupo encontrado
        
    Raises:
        HTTPException: Si el grupo no existe
    """
    grupo = db.query(Grupo).filter(Grupo.id == grupo_id).first()
    
    if not grupo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grupo con ID {grupo_id} no encontrado"
        )
    
    return grupo


def get_grupo_by_codigo(db: Session, codigo_grupo: str) -> Optional[Grupo]:
    """
    Obtener un grupo por código.
    
    Args:
        db: Sesión de base de datos
        codigo_grupo: Código del grupo
        
    Returns:
        Grupo encontrado o None
    """
    return db.query(Grupo).filter(Grupo.codigo_grupo == codigo_grupo).first()


def create_grupo(db: Session, grupo_data: GrupoCreate) -> Grupo:
    """
    Crear un nuevo grupo.
    
    Args:
        db: Sesión de base de datos
        grupo_data: Datos del grupo a crear
        
    Returns:
        Grupo creado
        
    Raises:
        HTTPException: Si el código ya existe
    """
    # Verificar que el código no exista
    if get_grupo_by_codigo(db, grupo_data.codigo_grupo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El código de grupo '{grupo_data.codigo_grupo}' ya existe"
        )
    
    # Crear grupo
    db_grupo = Grupo(
        codigo_grupo=grupo_data.codigo_grupo,
        nombre=grupo_data.nombre,
        carrera=grupo_data.carrera,
        semestre=grupo_data.semestre,
        turno=grupo_data.turno,
        num_estudiantes=grupo_data.num_estudiantes,
        ciclo_escolar=grupo_data.ciclo_escolar,
        activo=True
    )
    
    db.add(db_grupo)
    db.commit()
    db.refresh(db_grupo)
    
    return db_grupo


def update_grupo(db: Session, grupo_id: int, grupo_data: GrupoUpdate) -> Grupo:
    """
    Actualizar un grupo existente.
    
    Args:
        db: Sesión de base de datos
        grupo_id: ID del grupo a actualizar
        grupo_data: Datos a actualizar
        
    Returns:
        Grupo actualizado
        
    Raises:
        HTTPException: Si el grupo no existe o el código ya existe
    """
    grupo = get_grupo_by_id(db, grupo_id)
    
    # Verificar código único si se está actualizando
    if grupo_data.codigo_grupo and grupo_data.codigo_grupo != grupo.codigo_grupo:
        existing = get_grupo_by_codigo(db, grupo_data.codigo_grupo)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El código de grupo '{grupo_data.codigo_grupo}' ya existe"
            )
    
    # Actualizar campos
    update_data = grupo_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(grupo, field, value)
    
    db.commit()
    db.refresh(grupo)
    
    return grupo


def delete_grupo(db: Session, grupo_id: int) -> Grupo:
    """
    Eliminar un grupo (soft delete).
    
    Args:
        db: Sesión de base de datos
        grupo_id: ID del grupo a eliminar
        
    Returns:
        Grupo eliminado
        
    Raises:
        HTTPException: Si el grupo no existe
    """
    grupo = get_grupo_by_id(db, grupo_id)
    
    # Soft delete
    grupo.activo = False
    
    db.commit()
    db.refresh(grupo)
    
    return grupo
