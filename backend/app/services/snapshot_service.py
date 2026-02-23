"""
Servicio de Snapshots de Horarios.

Maneja la creación, lectura y gestión de versiones de horarios.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import HorarioSnapshot, Horario, Asignacion


class SnapshotService:
    """Servicio para manejar snapshots (versiones) de horarios."""
    
    @staticmethod
    def crear_snapshot(
        db: Session,
        ciclo_escolar: str,
        tipo_version: str = "auto",
        descripcion: str = "",
        usuario_id: Optional[int] = None,
        usuario_nombre: Optional[str] = None
    ) -> HorarioSnapshot:
        """
        Crea un snapshot (snapshot) de todos los horarios activos de un ciclo escolar.
        
        Args:
            db: Sesión de base de datos
            ciclo_escolar: Ciclo escolar (ej: "2026-1")
            tipo_version: "auto", "manual", "backup"
            descripcion: Descripción del cambio
            usuario_id: ID del usuario que realiza la acción
            usuario_nombre: Nombre del usuario
            
        Returns:
            HorarioSnapshot creado
        """
        # Obtener todos los horarios activos del ciclo
        horarios = db.query(Horario).filter(
            Horario.activo == True
        ).join(Asignacion).filter(
            Asignacion.ciclo_escolar == ciclo_escolar
        ).options(
            joinedload(Horario.asignacion).joinedload(Asignacion.docente),
            joinedload(Horario.asignacion).joinedload(Asignacion.materia),
            joinedload(Horario.asignacion).joinedload(Asignacion.grupo),
            joinedload(Horario.aula)
        ).all()
        
        # Convertir horarios a formato JSON-serializable
        horarios_data = []
        for h in horarios:
            horarios_data.append({
                "id": h.id,
                "asignacion_id": h.asignacion_id,
                "aula_id": h.aula_id,
                "aula_nombre": h.aula.nombre if h.aula else None,
                "dia_semana": h.dia_semana,
                "hora_inicio": h.hora_inicio.isoformat(),
                "hora_fin": h.hora_fin.isoformat(),
                "tipo_sesion": h.tipo_sesion,
                "docente_nombre": h.asignacion.docente.nombre if h.asignacion and h.asignacion.docente else None,
                "materia_nombre": h.asignacion.materia.nombre if h.asignacion and h.asignacion.materia else None,
                "grupo_nombre": h.asignacion.grupo.nombre if h.asignacion and h.asignacion.grupo else None,
            })
        
        # Obtener número de versión
        ultima_version = db.query(HorarioSnapshot).filter(
            HorarioSnapshot.ciclo_escolar == ciclo_escolar
        ).order_by(desc(HorarioSnapshot.version_numero)).first()
        
        version_numero = (ultima_version.version_numero + 1) if ultima_version else 1
        
        # Crear snapshot
        snapshot = HorarioSnapshot(
            ciclo_escolar=ciclo_escolar,
            version_numero=version_numero,
            horarios_data=horarios_data,
            tipo_version=tipo_version,
            descripcion=descripcion,
            usuario_id=usuario_id,
            usuario_nombre=usuario_nombre,
            created_at=datetime.utcnow()
        )
        
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        
        return snapshot
    
    @staticmethod
    def obtener_versiones(
        db: Session,
        ciclo_escolar: str
    ) -> List[HorarioSnapshot]:
        """
        Obtiene todas las versiones de un ciclo escolar ordenadas por fecha (desc).
        
        Args:
            db: Sesión de base de datos
            ciclo_escolar: Ciclo escolar (ej: "2026-1")
            
        Returns:
            Lista de HorarioSnapshot
        """
        return db.query(HorarioSnapshot).filter(
            HorarioSnapshot.ciclo_escolar == ciclo_escolar
        ).order_by(desc(HorarioSnapshot.created_at)).all()
    
    @staticmethod
    def obtener_version(
        db: Session,
        snapshot_id: int
    ) -> Optional[HorarioSnapshot]:
        """
        Obtiene un snapshot específico por ID.
        
        Args:
            db: Sesión de base de datos
            snapshot_id: ID del snapshot
            
        Returns:
            HorarioSnapshot o None
        """
        return db.query(HorarioSnapshot).filter(
            HorarioSnapshot.id == snapshot_id
        ).first()
    
    @staticmethod
    def obtener_grid_horarios(
        db: Session,
        snapshot_id: int,
        grupo_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Genera un grid de horarios (Hora × Día) desde un snapshot.
        
        Args:
            db: Sesión de base de datos
            snapshot_id: ID del snapshot
            grupo_id: ID del grupo (opcional, si no se especifica muestra todos)
            
        Returns:
            Dict con estructura {dias: [...], horas: [...], grid: {...}}
        """
        snapshot = SnapshotService.obtener_version(db, snapshot_id)
        if not snapshot:
            return {}
        
        # Días de la semana
        dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"]
        
        # Extraer horas únicas
        horas_set = set()
        for h in snapshot.horarios_data:
            if grupo_id is None or h.get("grupo_nombre"):  # TODO: comparar grupo_id
                horas_set.add(h["hora_inicio"])
        
        horas = sorted(list(horas_set))
        
        # Crear grid
        grid = {}
        for dia in dias:
            grid[dia] = {}
            for hora in horas:
                grid[dia][hora] = []
        
        # Llenar grid
        for h in snapshot.horarios_data:
            dia = h["dia_semana"].upper()
            hora = h["hora_inicio"]
            
            if dia in grid and hora in grid[dia]:
                grid[dia][hora].append({
                    "id": h["id"],
                    "materia": h["materia_nombre"],
                    "docente": h["docente_nombre"],
                    "grupo": h["grupo_nombre"],
                    "aula": h["aula_nombre"],
                    "tipo_sesion": h["tipo_sesion"],
                    "hora_fin": h["hora_fin"]
                })
        
        return {
            "snapshot_id": snapshot_id,
            "ciclo_escolar": snapshot.ciclo_escolar,
            "version_numero": snapshot.version_numero,
            "created_at": snapshot.created_at.isoformat(),
            "dias": dias,
            "horas": horas,
            "grid": grid
        }
