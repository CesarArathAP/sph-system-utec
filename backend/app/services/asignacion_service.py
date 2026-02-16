"""
Servicio para gestión de Asignaciones.
"""
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import Optional

from app.models import Asignacion, Grupo, Materia, Docente
from app.schemas.asignacion import AsignacionCreate, AsignacionUpdate


def get_asignaciones(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    grupo_id: Optional[int] = None,
    materia_id: Optional[int] = None,
    docente_id: Optional[int] = None,
    ciclo_escolar: Optional[str] = None
) -> tuple[list[Asignacion], int]:
    """
    Obtener lista de asignaciones con filtros opcionales.
    
    Args:
        db: Sesión de base de datos
        skip: Número de registros a saltar
        limit: Número máximo de registros
        grupo_id: Filtrar por grupo
        materia_id: Filtrar por materia
        docente_id: Filtrar por docente
        ciclo_escolar: Filtrar por ciclo escolar
        
    Returns:
        Tupla con (lista de asignaciones, total de registros)
    """
    query = db.query(Asignacion).options(
        joinedload(Asignacion.grupo),
        joinedload(Asignacion.materia),
        joinedload(Asignacion.docente)
    )
    
    # Aplicar filtros
    if grupo_id is not None:
        query = query.filter(Asignacion.grupo_id == grupo_id)
    if materia_id is not None:
        query = query.filter(Asignacion.materia_id == materia_id)
    if docente_id is not None:
        query = query.filter(Asignacion.docente_id == docente_id)
    if ciclo_escolar:
        query = query.filter(Asignacion.ciclo_escolar == ciclo_escolar)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginación
    asignaciones = query.offset(skip).limit(limit).all()
    
    return asignaciones, total


def get_asignacion_by_id(db: Session, asignacion_id: int) -> Asignacion:
    """
    Obtener una asignación por ID.
    
    Args:
        db: Sesión de base de datos
        asignacion_id: ID de la asignación
        
    Returns:
        Asignación encontrada
        
    Raises:
        HTTPException: Si la asignación no existe
    """
    asignacion = db.query(Asignacion).options(
        joinedload(Asignacion.grupo),
        joinedload(Asignacion.materia),
        joinedload(Asignacion.docente)
    ).filter(Asignacion.id == asignacion_id).first()
    
    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asignación con ID {asignacion_id} no encontrada"
        )
    
    return asignacion


def create_asignacion(db: Session, asignacion_data: AsignacionCreate) -> Asignacion:
    """
    Crear una nueva asignación.
    
    Args:
        db: Sesión de base de datos
        asignacion_data: Datos de la asignación a crear
        
    Returns:
        Asignación creada
        
    Raises:
        HTTPException: Si hay errores de validación
    """
    # Verificar que el grupo existe y está activo
    grupo = db.query(Grupo).filter(Grupo.id == asignacion_data.grupo_id).first()
    if not grupo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grupo con ID {asignacion_data.grupo_id} no encontrado"
        )
    if not grupo.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El grupo '{grupo.nombre}' no está activo"
        )
    
    # Verificar que la materia existe y está activa
    materia = db.query(Materia).filter(Materia.id == asignacion_data.materia_id).first()
    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Materia con ID {asignacion_data.materia_id} no encontrada"
        )
    if not materia.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La materia '{materia.nombre}' no está activa"
        )
    
    # Verificar que el docente existe y está activo
    docente = db.query(Docente).filter(Docente.id == asignacion_data.docente_id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Docente con ID {asignacion_data.docente_id} no encontrado"
        )
    if not docente.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El docente con código '{docente.codigo_docente}' no está activo"
        )
    
    # Verificar que no exista ya esta asignación
    existing = db.query(Asignacion).filter(
        Asignacion.grupo_id == asignacion_data.grupo_id,
        Asignacion.materia_id == asignacion_data.materia_id,
        Asignacion.ciclo_escolar == asignacion_data.ciclo_escolar
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una asignación para el grupo '{grupo.nombre}' "
                   f"y la materia '{materia.nombre}' en el ciclo {asignacion_data.ciclo_escolar}"
        )
    
    # Crear asignación
    db_asignacion = Asignacion(
        grupo_id=asignacion_data.grupo_id,
        materia_id=asignacion_data.materia_id,
        docente_id=asignacion_data.docente_id,
        ciclo_escolar=asignacion_data.ciclo_escolar
    )
    
    db.add(db_asignacion)
    db.commit()
    db.refresh(db_asignacion)
    
    # Cargar relaciones
    db.refresh(db_asignacion)
    asignacion = get_asignacion_by_id(db, db_asignacion.id)
    
    return asignacion


def update_asignacion(db: Session, asignacion_id: int, asignacion_data: AsignacionUpdate) -> Asignacion:
    """
    Actualizar una asignación existente.
    
    Args:
        db: Sesión de base de datos
        asignacion_id: ID de la asignación a actualizar
        asignacion_data: Datos a actualizar
        
    Returns:
        Asignación actualizada
        
    Raises:
        HTTPException: Si la asignación no existe o hay errores de validación
    """
    asignacion = get_asignacion_by_id(db, asignacion_id)
    
    # Actualizar campos
    update_data = asignacion_data.model_dump(exclude_unset=True)
    
    # Validar grupo si se está actualizando
    if "grupo_id" in update_data:
        grupo = db.query(Grupo).filter(Grupo.id == update_data["grupo_id"]).first()
        if not grupo or not grupo.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grupo inválido o inactivo"
            )
    
    # Validar materia si se está actualizando
    if "materia_id" in update_data:
        materia = db.query(Materia).filter(Materia.id == update_data["materia_id"]).first()
        if not materia or not materia.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Materia inválida o inactiva"
            )
    
    # Validar docente si se está actualizando
    if "docente_id" in update_data:
        docente = db.query(Docente).filter(Docente.id == update_data["docente_id"]).first()
        if not docente or not docente.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Docente inválido o inactivo"
            )
    
    for field, value in update_data.items():
        setattr(asignacion, field, value)
    
    db.commit()
    db.refresh(asignacion)
    
    return get_asignacion_by_id(db, asignacion_id)


def delete_asignacion(db: Session, asignacion_id: int) -> Asignacion:
    """
    Eliminar una asignación.
    
    Args:
        db: Sesión de base de datos
        asignacion_id: ID de la asignación a eliminar
        
    Returns:
        Asignación eliminada
        
    Raises:
        HTTPException: Si la asignación no existe
    """
    asignacion = get_asignacion_by_id(db, asignacion_id)
    
    # Eliminar asignación (esto también eliminará los horarios asociados por cascade)
    db.delete(asignacion)
    db.commit()
    
    return asignacion
