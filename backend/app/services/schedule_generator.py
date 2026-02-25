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
from app.services.snapshot_service import SnapshotService


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
    
    IMPORTANTE: Si el docente TIENE ALGÚN registro de disponibilidad, solo está
    disponible en esos rangos. Si NO tiene ningún registro, está disponible siempre.
    """
    # Primero: verificar si el docente tiene ALGÚN registro de disponibilidad
    total_disponibilidad = (
        db.query(DisponibilidadDocente)
        .filter(DisponibilidadDocente.docente_id == docente_id)
        .count()
    )
    
    # Si NO tiene ningún registro de disponibilidad, disponible siempre
    if total_disponibilidad == 0:
        return True
    
    # Si TIENE registros, buscar específicamente para ese día
    slots = (
        db.query(DisponibilidadDocente)
        .filter(
            DisponibilidadDocente.docente_id == docente_id,
            DisponibilidadDocente.dia_semana == dia,
        )
        .order_by(DisponibilidadDocente.hora_inicio)
        .all()
    )

    # Si TIENE registros de disponibilidad pero NINGUNO para este día, NO disponible
    if not slots:
        return False

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
    
    Prioriza aulas por:
      1. Tipo exacto (si es "laboratorio", busca laboratorio primero)
      2. Capacidad óptima (la más pequeña que cabe, para optimizar espacio)
      3. Disponibilidad temporal (sin solapamientos)
    """
    tipo_lower = (tipo_requerido or "").lower().strip()
    
    # Query base
    query = db.query(Aula).filter(Aula.activo == True, Aula.capacidad >= capacidad_min)
    
    # Filtrar por tipo con mayor flexibilidad
    if tipo_lower and tipo_lower not in ("aula", "normal", "", "general"):
        # Buscar exacto primero (p.ej. "laboratorio")
        tipo_query = query.filter(Aula.tipo.ilike(f"%{tipo_lower}%"))
        aulas_tipo = tipo_query.order_by(Aula.capacidad).all()
    else:
        aulas_tipo = query.order_by(Aula.capacidad).all()
    
    # Filtro temporal para detectar solapamiento
    def _aula_libre(aula: Aula) -> bool:
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
        return ocupada is None
    
    # Retornar primera aula disponible (ya ordenada por capacidad)
    for aula in aulas_tipo:
        if _aula_libre(aula):
            return aula
    
    return None


# ─── Validación de prerequisitos ──────────────────────────────────────────────

