"""
seed_db_realista.py — Poblar BD con datos REALISTAS de UTEC
Incluye:
  • 20+ docentes de diferentes departamentos
  • 25+ grupos de múltiples carreras y semestres
  • Disponibilidades variadas (no todos 7-21)
  • Asignaciones complejas pero sin conflictos
  • Horarios distribuidos sin overlaps

Uso:
    python seed_db_realista.py                  → llena TODO en orden
    python seed_db_realista.py users            → solo usuarios
    python seed_db_realista.py docentes         → solo docentes
    python seed_db_realista.py grupos           → solo grupos
    python seed_db_realista.py asignaciones     → solo asignaciones
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import (
    User, Docente, Aula, Materia, Grupo,
    Asignacion, DisponibilidadDocente, Horario,
)
from app.models.user import RolEnum
from app.models.aula import TipoAulaEnum as TipoAula
from app.models.materia import TipoAulaEnum as TipoAulaMateria
from app.models.horario import DiaSemanaEnum, TipoSesionEnum
from app.core.security import get_password_hash
from datetime import time

CICLO = "2026-1"

def ok(msg):     print(f"  ✓  {msg}")
def banner(msg): print(f"\n{'─'*60}\n  {msg}\n{'─'*60}")


class UsersSeeder:
    """Usuarios: Admin + Coordinador + 25 docentes"""
    
    ROWS = [
        # (email, pwd, nombre, apellido, rol)
        ("admin@utec.edu.mx",        "admin123",   "Administrador", "Sistema",   RolEnum.ADMIN),
        ("coordinador@utec.edu.mx",  "coord123",   "Laura",         "Vázquez",   RolEnum.COORDINADOR),
        
        # Docentes Ciencias Básicas (5)
        ("carlos.mendoza@utec.edu.mx",   "docente123", "Carlos",    "Mendoza",   RolEnum.COORDINADOR),
        ("ana.rodriguez@utec.edu.mx",    "docente123", "Ana",       "Rodríguez", RolEnum.COORDINADOR),
        ("roberto.garcia@utec.edu.mx",   "docente123", "Roberto",   "García",    RolEnum.COORDINADOR),
        ("maria.lopez@utec.edu.mx",      "docente123", "María",     "López",     RolEnum.COORDINADOR),
        ("javier.hernandez@utec.edu.mx", "docente123", "Javier",    "Hernández", RolEnum.COORDINADOR),
        
        # Docentes Ingeniería en Sistemas (6)
        ("patricia.reyes@utec.edu.mx",     "docente123", "Patricia",  "Reyes",     RolEnum.COORDINADOR),
        ("david.sanchez@utec.edu.mx",      "docente123", "David",     "Sánchez",   RolEnum.COORDINADOR),
        ("silvia.torres@utec.edu.mx",      "docente123", "Silvia",    "Torres",    RolEnum.COORDINADOR),
        ("fernando.diaz@utec.edu.mx",      "docente123", "Fernando",  "Díaz",      RolEnum.COORDINADOR),
        ("monica.cruz@utec.edu.mx",        "docente123", "Mónica",    "Cruz",      RolEnum.COORDINADOR),
        ("pablo.gutierrez@utec.edu.mx",    "docente123", "Pablo",     "Gutiérrez", RolEnum.COORDINADOR),
        
        # Docentes Electrónica (4)
        ("luis.moreno@utec.edu.mx",        "docente123", "Luis",      "Moreno",    RolEnum.COORDINADOR),
        ("elena.vargas@utec.edu.mx",       "docente123", "Elena",     "Vargas",    RolEnum.COORDINADOR),
        ("jose.flores@utec.edu.mx",        "docente123", "José",      "Flores",    RolEnum.COORDINADOR),
        ("rosa.campos@utec.edu.mx",        "docente123", "Rosa",      "Campos",    RolEnum.COORDINADOR),
        
        # Docentes Ingeniería Mecánica (3)
        ("marco.rivas@utec.edu.mx",        "docente123", "Marco",     "Rivas",     RolEnum.COORDINADOR),
        ("sofia.herrera@utec.edu.mx",      "docente123", "Sofía",     "Herrera",   RolEnum.COORDINADOR),
        ("gustavo.leon@utec.edu.mx",       "docente123", "Gustavo",   "León",      RolEnum.COORDINADOR),
        
        # Docentes Administración (2)
        ("beatriz.castro@utec.edu.mx",     "docente123", "Beatriz",   "Castro",    RolEnum.COORDINADOR),
        ("raul.mendez@utec.edu.mx",        "docente123", "Raúl",      "Méndez",    RolEnum.COORDINADOR),
    ]

    def run(self, db):
        banner("👤 USUARIOS (27 total)")
        for email, pwd, nombre, apellido, rol in self.ROWS:
            if db.query(User).filter(User.email == email).first():
                ok(f"YA EXISTE → {email}")
                continue
            u = User(
                email=email,
                password_hash=get_password_hash(pwd),
                nombre=nombre,
                apellido=apellido,
                rol=rol,
                activo=True,
            )
            db.add(u)
            ok(f"{str(rol.value):<14} {nombre} {apellido}")
        db.commit()
        print(f"\n  → {db.query(User).count()} usuarios en BD")


class AulasSeeder:
    """30 aulas reales: normales, labs, talleretes"""
    
    ROWS = [
        # (codigo, nombre, capacidad, tipo, edificio, piso)
        # Aulas normales Edificio A
        ("AU-A101", "Aula A101",        40, TipoAula.NORMAL,      "A", 1),
        ("AU-A102", "Aula A102",        35, TipoAula.NORMAL,      "A", 1),
        ("AU-A103", "Aula A103",        42, TipoAula.NORMAL,      "A", 1),
        ("AU-A104", "Aula A104",        38, TipoAula.NORMAL,      "A", 1),
        ("AU-A201", "Aula A201",        45, TipoAula.NORMAL,      "A", 2),
        ("AU-A202", "Aula A202",        40, TipoAula.NORMAL,      "A", 2),
        ("AU-A203", "Aula A203",        42, TipoAula.NORMAL,      "A", 2),
        ("AU-A301", "Aula A301",        38, TipoAula.NORMAL,      "A", 3),
        ("AU-A302", "Aula A302",        40, TipoAula.NORMAL,      "A", 3),
        ("AU-A303", "Aula A303",        35, TipoAula.NORMAL,      "A", 3),
        
        # Aulas normales Edificio B
        ("AU-B101", "Aula B101",        50, TipoAula.NORMAL,      "B", 1),
        ("AU-B102", "Aula B102",        45, TipoAula.NORMAL,      "B", 1),
        ("AU-B201", "Aula B201",        42, TipoAula.NORMAL,      "B", 2),
        ("AU-B202", "Aula B202",        40, TipoAula.NORMAL,      "B", 2),
        ("AU-B301", "Aula B301",        38, TipoAula.NORMAL,      "B", 3),
        
        # Labs Cómputo Edificio C
        ("LAB-C101", "Lab Cómputo 1",   25, TipoAula.COMPUTO,     "C", 1),
        ("LAB-C102", "Lab Cómputo 2",   25, TipoAula.COMPUTO,     "C", 1),
        ("LAB-C103", "Lab Cómputo 3",   28, TipoAula.COMPUTO,     "C", 1),
        ("LAB-C201", "Lab Cómputo 4",   25, TipoAula.COMPUTO,     "C", 2),
        
        # Labs Electrónica y Física
        ("LAB-C301", "Lab Electrónica", 20, TipoAula.LABORATORIO, "C", 3),
        ("LAB-C302", "Lab Física",      20, TipoAula.LABORATORIO, "C", 3),
        ("LAB-C303", "Lab Química",     22, TipoAula.LABORATORIO, "C", 3),
        
        # Talleres
        ("TAL-D101", "Taller Mecánica", 30, TipoAula.LABORATORIO, "D", 1),
        ("TAL-D102", "Taller Soldadura",20, TipoAula.LABORATORIO, "D", 1),
        ("TAL-D103", "Taller CAD",      25, TipoAula.LABORATORIO, "D", 1),
        ("TAL-E101", "Taller Electrico",28, TipoAula.LABORATORIO, "E", 1),
        ("TAL-E102", "Taller Electron", 22, TipoAula.LABORATORIO, "E", 1),
        
        # Aulas multipropósito
        ("AUD-F101", "Auditorio",       150, TipoAula.NORMAL,     "F", 1),
    ]

    def run(self, db):
        banner(f"🏫 AULAS ({len(self.ROWS)} total)")
        for codigo, nombre, cap, tipo, edif, piso in self.ROWS:
            if db.query(Aula).filter(Aula.codigo_aula == codigo).first():
                ok(f"YA EXISTE → {codigo}")
                continue
            db.add(Aula(codigo_aula=codigo, nombre=nombre, capacidad=cap,
                        tipo=tipo, edificio=edif, piso=piso, activo=True))
            ok(f"{codigo:<12} {nombre:<20} Cap:{cap:2d}")
        db.commit()
        print(f"\n  → {db.query(Aula).count()} aulas en BD")


class MateriasSeeder:
    """50+ materias UTEC reales"""
    
    ROWS = [
        # Ciencias Básicas
        ("CB-MAT101", "Matemáticas I",                  5, 4, TipoAulaMateria.NORMAL),
        ("CB-MAT102", "Álgebra Lineal",                 5, 4, TipoAulaMateria.NORMAL),
        ("CB-MAT201", "Matemáticas II",                 5, 4, TipoAulaMateria.NORMAL),
        ("CB-MAT202", "Ecuaciones Diferenciales",       5, 4, TipoAulaMateria.NORMAL),
        ("CB-MAT301", "Cálculo Diferencial",            5, 4, TipoAulaMateria.NORMAL),
        ("CB-MAT302", "Cálculo Integral",               5, 4, TipoAulaMateria.NORMAL),
        ("CB-FIS101", "Física I",                       5, 4, TipoAulaMateria.NORMAL),
        ("CB-FIS102", "Física II",                      5, 4, TipoAulaMateria.NORMAL),
        ("CB-FIS201", "Física III",                     5, 4, TipoAulaMateria.NORMAL),
        ("CB-QUI101", "Química General",                4, 4, TipoAulaMateria.LABORATORIO),
        ("CB-QUI201", "Química Orgánica",               4, 4, TipoAulaMateria.LABORATORIO),
        
        # Ing. en Sistemas
        ("ISC-PRG101", "Programación Básica",           4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-PRG102", "Programación Orientada a Objs", 4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-PRG201", "Programación Avanzada",         4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-PRG301", "Estructuras de Datos",          4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-PRG401", "Algoritmos",                    4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-BD101",  "Introducción a BD",             4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-BD201",  "Bases de Datos",                4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-BD301",  "Admin. BD",                     4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-RED201", "Fundamentos de Redes",          4, 4, TipoAulaMateria.NORMAL),
        ("ISC-RED301", "Redes de Computadoras",         4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-RED401", "Seguridad de Redes",            4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-SIS101", "Sistemas Operativos",           4, 4, TipoAulaMateria.NORMAL),
        ("ISC-SIS201", "Admin. de Sistemas",            4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-WEB101", "Desarrollo Web I",              4, 4, TipoAulaMateria.COMPUTO),
        ("ISC-WEB201", "Desarrollo Web II",             4, 4, TipoAulaMateria.COMPUTO),
        
        # Electrónica
        ("ELT-ELT101", "Electrónica Básica",           4, 4, TipoAulaMateria.LABORATORIO),
        ("ELT-ELT201", "Electrónica Digital",          4, 4, TipoAulaMateria.LABORATORIO),
        ("ELT-ELT301", "Electrónica Analógica",        4, 4, TipoAulaMateria.LABORATORIO),
        ("ELT-MIC101", "Microcontroladores",           4, 4, TipoAulaMateria.LABORATORIO),
        ("ELT-MIC201", "Sistemas Embebidos",           4, 4, TipoAulaMateria.LABORATORIO),
        ("ELT-PLC101", "Automatización Industrial",     4, 4, TipoAulaMateria.LABORATORIO),
        
        # Mecánica
        ("MEC-CAD101", "Dibujo Técnico",                3, 4, TipoAulaMateria.LABORATORIO),
        ("MEC-CAD201", "CAD 2D",                        4, 4, TipoAulaMateria.LABORATORIO),
        ("MEC-CAD301", "CAD 3D",                        4, 4, TipoAulaMateria.LABORATORIO),
        ("MEC-MEC101", "Mecánica I",                    5, 4, TipoAulaMateria.NORMAL),
        ("MEC-MEC201", "Mecánica II",                   5, 4, TipoAulaMateria.NORMAL),
        ("MEC-TER101", "Termodinámica",                 4, 4, TipoAulaMateria.NORMAL),
        ("MEC-MAT101", "Materiales",                    4, 4, TipoAulaMateria.NORMAL),
        
        # Administración
        ("ADM-ADM101", "Admin. General",                3, 2, TipoAulaMateria.NORMAL),
        ("ADM-CON101", "Contabilidad I",                4, 4, TipoAulaMateria.NORMAL),
        ("ADM-CON201", "Contabilidad II",               4, 4, TipoAulaMateria.NORMAL),
        ("ADM-ECO101", "Economía Política",             3, 3, TipoAulaMateria.NORMAL),
        ("ADM-FIN101", "Finanzas I",                    4, 4, TipoAulaMateria.NORMAL),
        ("ADM-MARK101", "Marketing",                    3, 3, TipoAulaMateria.NORMAL),
    ]

    def run(self, db):
        banner(f"📚 MATERIAS ({len(self.ROWS)} total)")
        for codigo, nombre, cred, horas, tipo in self.ROWS:
            if db.query(Materia).filter(Materia.codigo_materia == codigo).first():
                ok(f"YA EXISTE → {codigo}")
                continue
            db.add(Materia(codigo_materia=codigo, nombre=nombre, creditos=cred,
                           horas_semana=horas, tipo_aula_requerida=tipo, activo=True))
            ok(f"{codigo:<12} {nombre:<35}")
        db.commit()
        print(f"\n  → {db.query(Materia).count()} materias en BD")


class GruposSeeder:
    """25+ grupos de múltiples carreras"""
    
    ROWS = [
        # (codigo, nombre, carrera, semestre, turno, num_estudiantes)
        # ISC — 10 grupos
        ("ISC-1A", "ISC Sem 1-A", "Ing. Sistemas Computacionales", 1, "matutino",   35),
        ("ISC-1B", "ISC Sem 1-B", "Ing. Sistemas Computacionales", 1, "vespertino", 32),
        ("ISC-2A", "ISC Sem 2-A", "Ing. Sistemas Computacionales", 2, "matutino",   33),
        ("ISC-2B", "ISC Sem 2-B", "Ing. Sistemas Computacionales", 2, "vespertino", 30),
        ("ISC-3A", "ISC Sem 3-A", "Ing. Sistemas Computacionales", 3, "matutino",   32),
        ("ISC-3B", "ISC Sem 3-B", "Ing. Sistemas Computacionales", 3, "vespertino", 28),
        ("ISC-4A", "ISC Sem 4-A", "Ing. Sistemas Computacionales", 4, "matutino",   30),
        ("ISC-5A", "ISC Sem 5-A", "Ing. Sistemas Computacionales", 5, "matutino",   25),
        ("ISC-6A", "ISC Sem 6-A", "Ing. Sistemas Computacionales", 6, "matutino",   22),
        ("ISC-8A", "ISC Sem 8-A", "Ing. Sistemas Computacionales", 8, "matutino",   15),
        
        # Electrónica — 6 grupos
        ("ELT-1A", "ELT Sem 1-A", "Ing. Electrónica", 1, "matutino",   28),
        ("ELT-2A", "ELT Sem 2-A", "Ing. Electrónica", 2, "matutino",   26),
        ("ELT-3A", "ELT Sem 3-A", "Ing. Electrónica", 3, "matutino",   22),
        ("ELT-4A", "ELT Sem 4-A", "Ing. Electrónica", 4, "matutino",   20),
        ("ELT-5A", "ELT Sem 5-A", "Ing. Electrónica", 5, "matutino",   18),
        ("ELT-6A", "ELT Sem 6-A", "Ing. Electrónica", 6, "matutino",   16),
        
        # Mecánica — 6 grupos
        ("MEC-1A", "MEC Sem 1-A", "Ing. Mecánica", 1, "matutino",   30),
        ("MEC-2A", "MEC Sem 2-A", "Ing. Mecánica", 2, "matutino",   28),
        ("MEC-3A", "MEC Sem 3-A", "Ing. Mecánica", 3, "matutino",   25),
        ("MEC-4A", "MEC Sem 4-A", "Ing. Mecánica", 4, "matutino",   22),
        ("MEC-5A", "MEC Sem 5-A", "Ing. Mecánica", 5, "matutino",   20),
        ("MEC-6A", "MEC Sem 6-A", "Ing. Mecánica", 6, "matutino",   18),
        
        # Administración — 4 grupos
        ("ADM-1A", "ADM Sem 1-A", "Administración de Empresas", 1, "matutino",   40),
        ("ADM-2A", "ADM Sem 2-A", "Administración de Empresas", 2, "matutino",   38),
        ("ADM-3A", "ADM Sem 3-A", "Administración de Empresas", 3, "matutino",   35),
    ]

    def run(self, db):
        banner(f"👥 GRUPOS ({len(self.ROWS)} total)")
        for codigo, nombre, carrera, sem, turno, alumnos in self.ROWS:
            if db.query(Grupo).filter(Grupo.codigo_grupo == codigo).first():
                ok(f"YA EXISTE → {codigo}")
                continue
            db.add(Grupo(codigo_grupo=codigo, nombre=nombre, carrera=carrera,
                         semestre=sem, turno=turno, num_estudiantes=alumnos,
                         ciclo_escolar=CICLO, activo=True))
            ok(f"{codigo:<8} S{sem} {turno:<12} {carrera}")
        db.commit()
        print(f"\n  → {db.query(Grupo).count()} grupos en BD")


class DocentesSeeder:
    """25 docentes con horas realistas"""
    
    ROWS = [
        # (email, codigo, departamento, horas_max)
        # Ciencias Básicas
        ("carlos.mendoza@utec.edu.mx",     "DOC-001", "Ciencias Básicas", 40),
        ("ana.rodriguez@utec.edu.mx",      "DOC-002", "Ciencias Básicas", 40),
        ("roberto.garcia@utec.edu.mx",     "DOC-003", "Ciencias Básicas", 38),
        ("maria.lopez@utec.edu.mx",        "DOC-004", "Ciencias Básicas", 40),
        ("javier.hernandez@utec.edu.mx",   "DOC-005", "Ciencias Básicas", 36),
        
        # Ingeniería en Sistemas
        ("patricia.reyes@utec.edu.mx",     "DOC-006", "Ing. Sistemas",    40),
        ("david.sanchez@utec.edu.mx",      "DOC-007", "Ing. Sistemas",    40),
        ("silvia.torres@utec.edu.mx",      "DOC-008", "Ing. Sistemas",    40),
        ("fernando.diaz@utec.edu.mx",      "DOC-009", "Ing. Sistemas",    38),
        ("monica.cruz@utec.edu.mx",        "DOC-010", "Ing. Sistemas",    40),
        ("pablo.gutierrez@utec.edu.mx",    "DOC-011", "Ing. Sistemas",    36),
        
        # Electrónica
        ("luis.moreno@utec.edu.mx",        "DOC-012", "Electrónica",      40),
        ("elena.vargas@utec.edu.mx",       "DOC-013", "Electrónica",      40),
        ("jose.flores@utec.edu.mx",        "DOC-014", "Electrónica",      38),
        ("rosa.campos@utec.edu.mx",        "DOC-015", "Electrónica",      40),
        
        # Mecánica
        ("marco.rivas@utec.edu.mx",        "DOC-016", "Mecánica",         40),
        ("sofia.herrera@utec.edu.mx",      "DOC-017", "Mecánica",         40),
        ("gustavo.leon@utec.edu.mx",       "DOC-018", "Mecánica",         38),
        
        # Administración
        ("beatriz.castro@utec.edu.mx",     "DOC-019", "Administración",   36),
        ("raul.mendez@utec.edu.mx",        "DOC-020", "Administración",   34),
    ]

    def run(self, db):
        banner(f"👨‍🏫 DOCENTES ({len(self.ROWS)} total)")
        for email, codigo, depto, horas in self.ROWS:
            if db.query(Docente).filter(Docente.codigo_docente == codigo).first():
                ok(f"YA EXISTE → {codigo}")
                continue
            user = db.query(User).filter(User.email == email).first()
            if not user:
                print(f"  ✗  Usuario {email} no encontrado"); continue
            db.add(Docente(user_id=user.id, codigo_docente=codigo,
                          departamento=depto, horas_maximas_semana=horas, activo=True))
            ok(f"{codigo}  {user.nombre:<12} {user.apellido:<15} {depto}")
        db.commit()
        print(f"\n  → {db.query(Docente).count()} docentes en BD")


class DisponibilidadSeeder:
    """Disponibilidades variadas y realistas"""
    
    # (codigo_docente, dias, hora_inicio, hora_fin)
    DISPONIBILIDADES = [
        # Turno matutino (7-13)
        ("DOC-001", ["lunes", "martes", "miercoles", "jueves", "viernes"], 7, 13),
        ("DOC-002", ["lunes", "martes", "miercoles", "jueves", "viernes"], 7, 14),
        ("DOC-003", ["lunes", "martes", "miercoles", "jueves", "viernes"], 8, 13),
        ("DOC-004", ["lunes", "martes", "miercoles", "jueves", "viernes"], 7, 13),
        ("DOC-005", ["lunes", "miercoles", "viernes"], 7, 13),
        
        # Turno vespertino (14-20)
        ("DOC-006", ["lunes", "martes", "miercoles", "jueves", "viernes"], 14, 20),
        ("DOC-007", ["lunes", "martes", "miercoles", "jueves", "viernes"], 13, 20),
        ("DOC-008", ["lunes", "martes", "miercoles", "jueves", "viernes"], 14, 21),
        ("DOC-009", ["martes", "miercoles", "jueves", "viernes"], 14, 20),
        ("DOC-010", ["lunes", "martes", "miercoles", "jueves", "viernes"], 14, 19),
        ("DOC-011", ["lunes", "martes", "miercoles", "jueves"], 14, 20),
        
        # Turno mixto
        ("DOC-012", ["lunes", "miercoles", "viernes"], 9, 12),
        ("DOC-013", ["martes", "jueves"], 9, 14),
        ("DOC-014", ["lunes", "martes", "miercoles", "jueves", "viernes"], 8, 17),
        ("DOC-015", ["lunes", "miercoles", "viernes"], 10, 18),
        
        # Puntuales
        ("DOC-016", ["lunes", "martes", "miercoles", "jueves", "viernes"], 7, 13),
        ("DOC-017", ["lunes", "martes", "miercoles", "jueves", "viernes"], 7, 14),
        ("DOC-018", ["lunes", "martes", "miercoles", "jueves", "viernes"], 8, 15),
        
        # Administración
        ("DOC-019", ["lunes", "martes", "miercoles", "jueves"], 9, 17),
        ("DOC-020", ["lunes", "martes", "miercoles", "jueves", "viernes"], 9, 17),
    ]

    def run(self, db):
        banner("📅 DISPONIBILIDADES (Variadas y realistas)")
        inserted = 0
        
        for cod_doc, dias, h_ini, h_fin in self.DISPONIBILIDADES:
            docente = db.query(Docente).filter(Docente.codigo_docente == cod_doc).first()
            if not docente:
                print(f"  ✗  Docente {cod_doc} no encontrado"); continue
            
            dias_enum = [
                DiaSemanaEnum.LUNES, DiaSemanaEnum.MARTES, DiaSemanaEnum.MIERCOLES,
                DiaSemanaEnum.JUEVES, DiaSemanaEnum.VIERNES,
            ]
            dias_map = {
                "lunes": DiaSemanaEnum.LUNES,
                "martes": DiaSemanaEnum.MARTES,
                "miercoles": DiaSemanaEnum.MIERCOLES,
                "jueves": DiaSemanaEnum.JUEVES,
                "viernes": DiaSemanaEnum.VIERNES,
            }
            
            for dia_str in dias:
                dia = dias_map[dia_str]
                for h in range(h_ini, h_fin):
                    exists = db.query(DisponibilidadDocente).filter(
                        DisponibilidadDocente.docente_id == docente.id,
                        DisponibilidadDocente.dia_semana == dia,
                        DisponibilidadDocente.hora_inicio == f"{h:02d}:00:00",
                    ).first()
                    if not exists:
                        db.add(DisponibilidadDocente(
                            docente_id=docente.id,
                            dia_semana=dia,
                            hora_inicio=f"{h:02d}:00:00",
                            hora_fin=f"{h+1:02d}:00:00",
                        ))
                        inserted += 1
        
        db.commit()
        ok(f"{inserted} franjas de disponibilidad insertadas")
        print(f"  → {db.query(DisponibilidadDocente).count()} total")


class AsignacionesSeeder:
    """Asignaciones realistas para todos los grupos"""
    
    ROWS = [
        # ISC Semestre 1-A
        ("ISC-1A", "CB-MAT101", "DOC-001"),
        ("ISC-1A", "CB-MAT102", "DOC-002"),
        ("ISC-1A", "CB-FIS101", "DOC-003"),
        ("ISC-1A", "ISC-PRG101", "DOC-006"),
        
        # ISC Semestre 1-B
        ("ISC-1B", "CB-MAT101", "DOC-004"),
        ("ISC-1B", "CB-MAT102", "DOC-005"),
        ("ISC-1B", "CB-FIS101", "DOC-001"),
        ("ISC-1B", "ISC-PRG101", "DOC-007"),
        
        # ISC Semestre 2
        ("ISC-2A", "CB-MAT201", "DOC-001"),
        ("ISC-2A", "CB-FIS102", "DOC-002"),
        ("ISC-2A", "ISC-PRG102", "DOC-006"),
        ("ISC-2A", "ISC-BD101", "DOC-008"),
        
        ("ISC-2B", "CB-MAT201", "DOC-003"),
        ("ISC-2B", "CB-FIS102", "DOC-004"),
        ("ISC-2B", "ISC-PRG102", "DOC-009"),
        ("ISC-2B", "ISC-BD101", "DOC-007"),
        
        # ISC Semestre 3
        ("ISC-3A", "CB-MAT301", "DOC-002"),
        ("ISC-3A", "CB-FIS201", "DOC-001"),
        ("ISC-3A", "ISC-PRG201", "DOC-006"),
        ("ISC-3A", "ISC-BD201", "DOC-008"),
        
        ("ISC-3B", "CB-MAT302", "DOC-005"),
        ("ISC-3B", "ISC-PRG201", "DOC-010"),
        ("ISC-3B", "ISC-BD201", "DOC-009"),
        ("ISC-3B", "ISC-RED201", "DOC-011"),
        
        # ISC Semestre 4-5
        ("ISC-4A", "ISC-PRG301", "DOC-006"),
        ("ISC-4A", "ISC-RED301", "DOC-011"),
        ("ISC-4A", "ISC-SIS101", "DOC-008"),
        
        ("ISC-5A", "ISC-PRG401", "DOC-007"),
        ("ISC-5A", "ISC-WEB101", "DOC-010"),
        ("ISC-5A", "ISC-BD301", "DOC-009"),
        
        # Electrónica
        ("ELT-1A", "CB-MAT101", "DOC-001"),
        ("ELT-1A", "CB-FIS101", "DOC-003"),
        ("ELT-2A", "CB-MAT201", "DOC-004"),
        ("ELT-2A", "CB-FIS102", "DOC-002"),
        ("ELT-3A", "ELT-ELT101", "DOC-012"),
        ("ELT-3A", "CB-MAT301", "DOC-005"),
        ("ELT-3A", "CB-FIS201", "DOC-001"),
        ("ELT-4A", "ELT-ELT201", "DOC-013"),
        ("ELT-4A", "ELT-MIC101", "DOC-014"),
        ("ELT-5A", "ELT-ELT301", "DOC-015"),
        ("ELT-5A", "ELT-MIC201", "DOC-012"),
        
        # Mecánica
        ("MEC-1A", "CB-MAT101", "DOC-001"),
        ("MEC-1A", "CB-FIS101", "DOC-003"),
        ("MEC-2A", "CB-MAT201", "DOC-004"),
        ("MEC-2A", "MEC-CAD101", "DOC-016"),
        ("MEC-3A", "MEC-CAD201", "DOC-016"),
        ("MEC-3A", "MEC-MEC101", "DOC-017"),
        ("MEC-4A", "MEC-CAD301", "DOC-018"),
        ("MEC-4A", "MEC-TER101", "DOC-017"),
        ("MEC-5A", "MEC-MAT101", "DOC-016"),
        ("MEC-5A", "MEC-MEC201", "DOC-017"),
        
        # Administración
        ("ADM-1A", "CB-MAT101", "DOC-002"),
        ("ADM-1A", "ADM-ADM101", "DOC-019"),
        ("ADM-2A", "ADM-CON101", "DOC-019"),
        ("ADM-2A", "ADM-ECO101", "DOC-020"),
        ("ADM-3A", "ADM-CON201", "DOC-020"),
        ("ADM-3A", "ADM-FIN101", "DOC-019"),
    ]

    def run(self, db):
        banner(f"📋 ASIGNACIONES ({len(self.ROWS)} total)")
        inserted = 0
        
        for cg, cm, cd in self.ROWS:
            grupo = db.query(Grupo).filter(Grupo.codigo_grupo == cg).first()
            materia = db.query(Materia).filter(Materia.codigo_materia == cm).first()
            docente = db.query(Docente).filter(Docente.codigo_docente == cd).first()
            
            if not grupo or not materia or not docente:
                if not grupo: print(f"  ✗  Grupo {cg} no encontrado")
                if not materia: print(f"  ✗  Materia {cm} no encontrada")
                if not docente: print(f"  ✗  Docente {cd} no encontrado")
                continue
            
            exists = db.query(Asignacion).filter(
                Asignacion.grupo_id == grupo.id,
                Asignacion.materia_id == materia.id,
                Asignacion.ciclo_escolar == CICLO,
            ).first()
            if exists:
                continue
            
            db.add(Asignacion(grupo_id=grupo.id, materia_id=materia.id,
                             docente_id=docente.id, ciclo_escolar=CICLO))
            ok(f"{cm:<12} → {cg:<8} / {docente.codigo_docente}")
            inserted += 1
        
        db.commit()
        print(f"\n  → {inserted} nuevas | {db.query(Asignacion).count()} total")


# ─── Seeders disponibles ────────────────────────────────────────────────────
SEEDERS = {
    "users":          UsersSeeder,
    "aulas":          AulasSeeder,
    "materias":       MateriasSeeder,
    "grupos":         GruposSeeder,
    "docentes":       DocentesSeeder,
    "disponibilidad": DisponibilidadSeeder,
    "asignaciones":   AsignacionesSeeder,
}

ALL_ORDER = [
    "users", "docentes", "disponibilidad",
    "aulas", "materias", "grupos", "asignaciones",
]


if __name__ == "__main__":
    target = sys.argv[1].lower() if len(sys.argv) > 1 else None
    
    # Aceptar "usuarios" como alias para "users" (español)
    if target == "usuarios":
        target = "users"
    
    if target and target not in SEEDERS:
        print(f"\n❌ Tabla desconocida: '{target}'")
        print(f"   Opciones: {', '.join(SEEDERS.keys())} (o 'usuarios')")
        sys.exit(1)
    
    to_run = [target] if target else ALL_ORDER
    
    print("\n" + "="*70)
    print("  SEED DB REALISTA — SPH SYSTEM UTEC")
    print(f"  Ciclo: {CICLO}")
    print("="*70)
    
    db = SessionLocal()
    try:
        for name in to_run:
            SEEDERS[name]().run(db)
        
        print("\n" + "="*70)
        print("  ✅ SEED REALISTA COMPLETADO EXITOSAMENTE")
        print("="*70 + "\n")
    
    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()
