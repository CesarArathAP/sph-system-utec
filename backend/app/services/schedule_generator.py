"""
Generador automático de horarios — SPH System UTEC.

Dado un ciclo escolar, recorre todas las Asignaciones (docente ↔ materia ↔ grupo)
y crea las Horarios correspondientes de forma automática, respetando:

  1. Disponibilidad declarada del docente (tabla DisponibilidadDocente).
     • Si el docente NO tiene ningún registro ➜ se asume disponible siempre.
     • Si tiene registros ➜ el slot debe quedar cubierto por al menos uno.

  2. Horas máximas semanales (Docente.horas_maximas_semana).
     El conteo es incremental: se actualiza después de cada sesión creada
     para que la siguiente sesión del mismo docente lo tome en cuenta.

  3. Aula disponible: sin solapamiento con otros Horarios activos
     en el mismo día/hora.

  4. Sin colisión de docente: sin solapamiento con otros Horarios activos
     del mismo docente en el mismo día/hora.

  5. Sin colisión de grupo: sin solapamiento con otros Horarios activos
     del mismo grupo en el mismo día/hora.

IMPORTANTE: los horarios se insertan directamente (db.add / db.commit) sin
pasar por horario_service.create_horario, porque ese método llama a
check_docente_disponibilidad y check_horas_maximas_docente que lanzan
HTTPException. Esas excepciones serían absorbidas silenciosamente por el
bloque except/continue del generador, produciendo 0 horarios creados.
"""
from datetime import time
from typing import Optional

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.models import (
    Asignacion, Horario, Aula, Docente,
    DisponibilidadDocente,
)


# ─── Slots de tiempo disponibles ─────────────────────────────────────────────

TIME_SLOTS = [
    (time(7,  0), time(9,  0)),
    (time(9,  0), time(11, 0)),
    (time(11, 0), time(13, 0)),
    (time(13, 0), time(15, 0)),
    (time(15, 0), time(17, 0)),
    (time(17, 0), time(19, 0)),
    (time(19, 0), time(21, 0)),
]

DAYS_OF_WEEK = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]


# ─── Helpers internos ─────────────────────────────────────────────────────────

def _horas(ini: time, fin: time) -> float:
    """Duración en horas decimales entre dos objetos time."""
    return (fin.hour * 60 + fin.minute - ini.hour * 60 - ini.minute) / 60


def _to_time(v) -> time:
    """Normalizar a time (la BD a veces devuelve string en SQLite)."""
    return v if isinstance(v, time) else time.fromisoformat(str(v))


def _docente_horas_usadas(db: Session, docente_id: int) -> float:
    """
    Suma de horas de todos los Horarios ACTIVOS del docente.
    Se llama al inicio de cada asignación para obtener la base incremental.
    """
    filas = (
        db.query(Horario)
        .join(Asignacion)
        .filter(Asignacion.docente_id == docente_id, Horario.activo == True)
        .all()
    )
    return sum(_horas(_to_time(h.hora_inicio), _to_time(h.hora_fin)) for h in filas)


# ── Réplica directa de check_docente_disponibilidad (sin HTTPException) ──────

def _docente_disponible(db: Session, docente_id: int,
                        dia: str, ini: time, fin: time) -> bool:
    """
    True si el slot [dia, ini, fin] está cubierto por la disponibilidad del docente.

    Lógica idéntica a horario_service.check_docente_disponibilidad, pero devuelve
    bool en lugar de lanzar HTTPException (para poder usarla en bucles).
    """
    slots = (
        db.query(DisponibilidadDocente)
        .filter(
            DisponibilidadDocente.docente_id == docente_id,
            DisponibilidadDocente.dia_semana == dia,
        )
        .order_by(DisponibilidadDocente.hora_inicio)
        .all()
    )

    # Sin registros → disponible siempre (misma regla que el service)
    if not slots:
        return True

    # El bloque debe quedar completamente cubierto por la unión continua de slots
    cursor = None
    for s in slots:
        s_ini = _to_time(s.hora_inicio)
        s_fin = _to_time(s.hora_fin)
        if s_ini <= ini:
            cursor = s_fin if cursor is None else max(cursor, s_fin)
        elif cursor is not None and s_ini <= cursor:
            cursor = max(cursor, s_fin)

    return cursor is not None and cursor >= fin


