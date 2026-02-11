"""
Script para poblar la base de datos con datos de prueba.
"""
from datetime import time
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User, RolEnum
from app.models.docente import Docente
from app.models.disponibilidad_docente import DisponibilidadDocente, DiaSemanaEnum
from app.models.materia import Materia, TipoAulaEnum
from app.models.aula import Aula
from app.models.grupo import Grupo, TurnoEnum
from app.models.asignacion import Asignacion
from app.core.security import get_password_hash


def clear_database(db: Session):
    """Limpiar todas las tablas."""
    print("🗑️  Limpiando base de datos...")
    
    # Orden importante por las foreign keys
    db.query(DisponibilidadDocente).delete()
    db.query(Asignacion).delete()
    db.query(Docente).delete()
    db.query(User).delete()
    db.query(Materia).delete()
    db.query(Aula).delete()
    db.query(Grupo).delete()
    
    db.commit()
    print("✅ Base de datos limpiada")


def seed_users(db: Session):
    """Crear usuarios de prueba."""
    print("\n👥 Creando usuarios...")
    
    users_data = [
        {
            "email": "admin@utec.edu",
            "password": "admin123",
            "nombre": "Administrador del Sistema",
            "rol": RolEnum.ADMIN
        },
        {
            "email": "coordinador@utec.edu",
            "password": "coord123",
            "nombre": "Juan Pérez García",
            "rol": RolEnum.COORDINADOR
        },
        {
            "email": "docente1@utec.edu",
            "password": "doc123",
            "nombre": "María López Hernández",
            "rol": RolEnum.DOCENTE
        },
        {
            "email": "docente2@utec.edu",
            "password": "doc123",
            "nombre": "Carlos Ramírez Torres",
            "rol": RolEnum.DOCENTE
        },
        {
            "email": "docente3@utec.edu",
            "password": "doc123",
            "nombre": "Ana Martínez Sánchez",
            "rol": RolEnum.DOCENTE
        },
        {
            "email": "estudiante@utec.edu",
            "password": "est123",
            "nombre": "Pedro González Ruiz",
            "rol": RolEnum.ESTUDIANTE
        }
    ]
    
    users = []
    for user_data in users_data:
        user = User(
            email=user_data["email"],
            password_hash=get_password_hash(user_data["password"]),
            nombre=user_data["nombre"],
            rol=user_data["rol"],
            activo=True
        )
        db.add(user)
        users.append(user)
    
    db.commit()
    print(f"✅ {len(users)} usuarios creados")
    return users


def seed_docentes(db: Session, users: list):
    """Crear docentes de prueba."""
    print("\n👨‍🏫 Creando docentes...")
    
    # Obtener usuarios con rol docente
    docente_users = [u for u in users if u.rol == RolEnum.DOCENTE]
    
    docentes_data = [
        {
            "user": docente_users[0],
            "codigo_docente": "DOC001",
            "departamento": "Ingeniería de Software",
            "horas_maximas_semana": 40
        },
        {
            "user": docente_users[1],
            "codigo_docente": "DOC002",
            "departamento": "Matemáticas",
            "horas_maximas_semana": 35
        },
        {
            "user": docente_users[2],
            "codigo_docente": "DOC003",
            "departamento": "Física",
            "horas_maximas_semana": 30
        }
    ]
    
    docentes = []
    for doc_data in docentes_data:
        docente = Docente(
            user_id=doc_data["user"].id,
            codigo_docente=doc_data["codigo_docente"],
            departamento=doc_data["departamento"],
            horas_maximas_semana=doc_data["horas_maximas_semana"],
            activo=True
        )
        db.add(docente)
        docentes.append(docente)
    
    db.commit()
    print(f"✅ {len(docentes)} docentes creados")
    return docentes


