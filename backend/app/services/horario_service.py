"""
Servicio para gestión de Horarios.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from typing import Optional
from datetime import time, datetime

from app.models import Horario, Asignacion, Aula, Grupo, Materia, Docente, DisponibilidadDocente
from app.models.conflicto import Conflicto
from app.schemas.horario import HorarioCreate, HorarioUpdate, ConflictoResponse
from app.services import horario_version_service

DIAS_ES = {
    "lunes": "lunes", "martes": "martes", "miercoles": "miércoles",
    "jueves": "jueves", "viernes": "viernes", "sabado": "sábado",
}


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


def check_docente_disponibilidad(
    db: Session,
    docente_id: int,
    dia_semana: str,
    hora_inicio: time,
    hora_fin: time,
) -> None:
    """
    Verifica que el docente tenga disponibilidad registrada que cubra
    completamente el bloque [hora_inicio, hora_fin) del día dado.

    Si el docente no tiene disponibilidad registrada en absoluto se permite
    (no se bloquea, sólo se valida cuando hay registros de disponibilidad).

    Raises:
        HTTPException 422 con mensaje descriptivo y los slots disponibles
        del docente en ese día si el bloque solicitado no está cubierto.
    """
    slots_dia = (
        db.query(DisponibilidadDocente)
        .join(Docente, DisponibilidadDocente.docente_id == Docente.id)
        .filter(
            DisponibilidadDocente.docente_id == docente_id,
            DisponibilidadDocente.dia_semana == dia_semana,
        )
        .order_by(DisponibilidadDocente.hora_inicio)
        .all()
    )

    # Si no hay disponibilidad registrada para ese día, dejar pasar
    if not slots_dia:
        return

    # Obtener datos del docente para el mensaje
    docente = db.query(Docente).filter(Docente.id == docente_id).first()
    docente_nombre = "el docente"
    if docente and docente.user:
        docente_nombre = f"{docente.user.nombre} {docente.user.apellido}"

    # ── Verificar que el bloque esté cubierto por la disponibilidad ──
    # El bloque [hora_inicio, hora_fin) debe estar completamente cubierto
    # por la unión de los slots de disponibilidad.
    bloques_cubiertos = False
    h_ini = hora_inicio
    h_fin = hora_fin

    # Recorremos los slots en orden; unimos aquellos que sean contiguos
    cursor = None  # hora hasta la que hemos cubierto
    for slot in slots_dia:
        slot_ini = slot.hora_inicio if isinstance(slot.hora_inicio, time) else time.fromisoformat(str(slot.hora_inicio))
        slot_fin = slot.hora_fin   if isinstance(slot.hora_fin,   time) else time.fromisoformat(str(slot.hora_fin))

        if slot_ini <= h_ini:
            # Este slot cubre al menos el inicio
            cursor = slot_fin if cursor is None else max(cursor, slot_fin)
        elif cursor is not None and slot_ini <= cursor:
            # Extiende la cobertura continua
            cursor = max(cursor, slot_fin)

    if cursor is not None and cursor >= h_fin:
        bloques_cubiertos = True

    if bloques_cubiertos:
        return  # ✓ Todo bien

    # ── Construir mensaje de error con los slots disponibles ──
    dia_legible = DIAS_ES.get(dia_semana, dia_semana)
    slots_txt = ", ".join(
        f"{str(s.hora_inicio)[:5]}–{str(s.hora_fin)[:5]}"
        for s in slots_dia
    )

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail={
            "mensaje": (
                f"No se puede crear el horario: {docente_nombre} no tiene disponibilidad "
                f"registrada el {dia_legible} de "
                f"{str(hora_inicio)[:5]} a {str(hora_fin)[:5]}."
            ),
            "disponibilidad_docente": {
                "dia": dia_legible,
                "franjas_disponibles": slots_txt or "ninguna",
                "sugerencia": (
                    f"Puede dar clase el {dia_legible} en los siguientes rangos: "
                    f"{slots_txt}" if slots_txt else
                    f"{docente_nombre} no tiene ninguna franja disponible el {dia_legible}."
                ),
            },
        },
    )


def check_horas_maximas_docente(
    db: Session,
    docente_id: int,
    hora_inicio: time,
    hora_fin: time,
    exclude_horario_id: int | None = None,
) -> None:
    """
    Verifica que asignar el bloque [hora_inicio, hora_fin] al docente
    no supere su límite de horas_maximas_semana.

    Suma las duraciones de todos los horarios activos del docente
    (sin contar el excluido, para ediciones) y compara con el límite.

    Raises:
        HTTPException 422 con mensaje descriptivo si se supera el límite.
    """
    from datetime import datetime as dt

    docente = db.query(Docente).filter(Docente.id == docente_id).first()
    if not docente:
        return  # si no existe, el check de asignación ya lo bloqueará

    limite = docente.horas_maximas_semana or 40  # default 40 si nulo

    # Calcular duración del nuevo bloque en horas
    def _horas(ini: time, fin: time) -> float:
        ini_dt = dt(2000, 1, 1, ini.hour, ini.minute, ini.second)
        fin_dt = dt(2000, 1, 1, fin.hour, fin.minute, fin.second)
        return max((fin_dt - ini_dt).total_seconds() / 3600, 0)

    nuevo_bloque_h = _horas(hora_inicio, hora_fin)

    # Sumar todas las horas activas del docente en la semana
    horarios_docente = (
        db.query(Horario)
        .join(Asignacion, Horario.asignacion_id == Asignacion.id)
        .filter(
            Asignacion.docente_id == docente_id,
            Horario.activo == True,
        )
    )
    if exclude_horario_id:
        horarios_docente = horarios_docente.filter(Horario.id != exclude_horario_id)

    horas_actuales = sum(
        _horas(
            h.hora_inicio if isinstance(h.hora_inicio, time) else time.fromisoformat(str(h.hora_inicio)),
            h.hora_fin    if isinstance(h.hora_fin,    time) else time.fromisoformat(str(h.hora_fin)),
        )
        for h in horarios_docente.all()
    )

    total = horas_actuales + nuevo_bloque_h

    if total > limite:
        docente_nombre = "El docente"
        if docente.user:
            docente_nombre = f"{docente.user.nombre} {docente.user.apellido}"

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "mensaje": (
                    f"No se puede crear el horario: {docente_nombre} alcanzaría "
                    f"{total:.1f}h semanales, superando su límite de {limite}h."
                ),
                "horas_maximas": {
                    "limite": limite,
                    "horas_actuales": round(horas_actuales, 1),
                    "horas_nuevas": round(nuevo_bloque_h, 1),
                    "horas_totales": round(total, 1),
                    "sugerencia": (
                        f"{docente_nombre} tiene {horas_actuales:.1f}h asignadas de {limite}h permitidas. "
                        f"El bloque solicitado agrega {nuevo_bloque_h:.1f}h más ({total:.1f}h total)."
                    ),
                },
            },
        )


def check_capacidad_aula(
    db: Session,
    aula_id: int,
    asignacion_id: int,
) -> None:
    """
    Verifica que el aula tenga capacidad suficiente para el grupo asignado.

    Args:
        db: Sesión de base de datos
        aula_id: ID del aula
        asignacion_id: ID de la asignación (contiene el grupo)

    Raises:
        HTTPException 422 si la capacidad del aula es insuficiente.
    """
    aula = db.query(Aula).filter(Aula.id == aula_id).first()
    if not aula:
        return  # Ya validado en create_horario

    asignacion = db.query(Asignacion).options(
        joinedload(Asignacion.grupo)
    ).filter(Asignacion.id == asignacion_id).first()
    
    if not asignacion or not asignacion.grupo:
        return  # Ya validado en create_horario

    grupo = asignacion.grupo
    capacidad_aula = aula.capacidad or 0
    num_estudiantes = grupo.num_estudiantes or 0

    if num_estudiantes > capacidad_aula:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "mensaje": (
                    f"No se puede asignar el grupo '{grupo.nombre}' al aula '{aula.nombre}': "
                    f"el grupo tiene {num_estudiantes} estudiantes pero el aula solo tiene "
                    f"capacidad para {capacidad_aula} personas."
                ),
                "capacidad_aula": {
                    "aula": aula.nombre,
                    "capacidad": capacidad_aula,
                    "grupo": grupo.nombre,
                    "num_estudiantes": num_estudiantes,
                    "diferencia": num_estudiantes - capacidad_aula,
                    "sugerencia": (
                        f"Seleccione un aula con capacidad mínima de {num_estudiantes} personas "
                        f"o divida el grupo en sesiones más pequeñas."
                    ),
                },
            },
        )


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
    
    # Verificar capacidad del aula
    check_capacidad_aula(
        db=db,
        aula_id=horario_data.aula_id,
        asignacion_id=horario_data.asignacion_id,
    )
    
    # Verificar disponibilidad del docente ANTES de buscar conflictos
    check_docente_disponibilidad(
        db=db,
        docente_id=asignacion.docente_id,
        dia_semana=str(horario_data.dia_semana.value) if hasattr(horario_data.dia_semana, 'value') else str(horario_data.dia_semana),
        hora_inicio=horario_data.hora_inicio,
        hora_fin=horario_data.hora_fin,
    )

    # Verificar horas máximas semanales del docente
    check_horas_maximas_docente(
        db=db,
        docente_id=asignacion.docente_id,
        hora_inicio=horario_data.hora_inicio,
        hora_fin=horario_data.hora_fin,
    )

    # Verificar conflictos de aula/docente/grupo
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
    
    # Registrar versión de creación
    estado_nuevo = horario_version_service.snapshot_horario(db_horario)
    horario_version_service.registrar_version(
        db=db,
        horario_id=db_horario.id,
        tipo_cambio="creacion",
        descripcion_cambio=f"Horario creado: {horario_data.dia_semana} {horario_data.hora_inicio}-{horario_data.hora_fin}",
        ciclo_escolar=asignacion.ciclo_escolar,
        estado_anterior=None,
        estado_nuevo=estado_nuevo,
        razon_cambio=None,
        usuario_id=None,
        usuario_nombre=None,
    )
    
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
    
    # Verificar capacidad del aula si cambia aula o asignación
    if any(key in update_data for key in ['aula_id', 'asignacion_id']):
        check_capacidad_aula(
            db=db,
            aula_id=aula_id,
            asignacion_id=asignacion_id,
        )
    
    # Verificar disponibilidad del docente si cambia día u hora
    if any(key in update_data for key in ['dia_semana', 'hora_inicio', 'hora_fin', 'asignacion_id']):
        asig_check = db.query(Asignacion).filter(Asignacion.id == asignacion_id).first()
        if asig_check:
            dia_val = dia_semana.value if hasattr(dia_semana, 'value') else str(dia_semana)
            check_docente_disponibilidad(
                db=db,
                docente_id=asig_check.docente_id,
                dia_semana=dia_val,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
            )
            # Verificar horas máximas semanales
            check_horas_maximas_docente(
                db=db,
                docente_id=asig_check.docente_id,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
                exclude_horario_id=horario_id,
            )

    # Verificar conflictos (solo para detectar solapamientos; ya no bloquean la edición)
    if any(key in update_data for key in ['asignacion_id', 'aula_id', 'dia_semana', 'hora_inicio', 'hora_fin']):
        check_conflicts(
            db=db,
            asignacion_id=asignacion_id,
            aula_id=aula_id,
            dia_semana=dia_semana,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
            exclude_horario_id=horario_id
        )

    # Actualizar campos
    for field, value in update_data.items():
        setattr(horario, field, value)

    # Registrar versión de actualización
    estado_anterior = horario_version_service.snapshot_horario(horario)
    
    db.commit()
    db.refresh(horario)
    
    estado_nuevo = horario_version_service.snapshot_horario(horario)
    
    # Describir qué cambió
    cambios = []
    if 'dia_semana' in update_data:
        cambios.append(f"Día: {horario.dia_semana.value}")
    if 'hora_inicio' in update_data or 'hora_fin' in update_data:
        cambios.append(f"Hora: {horario.hora_inicio}-{horario.hora_fin}")
    if 'aula_id' in update_data:
        cambios.append(f"Aula: {aula_id}")
    if 'tipo_sesion' in update_data:
        cambios.append(f"Tipo: {horario.tipo_sesion.value}")
    if 'asignacion_id' in update_data:
        cambios.append(f"Asignación: {asignacion_id}")
    
    descripcion = "Modificado: " + ", ".join(cambios) if cambios else "Modificado"
    
    horario_version_service.registrar_version(
        db=db,
        horario_id=horario_id,
        tipo_cambio="modificacion",
        descripcion_cambio=descripcion,
        ciclo_escolar=horario.asignacion.ciclo_escolar,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        razon_cambio=None,
        usuario_id=None,
        usuario_nombre=None,
    )

    # ── Marcar conflictos existentes como resueltos ──────────────────────
    conflictos_anteriores = (
        db.query(Conflicto)
        .filter(
            Conflicto.horario_id == horario_id,
            Conflicto.resuelto == False,
        )
        .all()
    )
    if conflictos_anteriores:
        now = datetime.utcnow()
        for c in conflictos_anteriores:
            c.resuelto = True
            c.resolved_at = now
        db.commit()
    # ────────────────────────────────────────────────────────────────────

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


def clear_conflicts(db: Session, todos: bool = False) -> int:
    """
    Eliminar conflictos del historial.

    Args:
        db: Sesión de base de datos
        todos: Si True, elimina todos los conflictos; si False, solo los resueltos.

    Returns:
        Número de filas eliminadas.
    """
    from app.models import Conflicto

    query = db.query(Conflicto)
    if not todos:
        query = query.filter(Conflicto.resuelto == True)

    count = query.count()
    query.delete(synchronize_session=False)
    db.commit()
    return count