# ── Réplica directa de check_conflicts (sin HTTPException) ───────────────────

def _hay_solapamiento(db: Session, dia: str, ini: time, fin: time,
                      aula_id: int, docente_id: int, grupo_id: int) -> bool:
    """
    True si alguna de las tres condiciones de conflicto se cumple:
      • El aula ya está ocupada en ese slot.
      • El docente ya tiene clase en ese slot.
      • El grupo ya tiene clase en ese slot.

    Implementa la misma lógica de solapamiento temporal que
    horario_service.check_conflicts.
    """
    overlap_filter = and_(
        Horario.dia_semana == dia,
        Horario.activo == True,
        or_(
            and_(Horario.hora_inicio <= ini, Horario.hora_fin > ini),
            and_(Horario.hora_inicio < fin,  Horario.hora_fin >= fin),
            and_(Horario.hora_inicio >= ini, Horario.hora_fin <= fin),
        ),
    )

    # 1. Aula ocupada
    if db.query(Horario).filter(overlap_filter, Horario.aula_id == aula_id).first():
        return True

    # 2. Docente ocupado
    if (
        db.query(Horario)
        .join(Asignacion)
        .filter(overlap_filter, Asignacion.docente_id == docente_id)
        .first()
    ):
        return True

    # 3. Grupo ocupado
    if (
        db.query(Horario)
        .join(Asignacion)
        .filter(overlap_filter, Asignacion.grupo_id == grupo_id)
        .first()
    ):
        return True

    return False


# ── Búsqueda de aula ─────────────────────────────────────────────────────────

def _buscar_aula(db: Session, dia: str, ini: time, fin: time,
                 tipo_requerido: str, capacidad_min: int) -> Optional[Aula]:
    """
    Devuelve la primera aula activa del tipo y capacidad requeridos
    que NO tenga solapamiento de Horario activo en el slot indicado.
    """
    tipo_lower = (tipo_requerido or "").lower()

    query = db.query(Aula).filter(
        Aula.activo == True,
        Aula.capacidad >= capacidad_min,
    )
    if tipo_lower and tipo_lower not in ("aula", "normal", ""):
        query = query.filter(Aula.tipo.ilike(tipo_lower))

    for aula in query.order_by(Aula.capacidad).all():   # preferir las más pequeñas que caben
        ocupada = (
            db.query(Horario)
            .filter(
                Horario.aula_id == aula.id,
                Horario.dia_semana == dia,
                Horario.activo == True,
                or_(
                    and_(Horario.hora_inicio <= ini, Horario.hora_fin > ini),
                    and_(Horario.hora_inicio < fin,  Horario.hora_fin >= fin),
                    and_(Horario.hora_inicio >= ini, Horario.hora_fin <= fin),
                ),
            )
            .first()
        )
        if not ocupada:
            return aula

    return None


# ─── Lógica por asignación ────────────────────────────────────────────────────

