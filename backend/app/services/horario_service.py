"""
Servicio para gestión de Horarios.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from typing import Optional
from datetime import time

from app.models import Horario, Asignacion, Aula, Grupo, Materia, Docente
from app.schemas.horario import HorarioCreate, HorarioUpdate, ConflictoResponse


def get_horarios(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    asignacion_id: Optional[int] = None,
    aula_id: Optional[int] = None,
    dia_semana: Optional[str] = None,
    activo: Optional[bool] = None
) -> tuple[list[Horario], int]:
    """
    Obtener lista de horarios con filtros opcionales.
    
    Args:
        db: Sesión de base de datos
        skip: Número de registros a saltar
        limit: Número máximo de registros
        asignacion_id: Filtrar por asignación
        aula_id: Filtrar por aula
        dia_semana: Filtrar por día de la semana
        activo: Filtrar por estado activo
        
    Returns:
        Tupla con (lista de horarios, total de registros)
    """
    query = db.query(Horario).options(
        joinedload(Horario.asignacion).joinedload(Asignacion.grupo),
        joinedload(Horario.asignacion).joinedload(Asignacion.materia),
        joinedload(Horario.asignacion).joinedload(Asignacion.docente),
        joinedload(Horario.aula)
    )
    
    # Aplicar filtros
    if asignacion_id is not None:
        query = query.filter(Horario.asignacion_id == asignacion_id)
    if aula_id is not None:
        query = query.filter(Horario.aula_id == aula_id)
    if dia_semana:
        query = query.filter(Horario.dia_semana == dia_semana)
    if activo is not None:
        query = query.filter(Horario.activo == activo)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginación
    horarios = query.offset(skip).limit(limit).all()
    
    return horarios, total


def get_horario_by_id(db: Session, horario_id: int) -> Horario:
    """
    Obtener un horario por ID.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario
        
    Returns:
        Horario encontrado
        
    Raises:
        HTTPException: Si el horario no existe
    """
    horario = db.query(Horario).options(
        joinedload(Horario.asignacion).joinedload(Asignacion.grupo),
        joinedload(Horario.asignacion).joinedload(Asignacion.materia),
        joinedload(Horario.asignacion).joinedload(Asignacion.docente),
        joinedload(Horario.aula)
    ).filter(Horario.id == horario_id).first()
    
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Horario con ID {horario_id} no encontrado"
        )
    
    return horario


def check_conflicts(
    db: Session,
    asignacion_id: int,
    aula_id: int,
    dia_semana: str,
    hora_inicio: time,
    hora_fin: time,
    exclude_horario_id: Optional[int] = None
) -> list[ConflictoResponse]:
    """
    Verificar conflictos para un horario.
    
    Args:
        db: Sesión de base de datos
        asignacion_id: ID de la asignación
        aula_id: ID del aula
        dia_semana: Día de la semana
        hora_inicio: Hora de inicio
        hora_fin: Hora de fin
        exclude_horario_id: ID de horario a excluir (para updates)
        
    Returns:
        Lista de conflictos detectados
    """
    conflictos = []
    
    # Obtener la asignación
    asignacion = db.query(Asignacion).options(
        joinedload(Asignacion.grupo),
        joinedload(Asignacion.docente)
    ).filter(Asignacion.id == asignacion_id).first()
    
    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asignación con ID {asignacion_id} no encontrada"
        )
    
    # Query base para horarios que se traslapen en tiempo
    time_overlap_query = db.query(Horario).filter(
        Horario.dia_semana == dia_semana,
        Horario.activo == True,
        or_(
            # Caso 1: El nuevo horario empieza durante un horario existente
            and_(
                Horario.hora_inicio <= hora_inicio,
                Horario.hora_fin > hora_inicio
            ),
            # Caso 2: El nuevo horario termina durante un horario existente
            and_(
                Horario.hora_inicio < hora_fin,
                Horario.hora_fin >= hora_fin
            ),
            # Caso 3: El nuevo horario contiene completamente un horario existente
            and_(
                Horario.hora_inicio >= hora_inicio,
                Horario.hora_fin <= hora_fin
            )
        )
    )
    
    if exclude_horario_id:
        time_overlap_query = time_overlap_query.filter(Horario.id != exclude_horario_id)
    
    # 1. Conflicto de aula (misma aula, mismo tiempo)
    aula_conflicts = time_overlap_query.filter(
        Horario.aula_id == aula_id
    ).all()
    
    for conflict in aula_conflicts:
        conflictos.append(ConflictoResponse(
            tipo="AULA_DOBLE_ASIGNACION",
            descripcion=f"El aula ya está ocupada en este horario",
            horario1_id=conflict.id,
            detalles={
                "aula_id": aula_id,
                "dia": dia_semana,
                "hora_inicio": str(hora_inicio),
                "hora_fin": str(hora_fin)
            }
        ))
    
    # 2. Conflicto de docente (mismo docente, mismo tiempo)
    docente_conflicts = time_overlap_query.join(
        Asignacion, Horario.asignacion_id == Asignacion.id
    ).filter(
        Asignacion.docente_id == asignacion.docente_id
    ).all()
    
    for conflict in docente_conflicts:
        conflictos.append(ConflictoResponse(
            tipo="DOCENTE_DOBLE_ASIGNACION",
            descripcion=f"El docente ya tiene clase en este horario",
            horario1_id=conflict.id,
            detalles={
                "docente_id": asignacion.docente_id,
                "dia": dia_semana,
                "hora_inicio": str(hora_inicio),
                "hora_fin": str(hora_fin)
            }
        ))
    
    # 3. Conflicto de grupo (mismo grupo, mismo tiempo)
    grupo_conflicts = time_overlap_query.join(
        Asignacion, Horario.asignacion_id == Asignacion.id
    ).filter(
        Asignacion.grupo_id == asignacion.grupo_id
    ).all()
    
    for conflict in grupo_conflicts:
        conflictos.append(ConflictoResponse(
            tipo="GRUPO_DOBLE_ASIGNACION",
            descripcion=f"El grupo ya tiene clase en este horario",
            horario1_id=conflict.id,
            detalles={
                "grupo_id": asignacion.grupo_id,
                "dia": dia_semana,
                "hora_inicio": str(hora_inicio),
                "hora_fin": str(hora_fin)
            }
        ))
    
    return conflictos


def create_horario(db: Session, horario_data: HorarioCreate, allow_conflicts: bool = True) -> Horario:
    """
    Crear un nuevo horario.
    
    Args:
        db: Sesión de base de datos
        horario_data: Datos del horario a crear
        allow_conflicts: Si True, permite crear horarios con conflictos y los registra
        
    Returns:
        Horario creado
        
    Raises:
        HTTPException: Si hay errores de validación o conflictos (cuando allow_conflicts=False)
    """
    from app.models import Conflicto
    from datetime import datetime
    
    # Verificar que la asignación existe
    asignacion = db.query(Asignacion).filter(
        Asignacion.id == horario_data.asignacion_id
    ).first()
    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asignación con ID {horario_data.asignacion_id} no encontrada"
        )
    
    # Verificar que el aula existe y está activa
    aula = db.query(Aula).filter(Aula.id == horario_data.aula_id).first()
    if not aula:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aula con ID {horario_data.aula_id} no encontrada"
        )
    if not aula.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El aula '{aula.nombre}' no está activa"
        )
    
    # Verificar conflictos
    conflictos = check_conflicts(
        db=db,
        asignacion_id=horario_data.asignacion_id,
        aula_id=horario_data.aula_id,
        dia_semana=horario_data.dia_semana,
        hora_inicio=horario_data.hora_inicio,
        hora_fin=horario_data.hora_fin
    )
    
    if conflictos and not allow_conflicts:
        # Modo estricto: bloquear creación
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Se detectaron conflictos de horario",
                "conflictos": [c.model_dump() for c in conflictos]
            }
        )
    
    # Crear horario (incluso si hay conflictos)
    db_horario = Horario(
        asignacion_id=horario_data.asignacion_id,
        aula_id=horario_data.aula_id,
        dia_semana=horario_data.dia_semana,
        hora_inicio=horario_data.hora_inicio,
        hora_fin=horario_data.hora_fin,
        tipo_sesion=horario_data.tipo_sesion,
        activo=True
    )
    
    db.add(db_horario)
    db.commit()
    db.refresh(db_horario)
    
    # Si hay conflictos, registrarlos en la tabla
    if conflictos:
        for conflicto_data in conflictos:
            conflicto = Conflicto(
                horario_id=db_horario.id,
                tipo_conflicto=_map_conflict_type(conflicto_data.tipo),
                descripcion=conflicto_data.descripcion,
                resuelto=False
            )
            db.add(conflicto)
        
        db.commit()
    
    return get_horario_by_id(db, db_horario.id)


def _map_conflict_type(tipo: str) -> str:
    """Mapear tipos de conflicto a enum de BD."""
    mapping = {
        "AULA_DOBLE_ASIGNACION": "aula_ocupada",
        "DOCENTE_DOBLE_ASIGNACION": "docente_ocupado",
        "GRUPO_DOBLE_ASIGNACION": "grupo_ocupado"
    }
    return mapping.get(tipo, "aula_ocupada")


def update_horario(db: Session, horario_id: int, horario_data: HorarioUpdate) -> Horario:
    """
    Actualizar un horario existente.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario a actualizar
        horario_data: Datos a actualizar
        
    Returns:
        Horario actualizado
        
    Raises:
        HTTPException: Si el horario no existe o hay conflictos
    """
    horario = get_horario_by_id(db, horario_id)
    
    # Preparar datos para validación de conflictos
    update_data = horario_data.model_dump(exclude_unset=True)
    
    asignacion_id = update_data.get('asignacion_id', horario.asignacion_id)
    aula_id = update_data.get('aula_id', horario.aula_id)
    dia_semana = update_data.get('dia_semana', horario.dia_semana)
    hora_inicio = update_data.get('hora_inicio', horario.hora_inicio)
    hora_fin = update_data.get('hora_fin', horario.hora_fin)
    
    # Verificar conflictos si se están cambiando datos relevantes
    if any(key in update_data for key in ['asignacion_id', 'aula_id', 'dia_semana', 'hora_inicio', 'hora_fin']):
        conflictos = check_conflicts(
            db=db,
            asignacion_id=asignacion_id,
            aula_id=aula_id,
            dia_semana=dia_semana,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
            exclude_horario_id=horario_id
        )
        
        if conflictos:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Se detectaron conflictos de horario",
                    "conflictos": [c.model_dump() for c in conflictos]
                }
            )
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(horario, field, value)
    
    db.commit()
    db.refresh(horario)
    
    return get_horario_by_id(db, horario_id)


def delete_horario(db: Session, horario_id: int) -> Horario:
    """
    Eliminar un horario (soft delete).
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario a eliminar
        
    Returns:
        Horario eliminado
        
    Raises:
        HTTPException: Si el horario no existe
    """
    horario = get_horario_by_id(db, horario_id)
    
    # Soft delete
    horario.activo = False
    
    db.commit()
    db.refresh(horario)
    
    return horario


def detect_all_conflicts(db: Session, ciclo_escolar: Optional[str] = None) -> list[ConflictoResponse]:
    """
    Detectar todos los conflictos en los horarios.
    
    Args:
        db: Sesión de base de datos
        ciclo_escolar: Filtrar por ciclo escolar
        
    Returns:
        Lista de todos los conflictos detectados
    """
    conflictos = []
    
    # Obtener todos los horarios activos
    query = db.query(Horario).filter(Horario.activo == True)
    
    if ciclo_escolar:
        query = query.join(Asignacion).filter(Asignacion.ciclo_escolar == ciclo_escolar)
    
    horarios = query.all()
    
    # Verificar cada horario contra los demás
    for i, horario in enumerate(horarios):
        conflicts = check_conflicts(
            db=db,
            asignacion_id=horario.asignacion_id,
            aula_id=horario.aula_id,
            dia_semana=horario.dia_semana,
            hora_inicio=horario.hora_inicio,
            hora_fin=horario.hora_fin,
            exclude_horario_id=horario.id
        )
        
        for conflict in conflicts:
            conflict.horario2_id = horario.id
            conflictos.append(conflict)
    
    return conflictos


def get_registered_conflicts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    resuelto: Optional[bool] = None,
    horario_id: Optional[int] = None
) -> tuple[list, int]:
    """
    Obtener conflictos registrados en la base de datos.
    
    Args:
        db: Sesión de base de datos
        skip: Número de registros a saltar
        limit: Número máximo de registros
        resuelto: Filtrar por estado resuelto
        horario_id: Filtrar por horario
        
    Returns:
        Tupla con (lista de conflictos, total de registros)
    """
    from app.models import Conflicto
    
    query = db.query(Conflicto).options(
        joinedload(Conflicto.horario)
    )
    
    if resuelto is not None:
        query = query.filter(Conflicto.resuelto == resuelto)
    if horario_id is not None:
        query = query.filter(Conflicto.horario_id == horario_id)
    
    total = query.count()
    conflictos = query.offset(skip).limit(limit).all()
    
    return conflictos, total


def resolve_conflict(db: Session, conflicto_id: int) -> dict:
    """
    Marcar un conflicto como resuelto.
    
    Args:
        db: Sesión de base de datos
        conflicto_id: ID del conflicto a resolver
        
    Returns:
        Conflicto actualizado
        
    Raises:
        HTTPException: Si el conflicto no existe
    """
    from app.models import Conflicto
    from datetime import datetime
    
    conflicto = db.query(Conflicto).filter(Conflicto.id == conflicto_id).first()
    
    if not conflicto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflicto con ID {conflicto_id} no encontrado"
        )
    
    if conflicto.resuelto:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El conflicto ya está marcado como resuelto"
        )
    
    conflicto.resuelto = True
    conflicto.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(conflicto)
    
    return conflicto
