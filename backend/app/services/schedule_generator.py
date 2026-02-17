"""
Servicio de generación automática de horarios.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
from datetime import time, datetime

from app.models import Asignacion, Horario, Aula, Materia, Grupo, Docente
from app.services import horario_service


# Configuración de slots de tiempo disponibles
TIME_SLOTS = [
    (time(7, 0), time(9, 0)),   # 7:00-9:00
    (time(9, 0), time(11, 0)),  # 9:00-11:00
    (time(11, 0), time(13, 0)), # 11:00-13:00
    (time(13, 0), time(15, 0)), # 13:00-15:00
    (time(15, 0), time(17, 0)), # 15:00-17:00
    (time(17, 0), time(19, 0)), # 17:00-19:00
    (time(19, 0), time(21, 0)), # 19:00-21:00
]

DAYS_OF_WEEK = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]


def generate_schedule(db: Session, ciclo_escolar: str, clear_existing: bool = False) -> dict:
    """
    Generar horarios automáticamente para un ciclo escolar.
    
    Args:
        db: Sesión de base de datos
        ciclo_escolar: Ciclo escolar para generar horarios
        clear_existing: Si True, elimina horarios existentes del ciclo
        
    Returns:
        Diccionario con resumen de generación
    """
    # Limpiar horarios existentes si se solicita
    if clear_existing:
        _clear_schedule(db, ciclo_escolar)
    
    # Obtener todas las asignaciones del ciclo
    asignaciones = db.query(Asignacion).filter(
        Asignacion.ciclo_escolar == ciclo_escolar
    ).all()
    
    if not asignaciones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron asignaciones para el ciclo {ciclo_escolar}"
        )
    
    # Estadísticas
    stats = {
        "total_asignaciones": len(asignaciones),
        "horarios_creados": 0,
        "conflictos_detectados": 0,
        "asignaciones_fallidas": [],
        "detalles": []
    }
    
    # Generar horarios para cada asignación
    for asignacion in asignaciones:
        try:
            result = _generate_for_asignacion(db, asignacion)
            stats["horarios_creados"] += result["horarios_creados"]
            stats["conflictos_detectados"] += result["conflictos"]
            stats["detalles"].append({
                "asignacion_id": asignacion.id,
                "grupo": asignacion.grupo.nombre,
                "materia": asignacion.materia.nombre,
                "docente": f"{asignacion.docente.user.nombre} {asignacion.docente.user.apellido}",
                "horarios_creados": result["horarios_creados"],
                "conflictos": result["conflictos"]
            })
        except Exception as e:
            stats["asignaciones_fallidas"].append({
                "asignacion_id": asignacion.id,
                "error": str(e)
            })
    
    return stats


def _generate_for_asignacion(db: Session, asignacion: Asignacion) -> dict:
    """
    Generar horarios para una asignación específica con distribución optimizada.
    
    Args:
        db: Sesión de base de datos
        asignacion: Asignación para la cual generar horarios
        
    Returns:
        Diccionario con estadísticas de generación
    """
    materia = asignacion.materia
    grupo = asignacion.grupo
    
    # Calcular número de sesiones necesarias (asumiendo sesiones de 2 horas)
    horas_necesarias = materia.horas_semana
    num_sesiones = (horas_necesarias + 1) // 2  # Redondear hacia arriba
    
    horarios_creados = 0
    conflictos = 0
    
    # Obtener carga actual por día para balanceo
    day_load = _get_day_load(db, asignacion.docente_id, asignacion.grupo_id)
    
    # Generar lista de slots disponibles con prioridad
    available_slots = _get_prioritized_slots(db, asignacion, day_load, num_sesiones)
    
    # Validar horas máximas del docente antes de empezar
    if not _check_teacher_max_hours(db, asignacion.docente_id, asignacion.ciclo_escolar, horas_necesarias):
         # Registrar error o advertencia, pero tal vez intentar asignar parcial?
         # Por ahora, si no cabe completo, no asignamos nada o lanzamos excepción
         return {
             "horarios_creados": 0,
             "conflictos": 0,
             "error": "Excede horas máximas del docente"
         }

    # Intentar asignar sesiones usando slots priorizados
    for i in range(num_sesiones):
        # Determinar tipo de sesión
        if materia.requiere_laboratorio and i == 0:
            tipo_sesion = "laboratorio"
            tipo_aula_req = "laboratorio"
        elif i % 2 == 0:
            tipo_sesion = "teorica"
            tipo_aula_req = materia.tipo_aula_requerida or "aula"
        else:
            tipo_sesion = "practica"
            tipo_aula_req = materia.tipo_aula_requerida or "aula"
        
        # Buscar slot disponible de la lista priorizada
        slot_found = False
        for day, hora_inicio, hora_fin, priority in available_slots:
            # Verificar disponibilidad del docente
            if not _check_teacher_availability(db, asignacion.docente_id, day, hora_inicio, hora_fin):
                continue
            
            # Verificar horas máximas nuevamente (acumulativo)
            # (Ya validamos globalmente, pero para ser precisos podríamos hacerlo aquí si asignamos parcial)
            
            # Buscar aula disponible
            aula = _find_available_classroom(
                db, day, hora_inicio, hora_fin,
                tipo_aula_req, grupo.num_estudiantes,
                asignacion.id
            )
            
            if aula:
                # Crear horario
                try:
                    horario = horario_service.create_horario(
                        db,
                        horario_service.HorarioCreate(
                            asignacion_id=asignacion.id,
                            aula_id=aula.id,
                            dia_semana=day,
                            hora_inicio=hora_inicio,
                            hora_fin=hora_fin,
                            tipo_sesion=tipo_sesion
                        ),
                        allow_conflicts=True  # Permitir conflictos y registrarlos
                    )
                    horarios_creados += 1
                    
                    # Verificar si se registraron conflictos
                    from app.models import Conflicto
                    conflictos_horario = db.query(Conflicto).filter(
                        Conflicto.horario_id == horario.id,
                        Conflicto.resuelto == False
                    ).count()
                    conflictos += conflictos_horario
                    
                    # Actualizar carga del día
                    day_load[day] = day_load.get(day, 0) + 1
                    
                    # Remover slot usado de la lista
                    available_slots.remove((day, hora_inicio, hora_fin, priority))
                    
                    slot_found = True
                    break
                except Exception as e:
                    # Si falla, continuar buscando
                    continue
        
        if not slot_found:
            # No se pudo asignar esta sesión
            break
    
    return {
        "horarios_creados": horarios_creados,
        "conflictos": conflictos
    }


def _get_day_load(db: Session, docente_id: int, grupo_id: int) -> dict:
    """
    Obtener la carga actual de horarios por día para un docente y grupo.
    
    Args:
        db: Sesión de base de datos
        docente_id: ID del docente
        grupo_id: ID del grupo
        
    Returns:
        Diccionario con carga por día
    """
    from sqlalchemy import func
    
    # Contar horarios del docente por día
    docente_load = db.query(
        Horario.dia_semana,
        func.count(Horario.id).label('count')
    ).join(Asignacion).filter(
        Asignacion.docente_id == docente_id,
        Horario.activo == True
    ).group_by(Horario.dia_semana).all()
    
    # Contar horarios del grupo por día
    grupo_load = db.query(
        Horario.dia_semana,
        func.count(Horario.id).label('count')
    ).join(Asignacion).filter(
        Asignacion.grupo_id == grupo_id,
        Horario.activo == True
    ).group_by(Horario.dia_semana).all()
    
    # Combinar cargas
    day_load = {}
    for dia, count in docente_load:
        day_load[dia] = day_load.get(dia, 0) + count
    for dia, count in grupo_load:
        day_load[dia] = day_load.get(dia, 0) + count
    
    return day_load


def _get_prioritized_slots(
    db: Session,
    asignacion: Asignacion,
    day_load: dict,
    num_sesiones: int
) -> list:
    """
    Generar lista de slots priorizados para distribución óptima.
    
    Args:
        db: Sesión de base de datos
        asignacion: Asignación
        day_load: Carga actual por día
        num_sesiones: Número de sesiones a asignar
        
    Returns:
        Lista de tuplas (día, hora_inicio, hora_fin, prioridad)
    """
    slots = []
    
    # Generar todos los slots posibles
    for day in DAYS_OF_WEEK:
        for hora_inicio, hora_fin in TIME_SLOTS:
            # Calcular prioridad basada en:
            # 1. Carga del día (menor carga = mayor prioridad)
            # 2. Hora del día (horarios intermedios = mayor prioridad)
            # 3. Distribución uniforme
            
            load_priority = 100 - day_load.get(day, 0) * 10
            
            # Priorizar horarios de 9:00-17:00 (más convenientes)
            if time(9, 0) <= hora_inicio < time(17, 0):
                time_priority = 50
            elif time(7, 0) <= hora_inicio < time(9, 0):
                time_priority = 30
            else:
                time_priority = 10
            
            # Prioridad total
            priority = load_priority + time_priority
            
            slots.append((day, hora_inicio, hora_fin, priority))
    
    # Ordenar por prioridad (mayor a menor)
    slots.sort(key=lambda x: x[3], reverse=True)
    
    return slots


def _check_teacher_availability(
    db: Session,
    docente_id: int,
    dia: str,
    hora_inicio: time,
    hora_fin: time
) -> bool:
    """
    Verificar si un docente está disponible en un horario específico.
    
    Args:
        db: Sesión de base de datos
        docente_id: ID del docente
        dia: Día de la semana
        hora_inicio: Hora de inicio
        hora_fin: Hora de fin
        
    Returns:
        True si el docente está disponible, False en caso contrario
    """
    from app.models import DisponibilidadDocente
    
    # Si no hay disponibilidades registradas, asumir que está disponible
    total_disponibilidades = db.query(DisponibilidadDocente).filter(
        DisponibilidadDocente.docente_id == docente_id
    ).count()
    
    if total_disponibilidades == 0:
        return True  # Sin restricciones de disponibilidad
    
    # Buscar disponibilidades que cubran el horario solicitado
    disponibilidades = db.query(DisponibilidadDocente).filter(
        DisponibilidadDocente.docente_id == docente_id,
        DisponibilidadDocente.dia_semana == dia,
        DisponibilidadDocente.hora_inicio <= hora_inicio,
        DisponibilidadDocente.hora_fin >= hora_fin
    ).all()
    
    return len(disponibilidades) > 0


def _check_teacher_max_hours(
    db: Session,
    docente_id: int,
    ciclo_escolar: str,
    horas_nuevas: int
) -> bool:
    """
    Verificar si el docente excede sus horas máximas semanales.
    
    Args:
        db: Sesión de base de datos
        docente_id: ID del docente
        ciclo_escolar: Ciclo escolar
        horas_nuevas: Horas a asignar
        
    Returns:
        True si puede aceptar las horas, False si excede
    """
    from app.models import Docente
    from sqlalchemy import func
    
    docente = db.query(Docente).filter(Docente.id == docente_id).first()
    if not docente:
        return False
    
    # Calcular duración de horarios existentes
    # Nota: SQLite no tiene diff de tiempo directo fácil en segundos con sum
    # Traemos los horarios y sumamos en Python para ser agnósticos y precisos
    horarios = db.query(Horario).join(Asignacion).filter(
        Asignacion.docente_id == docente_id,
        Asignacion.ciclo_escolar == ciclo_escolar,
        Horario.activo == True
    ).all()
    
    horas_asignadas = 0
    for horario in horarios:
        # Calcular duración en horas
        inicio = datetime.combine(datetime.today(), horario.hora_inicio)
        fin = datetime.combine(datetime.today(), horario.hora_fin)
        duracion = (fin - inicio).total_seconds() / 3600
        horas_asignadas += duracion
    
    return (horas_asignadas + horas_nuevas) <= docente.horas_maximas_semana


def _find_available_classroom(
    db: Session,
    dia: str,
    hora_inicio: time,
    hora_fin: time,
    tipo_aula: str,
    capacidad_requerida: int,
    exclude_asignacion_id: Optional[int] = None
) -> Optional[Aula]:
    """
    Buscar un aula disponible que cumpla los requisitos.
    
    Args:
        db: Sesión de base de datos
        dia: Día de la semana
        hora_inicio: Hora de inicio
        hora_fin: Hora de fin
        tipo_aula: Tipo de aula requerida
        capacidad_requerida: Capacidad mínima requerida
        exclude_asignacion_id: ID de asignación a excluir
        
    Returns:
        Aula disponible o None
    """
    # Obtener aulas que cumplan requisitos básicos
    aulas = db.query(Aula).filter(
        Aula.activo == True,
        Aula.capacidad >= capacidad_requerida
    ).all()
    
    # Filtrar por tipo si es necesario
    if tipo_aula and tipo_aula != "aula":
        aulas = [a for a in aulas if a.tipo.lower() == tipo_aula.lower()]
    
    # Verificar disponibilidad de cada aula
    for aula in aulas:
        # Verificar si el aula está ocupada en ese horario
        conflictos = horario_service.check_conflicts(
            db=db,
            asignacion_id=exclude_asignacion_id or 1,  # Temporal
            aula_id=aula.id,
            dia_semana=dia,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin
        )
        
        # Filtrar solo conflictos de aula
        aula_conflicts = [c for c in conflictos if c.tipo == "AULA_DOBLE_ASIGNACION"]
        
        if not aula_conflicts:
            return aula
    
    return None


def _clear_schedule(db: Session, ciclo_escolar: str):
    """
    Eliminar todos los horarios de un ciclo escolar.
    
    Args:
        db: Sesión de base de datos
        ciclo_escolar: Ciclo escolar a limpiar
    """
    # Obtener horarios del ciclo
    horarios = db.query(Horario).join(Asignacion).filter(
        Asignacion.ciclo_escolar == ciclo_escolar
    ).all()
    
    # Eliminar horarios (soft delete)
    for horario in horarios:
        horario.activo = False
    
    db.commit()


def get_schedule_summary(db: Session, ciclo_escolar: str) -> dict:
    """
    Obtener resumen del horario generado para un ciclo.
    
    Args:
        db: Sesión de base de datos
        ciclo_escolar: Ciclo escolar
        
    Returns:
        Resumen del horario
    """
    # Contar horarios activos
    horarios_count = db.query(Horario).join(Asignacion).filter(
        Asignacion.ciclo_escolar == ciclo_escolar,
        Horario.activo == True
    ).count()
    
    # Contar asignaciones
    asignaciones_count = db.query(Asignacion).filter(
        Asignacion.ciclo_escolar == ciclo_escolar
    ).count()
    
    # Contar conflictos no resueltos
    from app.models import Conflicto
    conflictos_count = db.query(Conflicto).join(Horario).join(Asignacion).filter(
        Asignacion.ciclo_escolar == ciclo_escolar,
        Conflicto.resuelto == False
    ).count()
    
    return {
        "ciclo_escolar": ciclo_escolar,
        "total_asignaciones": asignaciones_count,
        "total_horarios": horarios_count,
        "conflictos_pendientes": conflictos_count,
        "cobertura": f"{(horarios_count / (asignaciones_count * 2) * 100):.1f}%" if asignaciones_count > 0 else "0%"
    }