def seed_disponibilidad(db: Session, docentes: list):
    """Crear disponibilidad de docentes."""
    print("\n📅 Creando disponibilidad de docentes...")
    
    disponibilidades = []
    
    # Docente 1: Disponible lunes a viernes 7:00-15:00
    for dia in [DiaSemanaEnum.LUNES, DiaSemanaEnum.MARTES, DiaSemanaEnum.MIERCOLES, 
                DiaSemanaEnum.JUEVES, DiaSemanaEnum.VIERNES]:
        disp = DisponibilidadDocente(
            docente_id=docentes[0].id,
            dia_semana=dia,
            hora_inicio=time(7, 0),
            hora_fin=time(15, 0)
        )
        db.add(disp)
        disponibilidades.append(disp)
    
    # Docente 2: Disponible lunes, miércoles, viernes 8:00-14:00
    for dia in [DiaSemanaEnum.LUNES, DiaSemanaEnum.MIERCOLES, DiaSemanaEnum.VIERNES]:
        disp = DisponibilidadDocente(
            docente_id=docentes[1].id,
            dia_semana=dia,
            hora_inicio=time(8, 0),
            hora_fin=time(14, 0)
        )
        db.add(disp)
        disponibilidades.append(disp)
    
    # Docente 3: Disponible martes y jueves 9:00-17:00
    for dia in [DiaSemanaEnum.MARTES, DiaSemanaEnum.JUEVES]:
        disp = DisponibilidadDocente(
            docente_id=docentes[2].id,
            dia_semana=dia,
            hora_inicio=time(9, 0),
            hora_fin=time(17, 0)
        )
        db.add(disp)
        disponibilidades.append(disp)
    
    db.commit()
    print(f"✅ {len(disponibilidades)} registros de disponibilidad creados")


def seed_materias(db: Session):
    """Crear materias de prueba."""
    print("\n📚 Creando materias...")
    
    materias_data = [
        {
            "codigo_materia": "ISW101",
            "nombre": "Programación I",
            "creditos": 8,
            "horas_semana": 6,
            "requiere_laboratorio": True,
            "tipo_aula_requerida": TipoAulaEnum.COMPUTO
        },
        {
            "codigo_materia": "MAT101",
            "nombre": "Cálculo Diferencial",
            "creditos": 6,
            "horas_semana": 4,
            "requiere_laboratorio": False,
            "tipo_aula_requerida": TipoAulaEnum.NORMAL
        },
        {
            "codigo_materia": "FIS101",
            "nombre": "Física I",
            "creditos": 6,
            "horas_semana": 5,
            "requiere_laboratorio": True,
            "tipo_aula_requerida": TipoAulaEnum.LABORATORIO
        },
        {
            "codigo_materia": "ISW201",
            "nombre": "Bases de Datos",
            "creditos": 8,
            "horas_semana": 6,
            "requiere_laboratorio": True,
            "tipo_aula_requerida": TipoAulaEnum.COMPUTO
        },
        {
            "codigo_materia": "ISW301",
            "nombre": "Ingeniería de Software",
            "creditos": 6,
            "horas_semana": 4,
            "requiere_laboratorio": False,
            "tipo_aula_requerida": TipoAulaEnum.NORMAL
        }
    ]
    
    materias = []
    for mat_data in materias_data:
        materia = Materia(**mat_data, activo=True)
        db.add(materia)
        materias.append(materia)
    
    db.commit()
    print(f"✅ {len(materias)} materias creadas")
    return materias


def seed_aulas(db: Session):
    """Crear aulas de prueba."""
    print("\n🏫 Creando aulas...")
    
    aulas_data = [
        {
            "codigo_aula": "A-101",
            "nombre": "Aula 101 - Edificio A",
            "capacidad": 30,
            "tipo": TipoAulaEnum.NORMAL,
            "edificio": "A",
            "piso": 1
        },
        {
            "codigo_aula": "A-201",
            "nombre": "Aula 201 - Edificio A",
            "capacidad": 35,
            "tipo": TipoAulaEnum.NORMAL,
            "edificio": "A",
            "piso": 2
        },
        {
            "codigo_aula": "B-101",
            "nombre": "Lab Cómputo 1",
            "capacidad": 25,
            "tipo": TipoAulaEnum.COMPUTO,
            "edificio": "B",
            "piso": 1,
            "equipamiento": "25 computadoras, proyector, aire acondicionado"
        },
        {
            "codigo_aula": "B-102",
            "nombre": "Lab Cómputo 2",
            "capacidad": 30,
            "tipo": TipoAulaEnum.COMPUTO,
            "edificio": "B",
            "piso": 1,
            "equipamiento": "30 computadoras, proyector, pizarra digital"
        },
        {
            "codigo_aula": "C-101",
            "nombre": "Laboratorio de Física",
            "capacidad": 20,
            "tipo": TipoAulaEnum.LABORATORIO,
            "edificio": "C",
            "piso": 1,
            "equipamiento": "Equipos de medición, mesas de trabajo, extractor"
        }
    ]
    
    aulas = []
    for aula_data in aulas_data:
        aula = Aula(**aula_data, activo=True)
        db.add(aula)
        aulas.append(aula)
    
    db.commit()
    print(f"✅ {len(aulas)} aulas creadas")
    return aulas