def _generar_para_asignacion(db: Session, asignacion: Asignacion,
                              horas_usadas_docente: float) -> dict:
    """
    Crea las sesiones semanales para una Asignación.

    Parámetros:
        horas_usadas_docente: horas ya acumuladas por el docente ANTES
                              de procesar esta asignación (se actualiza
                              externamente en generate_schedule).

    Retorna:
        {
          "creados":      int,    # sesiones insertadas con éxito
          "esperados":    int,    # sesiones que debían crearse
          "horas_nuevas": float,  # horas efectivamente asignadas
          "razon_falla":  str | None
        }
    """
    materia  = asignacion.materia
    grupo    = asignacion.grupo
    docente  = asignacion.docente

    if not docente:
        return {"creados": 0, "esperados": 1,
                "horas_nuevas": 0.0, "razon_falla": "Asignación sin docente"}

    horas_semana = materia.horas_semana or 2
    num_sesiones = max(1, (horas_semana + 1) // 2)   # sesiones de ≈2 h
    max_horas    = docente.horas_maximas_semana or 40

    # Generar lista de todos los slots ordenados por prioridad
    # (horario central 9-17 h > temprano > nocturno)
    slots = []
    for dia in DAYS_OF_WEEK:
        for ini, fin in TIME_SLOTS:
            if time(9, 0) <= ini < time(17, 0):
                prio = 2
            elif time(7, 0) <= ini < time(9, 0):
                prio = 1
            else:
                prio = 0
            slots.append((prio, dia, ini, fin))
    slots.sort(key=lambda x: x[0], reverse=True)

    creados      = 0
    horas_nuevas = 0.0
    razon_falla  = None

    for i in range(num_sesiones):
        # ── Tipo de sesión ──────────────────────────────────────────────
        if materia.requiere_laboratorio and i == 0:
            tipo_sesion = "laboratorio"
            tipo_aula   = "laboratorio"
        elif i % 2 == 0:
            tipo_sesion = "teorica"
            tipo_aula   = materia.tipo_aula_requerida or "aula"
        else:
            tipo_sesion = "practica"
            tipo_aula   = materia.tipo_aula_requerida or "aula"

        slot_ok = False
        for prio, dia, ini, fin in slots:
            dur = _horas(ini, fin)

            # ① ¿Docente disponible en este slot? (réplica de check_docente_disponibilidad)
            if not _docente_disponible(db, docente.id, dia, ini, fin):
                continue

            # ② ¿No supera horas máximas? (réplica de check_horas_maximas_docente)
            if horas_usadas_docente + horas_nuevas + dur > max_horas:
                razon_falla = (
                    f"Docente alcanzó {max_horas}h máx "
                    f"(lleva {horas_usadas_docente + horas_nuevas:.1f}h)"
                )
                continue

            # ③ Buscar aula libre del tipo y capacidad requeridos
            aula = _buscar_aula(db, dia, ini, fin, tipo_aula, grupo.num_estudiantes)
            if not aula:
                continue

            # ④ Sin solapamiento de docente o grupo (réplica de check_conflicts)
            if _hay_solapamiento(db, dia, ini, fin, aula.id, docente.id, grupo.id):
                continue

            # ── Todo OK: insertar Horario directamente ──────────────────
            # (NO se usa create_horario para evitar que sus validaciones
            #  internas lancen HTTPException absorbida en silencio)
            try:
                nuevo = Horario(
                    asignacion_id=asignacion.id,
                    aula_id=aula.id,
                    dia_semana=dia,
                    hora_inicio=ini,
                    hora_fin=fin,
                    tipo_sesion=tipo_sesion,
                    activo=True,
                )
                db.add(nuevo)
                db.commit()
                db.refresh(nuevo)

                creados      += 1
                horas_nuevas += dur
                slots.remove((prio, dia, ini, fin))
                slot_ok = True
                break

            except Exception as exc:
                db.rollback()
                razon_falla = f"Error al insertar: {exc}"
                continue

        if not slot_ok and razon_falla is None:
            razon_falla = (
                "Sin slots disponibles "
                "(disponibilidad del docente, horas máx o falta de aulas)"
            )

    return {
        "creados":      creados,
        "esperados":    num_sesiones,
        "horas_nuevas": horas_nuevas,
        "razon_falla":  razon_falla if creados < num_sesiones else None,
    }


# ─── Función pública principal ────────────────────────────────────────────────

def generate_schedule(db: Session, ciclo_escolar: str,
                      clear_existing: bool = False) -> dict:
    """
    Genera horarios automáticamente para todas las Asignaciones de un ciclo.

    Parámetros:
        ciclo_escolar:  p.ej. "2026-1"
        clear_existing: si True, desactiva los Horarios existentes del ciclo
                        antes de generar (soft-delete).

    Retorna un resumen con:
        ciclo_escolar, total_asignaciones, horarios_creados,
        asignaciones_completadas, asignaciones_parciales,
        asignaciones_fallidas[], detalles[]
    """
    if clear_existing:
        _limpiar_horarios(db, ciclo_escolar)

    asignaciones = (
        db.query(Asignacion)
        .options(
            joinedload(Asignacion.materia),
            joinedload(Asignacion.grupo),
            joinedload(Asignacion.docente).joinedload(Docente.user),
        )
        .filter(Asignacion.ciclo_escolar == ciclo_escolar)
        .all()
    )

    if not asignaciones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron asignaciones para el ciclo '{ciclo_escolar}'",
        )

    stats = {
        "ciclo_escolar":            ciclo_escolar,
        "total_asignaciones":       len(asignaciones),
        "horarios_creados":         0,
        "asignaciones_completadas": 0,
        "asignaciones_parciales":   0,
        "asignaciones_fallidas":    [],
        "detalles":                 [],
    }

    # Cache de horas ya usadas por docente (se actualiza con cada sesión creada)
    horas_por_docente: dict[int, float] = {}

    for asignacion in asignaciones:
        did = asignacion.docente_id

        # Inicializar el contador con las horas previas del docente
        if did not in horas_por_docente:
            horas_por_docente[did] = _docente_horas_usadas(db, did)

        try:
            res = _generar_para_asignacion(db, asignacion, horas_por_docente[did])
        except Exception as exc:
            stats["asignaciones_fallidas"].append({
                "asignacion_id": asignacion.id,
                "error": str(exc),
            })
            continue

        # Actualizar el acumulador del docente para la siguiente asignación
        horas_por_docente[did] += res["horas_nuevas"]

        creados   = res["creados"]
        esperados = res["esperados"]

        # Nombre legible del docente
        docente_nombre = "—"
        if asignacion.docente and asignacion.docente.user:
            u = asignacion.docente.user
            docente_nombre = f"{u.nombre} {u.apellido}"

        stats["horarios_creados"] += creados

        if creados >= esperados:
            stats["asignaciones_completadas"] += 1
        elif creados > 0:
            stats["asignaciones_parciales"] += 1
        else:
            stats["asignaciones_fallidas"].append({
                "asignacion_id": asignacion.id,
                "grupo":   asignacion.grupo.nombre   if asignacion.grupo   else "—",
                "materia": asignacion.materia.nombre if asignacion.materia else "—",
                "docente": docente_nombre,
                "razon":   res.get("razon_falla") or "Sin slots disponibles",
            })

        stats["detalles"].append({
            "asignacion_id":  asignacion.id,
            "grupo":          asignacion.grupo.nombre   if asignacion.grupo   else "—",
            "materia":        asignacion.materia.nombre if asignacion.materia else "—",
            "docente":        docente_nombre,
            "sesiones_esperadas": esperados,
            "horarios_creados":   creados,
            "razon_falla":        res.get("razon_falla"),
        })

    return stats


