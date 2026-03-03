"""
Servicio para gestión de versiones de horarios.

Maneja creación, lectura y rollback de versiones de horarios.
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, Tuple, Dict, Any
from datetime import datetime, time

from app.models import HorarioVersion, Horario, Asignacion, Aula
from app.schemas.horario_version import (
    HorarioVersionCreate,
    HorarioVersionResponse,
    HorarioVersionDiffResponse,
)


def get_version_numero_siguiente(db: Session, horario_id: int) -> int:
    """
    Obtiene el siguiente número de versión para un horario.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario
        
    Returns:
        Siguiente número de versión (v1, v2, v3...)
    """
    ultima_version = db.query(HorarioVersion).filter(
        HorarioVersion.horario_id == horario_id
    ).order_by(desc(HorarioVersion.version_numero)).first()
    
    if not ultima_version:
        return 1
    return ultima_version.version_numero + 1


def snapshot_horario(horario: Horario) -> Dict[str, Any]:
    """
    Crea un snapshot (JSON) del estado actual de un horario.
    
    Args:
        horario: Objeto Horario
        
    Returns:
        Diccionario con el estado del horario
    """
    return {
        "id": horario.id,
        "asignacion_id": horario.asignacion_id,
        "aula_id": horario.aula_id,
        "dia_semana": horario.dia_semana.value if hasattr(horario.dia_semana, 'value') else str(horario.dia_semana),
        "hora_inicio": horario.hora_inicio.isoformat(),
        "hora_fin": horario.hora_fin.isoformat(),
        "tipo_sesion": horario.tipo_sesion.value if hasattr(horario.tipo_sesion, 'value') else str(horario.tipo_sesion),
        "activo": horario.activo,
        "created_at": horario.created_at.isoformat(),
        "updated_at": horario.updated_at.isoformat(),
    }


def registrar_version(
    db: Session,
    horario_id: int,
    tipo_cambio: str,
    descripcion_cambio: str,
    ciclo_escolar: str,
    estado_anterior: Optional[Dict[str, Any]] = None,
    estado_nuevo: Optional[Dict[str, Any]] = None,
    razon_cambio: Optional[str] = None,
    usuario_id: Optional[int] = None,
    usuario_nombre: Optional[str] = None,
) -> HorarioVersion:
    """
    Registra una nueva versión de un horario.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario
        tipo_cambio: "creacion", "modificacion", "eliminacion" o "rollback"
        descripcion_cambio: Descripción del cambio realizado
        ciclo_escolar: Ciclo escolar (ej: "2024-1")
        estado_anterior: Snapshot del estado anterior (None si es creación)
        estado_nuevo: Snapshot del nuevo estado
        razon_cambio: Razón del cambio (opcional)
        usuario_id: ID del usuario que hizo el cambio
        usuario_nombre: Nombre del usuario que hizo el cambio
        
    Returns:
        HorarioVersion creada
    """
    version_numero = get_version_numero_siguiente(db, horario_id)
    
    version = HorarioVersion(
        horario_id=horario_id,
        version_numero=version_numero,
        tipo_cambio=tipo_cambio,
        descripcion_cambio=descripcion_cambio,
        ciclo_escolar=ciclo_escolar,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        razon_cambio=razon_cambio,
        usuario_id=usuario_id,
        usuario_nombre=usuario_nombre,
    )
    
    db.add(version)
    db.commit()
    db.refresh(version)
    
    return version


def get_versiones_horario(
    db: Session,
    horario_id: int,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[list[HorarioVersion], int]:
    """
    Obtiene todas las versiones de un horario.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario
        skip: Número de registros a saltar
        limit: Número máximo de registros
        
    Returns:
        Tupla con (lista de versiones, total de registros)
    """
    query = db.query(HorarioVersion).filter(
        HorarioVersion.horario_id == horario_id
    ).order_by(desc(HorarioVersion.version_numero))
    
    total = query.count()
    versiones = query.offset(skip).limit(limit).all()
    
    return versiones, total


def get_version_especifica(
    db: Session,
    horario_id: int,
    version_numero: int,
) -> Optional[HorarioVersion]:
    """
    Obtiene una versión específica de un horario.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario
        version_numero: Número de versión
        
    Returns:
        HorarioVersion o None si no existe
    """
    return db.query(HorarioVersion).filter(
        HorarioVersion.horario_id == horario_id,
        HorarioVersion.version_numero == version_numero,
    ).first()


def calcular_diferencias(
    estado_anterior: Dict[str, Any],
    estado_nuevo: Dict[str, Any],
) -> Dict[str, Dict[str, Any]]:
    """
    Calcula las diferencias entre dos snapshots.
    
    Args:
        estado_anterior: Snapshot anterior
        estado_nuevo: Snapshot nuevo
        
    Returns:
        Diccionario con los cambios: {"campo": {"antes": x, "despues": y}}
    """
    cambios = {}
    
    # Comparar campos existentes
    todas_las_claves = set(estado_anterior.keys()) | set(estado_nuevo.keys())
    
    for clave in todas_las_claves:
        valor_anterior = estado_anterior.get(clave)
        valor_nuevo = estado_nuevo.get(clave)
        
        if valor_anterior != valor_nuevo:
            cambios[clave] = {
                "antes": valor_anterior,
                "despues": valor_nuevo,
            }
    
    return cambios


def get_diff_entre_versiones(
    db: Session,
    horario_id: int,
    version_num_1: int,
    version_num_2: int,
) -> Optional[HorarioVersionDiffResponse]:
    """
    Obtiene las diferencias entre dos versiones.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario
        version_num_1: Número de versión anterior
        version_num_2: Número de versión nueva
        
    Returns:
        HorarioVersionDiffResponse con las diferencias
    """
    if version_num_1 >= version_num_2:
        return None
    
    v1 = get_version_especifica(db, horario_id, version_num_1)
    v2 = get_version_especifica(db, horario_id, version_num_2)
    
    if not v1 or not v2:
        return None
    
    cambios = calcular_diferencias(v1.estado_nuevo, v2.estado_nuevo)
    
    return HorarioVersionDiffResponse(
        version_anterior=version_num_1,
        version_nueva=version_num_2,
        cambios=cambios,
        diferencias_totales=len(cambios),
        fecha_cambio=v2.created_at,
    )


def rollback_a_version(
    db: Session,
    horario_id: int,
    version_numero: int,
    razon: Optional[str] = None,
    usuario_id: Optional[int] = None,
    usuario_nombre: Optional[str] = None,
) -> Optional[Horario]:
    """
    Revierte un horario a una versión anterior.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario
        version_numero: Número de versión a la que revertir
        razon: Razón del rollback
        usuario_id: ID del usuario que hizo el rollback
        usuario_nombre: Nombre del usuario
        
    Returns:
        Horario actualizado o None si la versión no existe
    """
    # Obtener la versión objetivo
    version_objetivo = get_version_especifica(db, horario_id, version_numero)
    if not version_objetivo:
        return None
    
    # Obtener el horario actual
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        return None
    
    # Guardar snapshot del estado actual (antes del rollback)
    estado_antes = snapshot_horario(horario)
    
    # Aplicar los cambios del snapshot objetivo
    estado_objetivo = version_objetivo.estado_nuevo
    
    horario.dia_semana = estado_objetivo["dia_semana"]
    
    # Convertir strings a objetos time si es necesario
    hora_inicio = estado_objetivo["hora_inicio"]
    if isinstance(hora_inicio, str):
        hora_inicio = datetime.strptime(hora_inicio, "%H:%M:%S").time()
    horario.hora_inicio = hora_inicio
    
    hora_fin = estado_objetivo["hora_fin"]
    if isinstance(hora_fin, str):
        hora_fin = datetime.strptime(hora_fin, "%H:%M:%S").time()
    horario.hora_fin = hora_fin
    
    horario.tipo_sesion = estado_objetivo["tipo_sesion"]
    horario.aula_id = estado_objetivo["aula_id"]
    horario.activo = estado_objetivo["activo"]
    
    db.commit()
    db.refresh(horario)
    
    # Registrar el rollback como una nueva versión
    estado_despues = snapshot_horario(horario)
    registrar_version(
        db=db,
        horario_id=horario_id,
        tipo_cambio="rollback",
        descripcion_cambio=f"Revertido a versión {version_numero}",
        ciclo_escolar=horario.asignacion.ciclo_escolar,
        estado_anterior=estado_antes,
        estado_nuevo=estado_despues,
        razon_cambio=razon,
        usuario_id=usuario_id,
        usuario_nombre=usuario_nombre,
    )
    
    return horario


def limpiar_versiones_antiguas(
    db: Session,
    horario_id: int,
    mantener_ultimas: int = 20,
) -> int:
    """
    Elimina versiones antiguas manteniendo las últimas N.
    Útil para mantener la BD limpia sin perder historial reciente.
    
    Args:
        db: Sesión de base de datos
        horario_id: ID del horario
        mantener_ultimas: Número de versiones recientes a mantener
        
    Returns:
        Número de versiones eliminadas
    """
    # Obtener todas las versiones ordenadas por número descendente
    versiones = db.query(HorarioVersion).filter(
        HorarioVersion.horario_id == horario_id
    ).order_by(desc(HorarioVersion.version_numero)).all()
    
    # Si hay más versiones de las que queremos mantener
    if len(versiones) > mantener_ultimas:
        versiones_a_eliminar = versiones[mantener_ultimas:]
        
        for version in versiones_a_eliminar:
            db.delete(version)
        
        db.commit()
        return len(versiones_a_eliminar)
    
    return 0