def seed_grupos(db: Session):
    """Crear grupos de prueba."""
    print("\n👨‍🎓 Creando grupos...")
    
    grupos_data = [
        {
            "codigo_grupo": "ISC-1A",
            "nombre": "Ingeniería en Sistemas - 1er Semestre A",
            "carrera": "Ingeniería en Sistemas Computacionales",
            "semestre": 1,
            "turno": TurnoEnum.MATUTINO,
            "num_estudiantes": 28,
            "ciclo_escolar": "2026-1"
        },
        {
            "codigo_grupo": "ISC-3A",
            "nombre": "Ingeniería en Sistemas - 3er Semestre A",
            "carrera": "Ingeniería en Sistemas Computacionales",
            "semestre": 3,
            "turno": TurnoEnum.MATUTINO,
            "num_estudiantes": 25,
            "ciclo_escolar": "2026-1"
        },
        {
            "codigo_grupo": "ISC-5A",
            "nombre": "Ingeniería en Sistemas - 5to Semestre A",
            "carrera": "Ingeniería en Sistemas Computacionales",
            "semestre": 5,
            "turno": TurnoEnum.VESPERTINO,
            "num_estudiantes": 22,
            "ciclo_escolar": "2026-1"
        }
    ]
    
    grupos = []
    for grupo_data in grupos_data:
        grupo = Grupo(**grupo_data, activo=True)
        db.add(grupo)
        grupos.append(grupo)
    
    db.commit()
    print(f"✅ {len(grupos)} grupos creados")
    return grupos


def seed_asignaciones(db: Session, grupos: list, materias: list, docentes: list):
    """Crear asignaciones de prueba."""
    print("\n📝 Creando asignaciones...")
    
    asignaciones_data = [
        # Grupo ISC-1A
        {"grupo": grupos[0], "materia": materias[0], "docente": docentes[0]},  # Programación I
        {"grupo": grupos[0], "materia": materias[1], "docente": docentes[1]},  # Cálculo
        {"grupo": grupos[0], "materia": materias[2], "docente": docentes[2]},  # Física I
        
        # Grupo ISC-3A
        {"grupo": grupos[1], "materia": materias[3], "docente": docentes[0]},  # Bases de Datos
        
        # Grupo ISC-5A
        {"grupo": grupos[2], "materia": materias[4], "docente": docentes[0]},  # Ing. Software
    ]
    
    asignaciones = []
    for asig_data in asignaciones_data:
        asignacion = Asignacion(
            grupo_id=asig_data["grupo"].id,
            materia_id=asig_data["materia"].id,
            docente_id=asig_data["docente"].id,
            ciclo_escolar="2026-1"
        )
        db.add(asignacion)
        asignaciones.append(asignacion)
    
    db.commit()
    print(f"✅ {len(asignaciones)} asignaciones creadas")
    return asignaciones


def seed_database():
    """Función principal para poblar la base de datos."""
    print("🌱 Iniciando seed de base de datos...\n")
    
    db = SessionLocal()
    
    try:
        # Limpiar base de datos
        clear_database(db)
        
        # Crear datos en orden
        users = seed_users(db)
        docentes = seed_docentes(db, users)
        seed_disponibilidad(db, docentes)
        materias = seed_materias(db)
        aulas = seed_aulas(db)
        grupos = seed_grupos(db)
        asignaciones = seed_asignaciones(db, grupos, materias, docentes)
        
        print("\n" + "="*50)
        print("✅ Seed completado exitosamente!")
        print("="*50)
        print("\n📊 Resumen:")
        print(f"  - {len(users)} usuarios")
        print(f"  - {len(docentes)} docentes")
        print(f"  - {len(materias)} materias")
        print(f"  - {len(aulas)} aulas")
        print(f"  - {len(grupos)} grupos")
        print(f"  - {len(asignaciones)} asignaciones")
        
        print("\n🔑 Credenciales de acceso:")
        print("  Admin:        admin@utec.edu / admin123")
        print("  Coordinador:  coordinador@utec.edu / coord123")
        print("  Docente:      docente1@utec.edu / doc123")
        print("  Estudiante:   estudiante@utec.edu / est123")
        
    except Exception as e:
        print(f"\n❌ Error durante el seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
