"""
demo.py — Script de DEMO automática
Ejecuta las funcionalidades principales del sistema SPH sin intervención manual.

Flujo:
  1. Login (admin y coordinador)
  2. Ver catálogos (docentes, materias, grupos)
  3. Ver disponibilidades
  4. Generar horarios automáticamente
  5. Visualizar conflictos
  6. Buscar ocupaciones de docentes

Uso:
    python demo.py
"""
import sys
import os
import time
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import (
    User, Docente, Grupo, Materia, Aula, Asignacion, 
    DisponibilidadDocente, Horario, Conflicto
)
from app.core.security import verify_password
from app.services import schedule_generator
from sqlalchemy.orm import joinedload

console = Console()
CICLO = "2026-1"


def print_header(title):
    console.print(Panel(f"[bold cyan]{title}[/bold cyan]", expand=False))


def print_success(msg):
    console.print(f"[green]✓[/green] {msg}")


def print_info(msg):
    console.print(f"[blue]ℹ[/blue] {msg}")


def print_table(title, columns, rows):
    table = Table(title=title, show_header=True, header_style="bold magenta")
    for col in columns:
        table.add_column(col)
    for row in rows:
        table.add_row(*[str(r) for r in row])
    console.print(table)


def main():
    db = SessionLocal()
    
    try:
        print_header("🎯 DEMO SPH SYSTEM UTEC v1.0")
        
        # ───────────────────────────────────────────────────────────────────
        # 1. AUTHENTIFICACIÓN
        # ───────────────────────────────────────────────────────────────────
        print_header("1️⃣  AUTENTICACIÓN")
        
        admin_user = db.query(User).filter(User.email == "admin@utec.edu.mx").first()
        coord_user = db.query(User).filter(User.email == "coordinador@utec.edu.mx").first()
        
        if admin_user:
            print_success(f"Admin encontrado: {admin_user.nombre} {admin_user.apellido}")
        else:
            print("[red]✗[/red] Admin no encontrado")
            return
        
        if coord_user:
            print_success(f"Coordinador encontrado: {coord_user.nombre} {coord_user.apellido}")
        else:
            print("[red]✗[/red] Coordinador no encontrado")
            return
        
        time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 2. CATÁLOGOS
        # ───────────────────────────────────────────────────────────────────
        print_header("2️⃣  CATÁLOGOS - ESTADÍSTICAS GENERALES")
        
        num_docentes = db.query(Docente).filter(Docente.activo == True).count()
        num_grupos = db.query(Grupo).filter(Grupo.activo == True).count()
        num_materias = db.query(Materia).filter(Materia.activo == True).count()
        num_aulas = db.query(Aula).filter(Aula.activo == True).count()
        num_asignaciones = db.query(Asignacion).filter(Asignacion.ciclo_escolar == CICLO).count()
        num_horarios = db.query(Horario).filter(Horario.activo == True).count()
        
        print_success(f"Docentes activos:      {num_docentes}")
        print_success(f"Grupos activos:        {num_grupos}")
        print_success(f"Materias activas:      {num_materias}")
        print_success(f"Aulas disponibles:     {num_aulas}")
        print_success(f"Asignaciones ({CICLO}):    {num_asignaciones}")
        print_success(f"Horarios generados:    {num_horarios}")
        
        time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 3. DOCENTES MUESTRA
        # ───────────────────────────────────────────────────────────────────
        print_header("3️⃣  PRIMEROS 5 DOCENTES")
        
        docentes = db.query(Docente).join(User).limit(5).all()
        rows = []
        for doc in docentes:
            rows.append([
                doc.codigo_docente,
                f"{doc.user.nombre} {doc.user.apellido}",
                doc.departamento,
                f"{doc.horas_maximas_semana}h"
            ])
        
        print_table("Docentes", ["Código", "Nombre", "Departamento", "Horas Max"], rows)
        
        time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 4. DISPONIBILIDADES MUESTRA (DOCENTE 1)
        # ───────────────────────────────────────────────────────────────────
        if docentes:
            doc = docentes[0]
            print_header(f"4️⃣  DISPONIBILIDAD DE {doc.codigo_docente} ({doc.user.nombre})")
            
            disp = db.query(DisponibilidadDocente).filter(
                DisponibilidadDocente.docente_id == doc.id
            ).limit(10).all()
            
            if disp:
                rows = []
                for d in disp[:10]:
                    rows.append([
                        d.dia_semana.value,
                        str(d.hora_inicio)[:5],
                        str(d.hora_fin)[:5]
                    ])
                print_table("Disponibilidades", ["Día", "Inicio", "Fin"], rows)
                print_info(f"Total de franjas disponibles: {db.query(DisponibilidadDocente).filter(DisponibilidadDocente.docente_id == doc.id).count()}")
            
            time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 5. GRUPOS Y ASIGNACIONES
        # ───────────────────────────────────────────────────────────────────
        print_header("5️⃣  GRUPOS Y SUS ASIGNACIONES")
        
        grupos = db.query(Grupo).limit(3).all()
        for grupo in grupos:
            asignaciones = db.query(Asignacion).filter(
                Asignacion.grupo_id == grupo.id,
                Asignacion.ciclo_escolar == CICLO
            ).all()
            
            rows = []
            for asig in asignaciones:
                rows.append([
                    asig.materia.codigo_materia,
                    asig.materia.nombre[:30],
                    asig.docente.user.nombre,
                ])
            
            if rows:
                print_table(
                    f"Grupo {grupo.codigo_grupo} ({grupo.carrera}, S{grupo.semestre})",
                    ["Materia Código", "Materia Nombre", "Docente"],
                    rows
                )
        
        time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 6. HORARIOS EXISTENTES
        # ───────────────────────────────────────────────────────────────────
        print_header("6️⃣  HORARIOS GENERADOS (MUESTRA)")
        
        horarios = db.query(Horario).filter(Horario.activo == True).limit(8).all()
        if horarios:
            rows = []
            for h in horarios:
                rows.append([
                    h.dia_semana.value,
                    str(h.hora_inicio)[:5] + " - " + str(h.hora_fin)[:5],
                    h.asignacion.materia.codigo_materia,
                    h.asignacion.grupo.codigo_grupo,
                    h.aula.codigo_aula,
                    h.tipo_sesion.value,
                ])
            
            print_table(
                "Horarios Activos",
                ["Día", "Hora", "Materia", "Grupo", "Aula", "Tipo"],
                rows
            )
        else:
            print_info("No hay horarios generados aún")
        
        time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 7. INTENTO DE GENERACIÓN de HORARIOS (si no existen muchos)
        # ───────────────────────────────────────────────────────────────────
        if num_horarios < 20:
            print_header("7️⃣  GENERACIÓN AUTOMÁTICA DE HORARIOS")
            
            print_info("Iniciando generación de horarios para el ciclo...")
            
            try:
                with Progress() as progress:
                    task = progress.add_task("[cyan]Generando horarios...", total=100)
                    
                    # Pre-validación
                    docentes_sin_disp = schedule_generator.find_docentes_without_disponibilidad(db)
                    if docentes_sin_disp:
                        print(f"[yellow]⚠[/yellow] Docentes sin disponibilidad registrada: {docentes_sin_disp}")
                    
                    progress.update(task, advance=30)
                    time.sleep(0.5)
                    
                    # Generar horarios
                    resultado = schedule_generator.generate_schedules(db, CICLO)
                    
                    progress.update(task, advance=70)
                    time.sleep(0.5)
                    
                    num_horarios_nuevo = db.query(Horario).filter(Horario.activo == True).count()
                    print_success(f"Horarios generados: {num_horarios_nuevo}")
                    
            except Exception as e:
                print(f"[yellow]⚠[/yellow] Error en generación: {str(e)}")
            
            time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 8. ANÁLISIS DE CONFLICTOS
        # ───────────────────────────────────────────────────────────────────
        print_header("8️⃣  ANÁLISIS DE CONFLICTOS")
        
        # Contar conflictos potenciales
        num_conflictos = db.query(Conflicto).count()
        
        if num_conflictos > 0:
            print_info(f"Conflictos detectados: {num_conflictos}")
            conflictos = db.query(Conflicto).limit(5).all()
            rows = []
            for c in conflictos:
                rows.append([
                    getattr(c, 'tipo_conflicto', 'N/A'),
                    getattr(c, 'descripcion', 'Sin descripción')[:40],
                    "Activo" if getattr(c, 'activo', True) else "Resuelto",
                ])
            print_table("Últimos Conflictos", ["Tipo", "Descripción", "Estado"], rows)
        else:
            print_success("No hay conflictos detectados ✓")
        
        time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 9. OCUPACIONES DE UN DOCENTE
        # ───────────────────────────────────────────────────────────────────
        if docentes:
            doc = docentes[0]
            print_header(f"9️⃣  OCUPACIONES DE {doc.codigo_docente}")
            
            # Buscar horarios del docente
            ocupaciones = db.query(Horario).join(
                Asignacion
            ).filter(
                Asignacion.docente_id == doc.id,
                Horario.activo == True
            ).all()
            
            if ocupaciones:
                rows = []
                for h in ocupaciones[:5]:
                    rows.append([
                        h.dia_semana.value,
                        str(h.hora_inicio)[:5] + "-" + str(h.hora_fin)[:5],
                        h.asignacion.materia.codigo_materia,
                        h.asignacion.grupo.codigo_grupo,
                    ])
                print_table(
                    f"Sesiones de {doc.codigo_docente}",
                    ["Día", "Hora", "Materia", "Grupo"],
                    rows
                )
                print_info(f"Total de sesiones: {len(ocupaciones)}")
            else:
                print_info("Sin sesiones asignadas aún")
        
        time.sleep(1)
        
        # ───────────────────────────────────────────────────────────────────
        # 10. RESUMEN FINAL
        # ───────────────────────────────────────────────────────────────────
        print_header("✅ DEMO COMPLETADA EXITOSAMENTE")
        
        console.print(Panel(
            f"""
[bold]RESUMEN DEL SISTEMA[/bold]

Ciclo:              {CICLO}
Docentes:           {num_docentes}
Grupos:             {num_grupos}
Materias:           {num_materias}
Aulas:              {num_aulas}
Asignaciones:       {num_asignaciones}
Horarios:           {db.query(Horario).filter(Horario.activo == True).count()}
Conflictos:         {num_conflictos}

[green]Sistema listo para usar en el navegador[/green]
[yellow]URL: http://localhost:4321[/yellow]
[yellow]Backend: http://localhost:8000/docs[/yellow]
            """,
            expand=False,
            border_style="green"
        ))
        
    
    except Exception as e:
        print(f"\n[red]❌ ERROR[/red]: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