def _validar_prerequisitos(db: Session, asignaciones: list[Asignacion]) -> list[dict]:
    """
    Valida las condiciones necesarias para generar horarios automáticamente.
    
    Revisa:
      1. Docentes con disponibilidad registrada
      2. Aulas suficientes para los tamaños de grupos
      3. Aulas del tipo requerido (e.g., laboratorio)
    
    Retorna lista de diagnosticos, cada uno con estructura:
        {
            "tipo": "warning"|"critica",
            "titulo": str,
            "mensaje": str,
            "detalles": dict | list[str],  # información adicional
            "sugerencia": str  # cómo resolver
        }
    
    Los diagnosticos tipo="critica" indican que la generación NO puede proceder.
    Los tipo="warning" son informativos pero no bloquean.
    """
    diagnosticos: list[dict] = []
    
    if not asignaciones:
        return diagnosticos
    
    # ─ 1. Revisar docentes sin disponibilidad registrada ─
    docentes_sin_disponibilidad: dict[int, str] = {}  # {docente_id: nombre}
    
    for asig in asignaciones:
        docente = asig.docente
        did = docente.id
        
        # Skip si ya lo revisamos
        if did in docentes_sin_disponibilidad or (did in {d.get("docente_id") for d in diagnosticos if d['tipo'] == 'critica'}):
            continue
        
        # Contar slots de disponibilidad
        slots_count = (
            db.query(DisponibilidadDocente)
            .filter(DisponibilidadDocente.docente_id == did)
            .count()
        )
        
        if slots_count == 0:
            docente_nombre = "—"
            if docente.user:
                docente_nombre = f"{docente.user.nombre} {docente.user.apellido}"
            docentes_sin_disponibilidad[did] = docente_nombre
    
    if docentes_sin_disponibilidad:
        nombres = list(docentes_sin_disponibilidad.values())
        diagnosticos.append({
            "tipo": "critica",
            "titulo": "Sin disponibilidad de docentes",
            "mensaje": f"⚠️ {len(nombres)} docente(s) no tiene(n) horario de disponibilidad registrado.",
            "detalles": nombres,
            "sugerencia": "Registra disponibilidad para cada docente. Ir a: Docentes → Selecciona cada profesor → Disponibilidad",
            "docentes_id": list(docentes_sin_disponibilidad.keys()),
        })
    
    # ─ 2. Revisar aulas disponibles vs capacidad de grupos ─
    max_estudiantes = max((asig.grupo.num_estudiantes for asig in asignaciones), default=0)
    
    if max_estudiantes > 0:
        aulas_activas = (
            db.query(Aula)
            .filter(Aula.activo == True, Aula.capacidad >= max_estudiantes)
            .count()
        )
        
        if aulas_activas == 0:
            diagnosticos.append({
                "tipo": "critica",
                "titulo": "Aulas insuficientes",
                "mensaje": f"⚠️ No hay aulas con capacidad ≥ {max_estudiantes} estudiantes.",
                "detalles": {
                    "capacidad_requerida": max_estudiantes,
                    "aulas_disponibles": (
                        db.query(Aula)
                        .filter(Aula.activo == True)
                        .count()
                    ),
                },
                "sugerencia": "Crea nuevas aulas o aumenta la capacidad de las existentes.",
            })
    
    # ─ 3. Revisar aulas de tipo especial (laboratorio) ─
    materias_laboratorio = []
    for asig in asignaciones:
        materia = asig.materia
        # Asumir que si el nombre contiene "lab" o similar, requiere laboratorio
        # O si existe un campo requiere_laboratorio (si está definido en el modelo)
        if hasattr(materia, "requiere_laboratorio") and materia.requiere_laboratorio:
            materias_laboratorio.append(materia.nombre)
    
    if materias_laboratorio:
        labs_count = (
            db.query(Aula)
            .filter(
                Aula.activo == True,
                Aula.tipo.ilike("%laboratorio%")
            )
            .count()
        )
        
        if labs_count == 0:
            diagnosticos.append({
                "tipo": "critica",
                "titulo": "Laboratorios no disponibles",
                "mensaje": f"⚠️ {len(materias_laboratorio)} materia(s) requiere(n) laboratorio, pero no hay disponibles.",
                "detalles": materias_laboratorio,
                "sugerencia": "Crea aulas de tipo 'Laboratorio' o actualiza las materias para que no requieran laboratorio.",
            })
    
    # ─ 4. Advertencia: Pocas aulas disponibles (warning, no crítico) ─
    aulas_total = db.query(Aula).filter(Aula.activo == True).count()
    if aulas_total < len(asignaciones) // 2:  # Menos aulas que la mitad de asignaciones
        diagnosticos.append({
            "tipo": "warning",
            "titulo": "Pocas aulas disponibles",
            "mensaje": f"⚠️ Solo hay {aulas_total} aulas para {len(asignaciones)} asignaciones. Podrían haber conflictos de horario.",
            "detalles": {
                "aulas_activas": aulas_total,
                "asignaciones": len(asignaciones),
            },
            "sugerencia": "Considera crear más aulas o distribuir mejor los horarios.",
        })
    
    return diagnosticos


# ─── Lógica por asignación ────────────────────────────────────────────────────