# ─── Utilidades ───────────────────────────────────────────────────────────────

def _limpiar_horarios(db: Session, ciclo_escolar: str) -> None:
    """Soft-delete de todos los Horarios activos del ciclo."""
    filas = (
        db.query(Horario)
        .join(Asignacion)
        .filter(Asignacion.ciclo_escolar == ciclo_escolar, Horario.activo == True)
        .all()
    )
    for h in filas:
        h.activo = False
    db.commit()


def get_schedule_summary(db: Session, ciclo_escolar: str) -> dict:
    """Resumen rápido del horario de un ciclo."""
    from app.models.conflicto import Conflicto

    total_h = (
        db.query(Horario)
        .join(Asignacion)
        .filter(Asignacion.ciclo_escolar == ciclo_escolar, Horario.activo == True)
        .count()
    )
    total_a = (
        db.query(Asignacion)
        .filter(Asignacion.ciclo_escolar == ciclo_escolar)
        .count()
    )
    total_c = (
        db.query(Conflicto)
        .join(Horario)
        .join(Asignacion)
        .filter(
            Asignacion.ciclo_escolar == ciclo_escolar,
            Conflicto.resuelto == False,
        )
        .count()
    )
    sesiones_esp = total_a * 2
    cobertura = f"{total_h / sesiones_esp * 100:.1f}%" if sesiones_esp else "0%"

    return {
        "ciclo_escolar":         ciclo_escolar,
        "total_asignaciones":    total_a,
        "total_horarios":        total_h,
        "conflictos_pendientes": total_c,
        "cobertura":             cobertura,
    }
