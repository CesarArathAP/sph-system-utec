"""
Servicio para gestión de Docentes.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from typing import Optional, List

from app.models import Docente, DisponibilidadDocente, User
from app.schemas.docente import DocenteCreate, DocenteUpdate, DisponibilidadCreate


def get_docentes(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    departamento: Optional[str] = None,
    activo: Optional[bool] = None
) -> tuple[List[Docente], int]:
    """
    Obtener lista de docentes con filtros opcionales.
    
    Args:
        db: Sesión de base de datos
        skip: Número de registros a saltar (paginación)
        limit: Número máximo de registros a devolver
        departamento: Filtrar por departamento
        activo: Filtrar por estado activo
        
    Returns:
        Tupla con (lista de docentes, total de registros)
    """
    query = db.query(Docente)
    
    # Aplicar filtros
    if departamento:
        query = query.filter(Docente.departamento.ilike(f"%{departamento}%"))
    if activo is not None:
        query = query.filter(Docente.activo == activo)
    
    # Contar total
    total = query.count()
    
    # Aplicar paginación
    docentes = query.offset(skip).limit(limit).all()
    
    return docentes, total


def get_docente_by_id(db: Session, docente_id: int) -> Docente:
    """
    Obtener un docente por ID.
    
    Args:
        db: Sesión de base de datos
        docente_id: ID del docente
        
    Returns:
        Docente encontrado
        
    Raises:
        HTTPException: Si el docente no existe
    """
    docente = db.query(Docente).filter(Docente.id == docente_id).first()
    
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Docente con ID {docente_id} no encontrado"
        )
    
    return docente


def get_docente_by_codigo(db: Session, codigo_docente: str) -> Optional[Docente]:
    """
    Obtener un docente por código.
    
    Args:
        db: Sesión de base de datos
        codigo_docente: Código del docente
        
    Returns:
        Docente encontrado o None
    """
    return db.query(Docente).filter(Docente.codigo_docente == codigo_docente).first()


def create_docente(db: Session, docente_data: DocenteCreate) -> Docente:
    """
    Crear un nuevo docente.
    
    Args:
        db: Sesión de base de datos
        docente_data: Datos del docente a crear
        
    Returns:
        Docente creado
        
    Raises:
        HTTPException: Si el código ya existe o el usuario no existe
    """
    # Verificar que el usuario existe
    user = db.query(User).filter(User.id == docente_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {docente_data.user_id} no encontrado"
        )
    
    # Verificar que el usuario no esté ya asignado a otro docente
    existing_docente = db.query(Docente).filter(Docente.user_id == docente_data.user_id).first()
    if existing_docente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuario ya está asignado a un docente"
        )
    
    # Verificar que el código no exista
    if get_docente_by_codigo(db, docente_data.codigo_docente):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El código de docente '{docente_data.codigo_docente}' ya existe"
        )
    
    # Crear docente
    db_docente = Docente(
        user_id=docente_data.user_id,
        codigo_docente=docente_data.codigo_docente,
        departamento=docente_data.departamento,
        horas_maximas_semana=docente_data.horas_maximas_semana,
        activo=True
    )
    
    db.add(db_docente)
    db.flush()  # Para obtener el ID sin hacer commit
    
    # Crear disponibilidades si se proporcionaron
    if docente_data.disponibilidades:
        for disp_data in docente_data.disponibilidades:
            disponibilidad = DisponibilidadDocente(
                docente_id=db_docente.id,
                dia_semana=disp_data.dia_semana,
                hora_inicio=disp_data.hora_inicio,
                hora_fin=disp_data.hora_fin
            )
            db.add(disponibilidad)
    
    db.commit()
    db.refresh(db_docente)
    
    return db_docente


def update_docente(db: Session, docente_id: int, docente_data: DocenteUpdate) -> Docente:
    """
    Actualizar un docente existente.
    
    Args:
        db: Sesión de base de datos
        docente_id: ID del docente a actualizar
        docente_data: Datos a actualizar
        
    Returns:
        Docente actualizado
        
    Raises:
        HTTPException: Si el docente no existe o el código ya existe
    """
    docente = get_docente_by_id(db, docente_id)
    
    # Verificar código único si se está actualizando
    if docente_data.codigo_docente and docente_data.codigo_docente != docente.codigo_docente:
        existing = get_docente_by_codigo(db, docente_data.codigo_docente)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El código de docente '{docente_data.codigo_docente}' ya existe"
            )
    
    # Actualizar campos
    update_data = docente_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(docente, field, value)
    
    db.commit()
    db.refresh(docente)
    
    return docente


def delete_docente(db: Session, docente_id: int) -> Docente:
    """
    Eliminar un docente (soft delete).
    
    Args:
        db: Sesión de base de datos
        docente_id: ID del docente a eliminar
        
    Returns:
        Docente eliminado
        
    Raises:
        HTTPException: Si el docente no existe
    """
    docente = get_docente_by_id(db, docente_id)
    
    # Soft delete
    docente.activo = False
    
    db.commit()
    db.refresh(docente)
    
    return docente


def add_disponibilidad(
    db: Session,
    docente_id: int,
    disponibilidades: List[DisponibilidadCreate]
) -> Docente:
    """
    Agregar disponibilidad a un docente.
    
    Args:
        db: Sesión de base de datos
        docente_id: ID del docente
        disponibilidades: Lista de disponibilidades a agregar
        
    Returns:
        Docente con disponibilidades actualizadas
    """
    docente = get_docente_by_id(db, docente_id)
    
    for disp_data in disponibilidades:
        # Verificar que no exista ya esta disponibilidad
        existing = db.query(DisponibilidadDocente).filter(
            and_(
                DisponibilidadDocente.docente_id == docente_id,
                DisponibilidadDocente.dia_semana == disp_data.dia_semana,
                DisponibilidadDocente.hora_inicio == disp_data.hora_inicio,
                DisponibilidadDocente.hora_fin == disp_data.hora_fin
            )
        ).first()
        
        if not existing:
            disponibilidad = DisponibilidadDocente(
                docente_id=docente_id,
                dia_semana=disp_data.dia_semana,
                hora_inicio=disp_data.hora_inicio,
                hora_fin=disp_data.hora_fin
            )
            db.add(disponibilidad)
    
    db.commit()
    db.refresh(docente)
    
    return docente


def replace_disponibilidad(
    db: Session,
    docente_id: int,
    disponibilidades: List[DisponibilidadCreate]
) -> Docente:
    """
    Reemplazar TODA la disponibilidad de un docente.

    Elimina todos los bloques existentes e inserta los nuevos.
    Si la lista llega vacía, el docente queda sin disponibilidad.
    
    Validación:
        - El total de horas no puede exceder horas_maximas_semana del docente
    
    Raises:
        HTTPException 422: Si el total de horas seleccionadas excede el máximo
    """
    docente = get_docente_by_id(db, docente_id)
    
    # ─ Validar límite de horas ─
    max_horas = docente.horas_maximas_semana or 40
    total_horas = len(disponibilidades)  # Cada slot = 1 hora
    
    if total_horas > max_horas:
        horas_excedidas = total_horas - max_horas
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "mensaje": (
                    f"No se puede registrar {total_horas}h. "
                    f"El docente '{docente.user.nombre if docente.user else 'N/A'}' "
                    f"tiene un máximo de {max_horas}h semanales."
                ),
                "disponibilidad": {
                    "horas_solicitadas": total_horas,
                    "horas_maximas": max_horas,
                    "horas_excedidas": horas_excedidas,
                    "sugerencia": f"Reduce la disponibilidad en al menos {horas_excedidas} {horas_excedidas == 1 and 'hora' or 'horas'}"
                }
            }
        )

    # 1. Borrar todo lo existente
    db.query(DisponibilidadDocente).filter(
        DisponibilidadDocente.docente_id == docente_id
    ).delete(synchronize_session=False)

    # 2. Insertar los nuevos
    for disp_data in disponibilidades:
        disponibilidad = DisponibilidadDocente(
            docente_id=docente_id,
            dia_semana=disp_data.dia_semana,
            hora_inicio=disp_data.hora_inicio,
            hora_fin=disp_data.hora_fin,
        )
        db.add(disponibilidad)

    db.commit()
    db.refresh(docente)

    return docente


def get_ocupaciones_docente(db: Session, docente_id: int) -> list[dict]:
    """
    Obtener las ocupaciones (horas asignadas en horarios activos) de un docente.
    
    Retorna los bloques de tiempo que ya están ocupados por horarios.
    Esto se usa para mostrar en la vista de disponibilidad qué horas están ocupadas.
    
    Args:
        db: Sesión de base de datos
        docente_id: ID del docente
        
    Returns:
        Lista de ocupaciones con detalles de la sesión:
        [{"dia_semana": "lunes", "hora_inicio": "08:00:00", "hora_fin": "09:00:00", "grupo_id": 1, 
          "materia_nombre": "Programación", "grupo_nombre": "1A", "aula_nombre": "A101"}]
    """
    from app.models import Horario, Asignacion, Materia, Grupo, Aula
    
    # Obtener todos los horarios ACTIVOS de este docente con información detallada
    ocupaciones = (
        db.query(
            Horario.id,
            Horario.dia_semana,
            Horario.hora_inicio,
            Horario.hora_fin,
            Asignacion.grupo_id,
            Materia.nombre.label("materia_nombre"),
            Grupo.nombre.label("grupo_nombre"),
            Aula.nombre.label("aula_nombre")
        )
        .join(Asignacion, Horario.asignacion_id == Asignacion.id)
        .join(Materia, Asignacion.materia_id == Materia.id)
        .join(Grupo, Asignacion.grupo_id == Grupo.id)
        .join(Aula, Horario.aula_id == Aula.id)
        .filter(
            Asignacion.docente_id == docente_id,
            Horario.activo == True
        )
        .all()
    )
    
    # Convertir a lista de diccionarios
    resultado = []
    for ocu in ocupaciones:
        resultado.append({
            "id": ocu.id,
            "dia_semana": ocu.dia_semana.value if hasattr(ocu.dia_semana, 'value') else str(ocu.dia_semana),
            "hora_inicio": str(ocu.hora_inicio),
            "hora_fin": str(ocu.hora_fin),
            "grupo_id": ocu.grupo_id,
            "materia_nombre": ocu.materia_nombre,
            "grupo_nombre": ocu.grupo_nombre,
            "aula_nombre": ocu.aula_nombre
        })
    
    return resultado