def _generar_para_asignacion(db: Session, asignacion: Asignacion,
                              horas_usadas_docente: float) -> dict:
    """
    Crea las sesiones semanales para una Asignación.

    ⚠️  GARANTÍAS CRÍTICAS:
      • NUNCA crea una sesión que exceda horas_semana de la materia
      • NUNCA crea una sesión que exceda horas_maximas_semana del docente
      • Validación ANTES de db.commit() en cada sesión
      • Validación DESPUÉS de crear todas las sesiones

    Validaciones:
      1. Disponibilidad del docente (DisponibilidadDocente)
      2. Horas máximas semanales (Docente.horas_maximas_semana)
      3. Aula disponible (capacidad + tipo + sin solapamientos)
      4. Sin conflictos de docente/grupo (check_conflicts)
      5. Capacidad del grupo > 0
      6. CRITICAL: Horas por asignación <= materia.horas_semana

    Parámetros:
        horas_usadas_docente: horas ya acumuladas por el docente ANTES
                              de procesar esta asignación

    Retorna:
        {
          "creados":      int,      # sesiones insertadas
          "esperados":    int,      # sesiones que debían crearse
          "horas_nuevas": float,    # horas efectivamente asignadas
          "razon_falla":  str|None  # motivo del fallo (si aplica)
        }
    """
    materia  = asignacion.materia
    grupo    = asignacion.grupo
    docente  = asignacion.docente

    # ─ Validaciones básicas ─
    if not docente:
        return {
            "creados": 0, "esperados": 0,
            "horas_nuevas": 0.0,
            "razon_falla": "Asignación sin docente"
        }

    if not grupo:
        return {
            "creados": 0, "esperados": 0,
            "horas_nuevas": 0.0,
            "razon_falla": "Asignación sin grupo"
        }

    if not materia:
        return {
            "creados": 0, "esperados": 0,
            "horas_nuevas": 0.0,
            "razon_falla": "Asignación sin materia"
        }

    if (grupo.num_estudiantes or 0) <= 0:
        return {
            "creados": 0, "esperados": 0,
            "horas_nuevas": 0.0,
            "razon_falla": f"Grupo '{grupo.nombre}' tiene 0 estudiantes"
        }

    # ─ Cálculos de sesiones ─
    horas_semana = materia.horas_semana or 2
    max_horas = docente.horas_maximas_semana or 40

    # Cálculo inteligente de sesiones:
    # - Si la materia tiene horas definidas, respetarlas exactamente
    # - Preferir sesiones de 2 horas, pero adaptarse si es necesario
    # - Validar que las horas totales NO EXCEDAN horas_semana
    num_sesiones = max(1, (horas_semana + 1) // 2)
    
    # ⚠️  CRITICAL: Contar HORARIOS PREVIOS de ESTA ASIGNACIÓN
    # para no crear duplicados
    horarios_previos = (
        db.query(Horario)
        .filter(
            Horario.asignacion_id == asignacion.id,
            Horario.activo == True
        )
        .all()
    )
    horas_asignacion_previas = sum(
        _horas(_to_time(h.hora_inicio), _to_time(h.hora_fin))
        for h in horarios_previos
    )
    
    # ⚠️  CRITICAL: Si ya existen sesiones de esta asignación,
    # NO generar más (prevenir duplicados)
    if horas_asignacion_previas > 0:
        # Ya existe generación para esta asignación
        return {
            "creados": 0,
            "esperados": 0,
            "horas_nuevas": 0.0,
            "razon_falla": (
                f"[DUPLICATE-PREVENTION] Asignación ya tiene {horas_asignacion_previas}h. "
                f"Use clear_existing=True para regenerar."
            ),
        }
    
    # Si ya existen sesiones, calcular cuántas más se necesitan
    horas_restantes = max(0.0, horas_semana - horas_asignacion_previas)
    if horas_restantes <= 0:
        # Ya se alcanzó el límite de horas para esta asignación
        return {
            "creados": 0,
            "esperados": 0,
            "horas_nuevas": 0.0,
            "razon_falla": (
                f"Asignación ya tiene {horas_asignacion_previas}h (límite: {horas_semana}h)"
            ),
        }

    # ─ Generar lista de slots ordenados por prioridad ─
    slots = []
    for dia in DAYS_OF_WEEK:
        for ini, fin in TIME_SLOTS:
            # Prioridad: horario central > mañana temprana > tarde > noche
            if time(9, 0) <= ini < time(17, 0):
                prio = 3  # Central (9-17)
            elif time(7, 0) <= ini < time(9, 0):
                prio = 2  # Temprana (7-9)
            elif time(17, 0) <= ini < time(19, 0):
                prio = 1  # Tarde (17-19)
            else:
                prio = 0  # Nocturna (19+)
            slots.append((prio, dia, ini, fin))

    # Ordenar por prioridad descendente, luego por disponibilidad
    slots.sort(key=lambda x: x[0], reverse=True)

    creados = 0
    horas_nuevas = 0.0
    razon_falla = None
    slots_usados = set()
    sesiones_creadas = []  # Guardar temporalmente para validación atómica

    # ─ Intentar crear cada sesión ─
    for i in range(num_sesiones):
        # ⚠️  SAFETY CHECK: Nunca exceder las horas esperadas
        if horas_nuevas >= horas_restantes:
            break
        
        # Determinar tipo de sesión y aula requerida
        requiere_lab = materia.requiere_laboratorio or False
        if requiere_lab and i == 0:
            tipo_sesion = "laboratorio"
            tipo_aula = "laboratorio"
        elif i % 2 == 0:
            tipo_sesion = "teorica"
            tipo_aula = materia.tipo_aula_requerida or "aula"
        else:
            tipo_sesion = "practica"
            tipo_aula = materia.tipo_aula_requerida or "aula"

        slot_encontrado = False

        for slot_idx, (prio, dia, ini, fin) in enumerate(slots):
            # Evitar reusar el mismo slot
            if (dia, ini, fin) in slots_usados:
                continue

            dur = _horas(ini, fin)

            # ① CRITICAL: Validar que NO se excedan las horas ANTES de crear
            if horas_nuevas + dur > horas_restantes:
                continue

            # ② Validar disponibilidad del docente
            if not _docente_disponible(db, docente.id, dia, ini, fin):
                continue

            # ③ Validar horas máximas semanales del docente
            if horas_usadas_docente + horas_nuevas + dur > max_horas:
                razon_falla = (
                    f"Docente '{docente.user.nombre if docente.user else 'N/A'}' "
                    f"alcanzaría {horas_usadas_docente + horas_nuevas + dur:.1f}h "
                    f"(máximo {max_horas}h)"
                )
                continue

            # ④ Buscar aula disponible
            aula = _buscar_aula(
                db, dia, ini, fin,
                tipo_aula,
                grupo.num_estudiantes
            )
            if not aula:
                razon_falla = (
                    f"Sin {tipo_aula} disponible para {grupo.num_estudiantes} estudiantes "
                    f"el {dia} {ini}-{fin}"
                )
                continue

            # ⑤ Validar ausencia de conflictos
            if _hay_solapamiento(db, dia, ini, fin, aula.id, docente.id, grupo.id):
                razon_falla = (
                    f"Conflicto de aula/docente/grupo detectado "
                    f"el {dia} {ini}-{fin}"
                )
                continue

            # ─ TRANSACTION SAFETY: Pre-create the object (no insert yet) ─
            nuevo = Horario(
                asignacion_id=asignacion.id,
                aula_id=aula.id,
                dia_semana=dia,
                hora_inicio=ini,
                hora_fin=fin,
                tipo_sesion=tipo_sesion,
                activo=True,
            )
            
            # ⚠️  SAFETY CHECK: Final validation before commit
            if horas_nuevas + dur > horas_restantes:
                # Double-check: should never happen due to earlier check
                continue
            
            # Add to temporary list for atomic insertion
            sesiones_creadas.append(nuevo)
            horas_nuevas += dur
            slots_usados.add((dia, ini, fin))
            slot_encontrado = True
            break

        # Si no se encontró slot para esta sesión
        if not slot_encontrado:
            if razon_falla is None:
                razon_falla = (
                    f"Sin slots libres para sesión {i+1}/{num_sesiones} "
                    "(disponibilidad docente, capacidad aula o conflictos)"
                )

    # ─ ATOMIC INSERTION: All or nothing ─
    # Only commit after ALL validations pass
    if sesiones_creadas:
        try:
            for horario in sesiones_creadas:
                db.add(horario)
            db.commit()
            
            # Refresh to get IDs
            for h in sesiones_creadas:
                db.refresh(h)
            
            creados = len(sesiones_creadas)
        except Exception as exc:
            db.rollback()
            return {
                "creados": 0,
                "esperados": num_sesiones,
                "horas_nuevas": 0.0,
                "razon_falla": f"Error crítico en inserción: {str(exc)[:100]}",
            }

    return {
        "creados": creados,
        "esperados": num_sesiones,
        "horas_nuevas": horas_nuevas,
        "horas_esperadas": horas_restantes,
        "razon_falla": razon_falla if creados < num_sesiones else None,
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
        asignaciones_fallidas[], diagnosticos[], alertas[]
    """
    # ─ Si hay horarios existentes, guardar versión anterior antes de limpiar ─
    horarios_previos = (
        db.query(Horario)
        .join(Asignacion)
        .filter(Asignacion.ciclo_escolar == ciclo_escolar, Horario.activo == True)
        .count()
    )
    
    if horarios_previos > 0 and clear_existing:
        SnapshotService.crear_snapshot(
            db=db,
            ciclo_escolar=ciclo_escolar,
            tipo_version="backup",
            descripcion="Respaldo automático antes de regeneración"
        )
    
    if clear_existing:
        _limpiar_horarios(db, ciclo_escolar)

    asignaciones = (
        db.query(Asignacion)
        .options(
            joinedload(Asignacion.materia),
            joinedload(Asignacion.grupo),
            joinedload(Asignacion.docente).joinedload(Docente.user),
        )
        .join(Docente, Asignacion.docente_id == Docente.id)
        .filter(
            Asignacion.ciclo_escolar == ciclo_escolar,
            Docente.activo == True,  # Solo docentes activos
        )
        .all()
    )
    
    # Filtrar por materias activas (después de obtener para contar skipped)
    asignaciones_activas = [a for a in asignaciones if a.materia.activo]
    asignaciones_inactivas = len(asignaciones) - len(asignaciones_activas)
    
    asignaciones = asignaciones_activas  # Usar solo asignaciones con módulos activos

    if not asignaciones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron asignaciones para el ciclo '{ciclo_escolar}'",
        )

    # ─ Diagnósticos previos (validar infraestructura) ─
    diagnosticos = _validar_prerequisitos(db, asignaciones)
    
    # Si hay problemas críticos, no continuar
    alertas = [d for d in diagnosticos if d['tipo'] == 'critica']

    stats = {
        "ciclo_escolar":            ciclo_escolar,
        "total_asignaciones":       len(asignaciones),
        "horarios_creados":         0,
        "asignaciones_completadas": 0,
        "asignaciones_parciales":   0,
        "asignaciones_fallidas":    [],
        "detalles":                 [],
        "diagnosticos":             diagnosticos,
        "alertas":                  alertas,
    }

    # Si hay alertas críticas, retornar sin generar
    if alertas:
        return stats

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
            "horas_creadas":      res.get("horas_nuevas", 0.0),
            "horas_esperadas":    res.get("horas_esperadas", 0.0),
            "razon_falla":        res.get("razon_falla"),
        })

    # ─ Validación POST-GENERACIÓN: verificar exhaustivamente que las horas sean correctas ─
    # ⚠️  Esta es la última línea de defensa contra violaciones de horas
    horas_por_asignacion = {}
    horarios_generados = (
        db.query(Horario)
        .join(Asignacion)
        .filter(Asignacion.ciclo_escolar == ciclo_escolar, Horario.activo == True)
        .all()
    )
    
    for h in horarios_generados:
        asign_id = h.asignacion_id
        if asign_id not in horas_por_asignacion:
            horas_por_asignacion[asign_id] = {
                'horas': 0.0,
                'horarios': [],
                'asignacion': None
            }
        horas_por_asignacion[asign_id]['horas'] += _horas(_to_time(h.hora_inicio), _to_time(h.hora_fin))
        horas_por_asignacion[asign_id]['horarios'].append(h.id)
    
    # Para cada asignación, guardar referencia
    for asignacion in asignaciones:
        if asignacion.id in horas_por_asignacion:
            horas_por_asignacion[asignacion.id]['asignacion'] = asignacion
    
    # Validar CRÍTICAMENTE que no se excedan horas por asignación
    advertencias_horas = []
    violaciones_criticas = []
    
    for asign_id, data in horas_por_asignacion.items():
        asignacion = data['asignacion']
        horas_asignacion = data['horas']
        
        if not asignacion or not asignacion.materia:
            continue
        
        horas_esperadas = asignacion.materia.horas_semana or 0
        num_horarios = len(data['horarios'])
        
        # CRITICAL: Si hay exceso, marcar como error crítico
        if horas_asignacion > horas_esperadas:
            docente_nombre = "—"
            if asignacion.docente and asignacion.docente.user:
                u = asignacion.docente.user
                docente_nombre = f"{u.nombre} {u.apellido}"
            
            exceso = round(horas_asignacion - horas_esperadas, 2)
            violacion = {
                "asignacion_id": asignacion.id,
                "grupo": asignacion.grupo.nombre if asignacion.grupo else "—",
                "materia": asignacion.materia.nombre,
                "docente": docente_nombre,
                "horas_esperadas": horas_esperadas,
                "horas_creadas": round(horas_asignacion, 2),
                "exceso": exceso,
                "num_sesiones": num_horarios,
                "sesion_ids": data['horarios'],
            }
            violaciones_criticas.append(violacion)
            advertencias_horas.append(violacion)
        
        # FALTA: Si hay menos de lo esperado, también reportar (pero no es error)
        elif horas_asignacion < horas_esperadas:
            docente_nombre = "—"
            if asignacion.docente and asignacion.docente.user:
                u = asignacion.docente.user
                docente_nombre = f"{u.nombre} {u.apellido}"
            
            falta = round(horas_esperadas - horas_asignacion, 2)
            stats["detalles"].append({
                "asignacion_id":  asignacion.id,
                "grupo":          asignacion.grupo.nombre if asignacion.grupo else "—",
                "materia":        asignacion.materia.nombre,
                "docente":        docente_nombre,
                "status":         "incompleto",
                "horas_creadas":  round(horas_asignacion, 2),
                "horas_esperadas": horas_esperadas,
                "falta":          falta,
                "num_sesiones":   num_horarios,
            })
    
    # Si hay violaciones críticas, marcar como error
    if violaciones_criticas:
        stats["advertencias_horas"] = advertencias_horas
        stats["status"] = "error"
        stats["mensaje"] = (
            f"❌ ERROR CRÍTICO: {len(violaciones_criticas)} asignación(es) excedió(eron) "
            f"su límite de horas. Por favor, limpie con 'clear_existing=True' y reintente."
        )
        # No retornar aún, dejar que el usuario vea los detalles
    else:
        stats["status"] = "success"
        stats["mensaje"] = f"✅ Generación exitosa: {stats['horarios_creados']} horarios creados"
        
        # ─ Crear snapshot de la generación exitosa ─
        SnapshotService.crear_snapshot(
            db=db,
            ciclo_escolar=ciclo_escolar,
            tipo_version="auto",
            descripcion=f"Generación automática: {stats['horarios_creados']} horarios creados"
        )

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
