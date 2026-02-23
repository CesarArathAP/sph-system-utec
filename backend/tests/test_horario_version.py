"""
Script de testing rápido para el sistema de versionado.

Ejecutar después de migrar la BD:
    python tests/test_horario_version.py
"""
import sys
from datetime import time

# Configurar path
sys.path.insert(0, '/path/to/backend')

from app.database import SessionLocal, engine, Base
from app.models import Horario, Asignacion, Aula, Docente, Materia, Grupo, HorarioVersion
from app.schemas.horario import HorarioCreate
from app.services import horario_service, horario_version_service

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def test_versionado_basico():
    """Test básico: crear horario → ver versión"""
    print("\n" + "="*60)
    print("TEST 1: Versionado Básico (Crear Horario)")
    print("="*60)
    
    try:
        # Crear datos de prueba (si no existen)
        docente = db.query(Docente).first()
        if not docente:
            print("⚠️  No hay docentes en BD. Saltando test.")
            return
        
        aula = db.query(Aula).first()
        if not aula:
            print("⚠️  No hay aulas en BD. Saltando test.")
            return
        
        asignacion = db.query(Asignacion).first()
        if not asignacion:
            print("⚠️  No hay asignaciones en BD. Saltando test.")
            return
        
        # Crear horario
        horario_data = HorarioCreate(
            asignacion_id=asignacion.id,
            aula_id=aula.id,
            dia_semana="lunes",
            hora_inicio=time(7, 0),
            hora_fin=time(9, 0),
            tipo_sesion="teorica"
        )
        
        horario = horario_service.create_horario(db, horario_data)
        print(f"✅ Horario creado: ID {horario.id}")
        
        # Verificar versión registrada
        versiones, total = horario_version_service.get_versiones_horario(
            db, horario.id
        )
        
        assert total == 1, f"Esperaba 1 versión, encontré {total}"
        assert versiones[0].tipo_cambio == "creacion"
        assert versiones[0].estado_anterior is None
        assert versiones[0].estado_nuevo["dia_semana"] == "lunes"
        
        print(f"✅ Versión registrada: v{versiones[0].version_numero}")
        print(f"   Tipo: {versiones[0].tipo_cambio}")
        print(f"   Descripción: {versiones[0].descripcion_cambio}")
        print("\n✨ TEST 1 PASADO")
        
        return horario.id
        
    except Exception as e:
        print(f"❌ TEST 1 FALLÓ: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_versionado_modificacion(horario_id):
    """Test: modificar horario → ver v2"""
    print("\n" + "="*60)
    print("TEST 2: Versionado de Modificación")
    print("="*60)
    
    try:
        horario = horario_service.get_horario_by_id(db, horario_id)
        print(f"📋 Horario original:")
        print(f"   Día: {horario.dia_semana.value}")
        print(f"   Hora: {horario.hora_inicio} - {horario.hora_fin}")
        print(f"   Aula: {horario.aula_id}")
        
        # Modificar
        from app.schemas.horario import HorarioUpdate
        update_data = HorarioUpdate(
            hora_inicio=time(8, 0),
            hora_fin=time(10, 0),
        )
        
        horario_actualizado = horario_service.update_horario(db, horario_id, update_data)
        print(f"\n✅ Horario actualizado:")
        print(f"   Hora: {horario_actualizado.hora_inicio} - {horario_actualizado.hora_fin}")
        
        # Verificar versiones
        versiones, total = horario_version_service.get_versiones_horario(
            db, horario_id
        )
        
        assert total == 2, f"Esperaba 2 versiones, encontré {total}"
        assert versiones[0].version_numero == 2
        assert versiones[0].tipo_cambio == "modificacion"
        
        print(f"\n✅ Versiones registradas: {total}")
        print(f"   v1: creacion")
        print(f"   v2: {versiones[0].tipo_cambio}")
        
        # Verificar cambios
        diff = horario_version_service.get_diff_entre_versiones(
            db, horario_id, 1, 2
        )
        
        print(f"\n✅ Cambios detectados:")
        for campo, valores in diff.cambios.items():
            print(f"   {campo}: {valores['antes']} → {valores['despues']}")
        
        print("\n✨ TEST 2 PASADO")
        
    except Exception as e:
        print(f"❌ TEST 2 FALLÓ: {e}")
        import traceback
        traceback.print_exc()

def test_rollback(horario_id):
    """Test: revertir a v1"""
    print("\n" + "="*60)
    print("TEST 3: Rollback a Versión Anterior")
    print("="*60)
    
    try:
        # Estado antes del rollback
        horario_antes = horario_service.get_horario_by_id(db, horario_id)
        print(f"📋 Horario antes del rollback:")
        print(f"   Hora: {horario_antes.hora_inicio} - {horario_antes.hora_fin}")
        
        # Hacer rollback a v1
        horario_revertido = horario_version_service.rollback_a_version(
            db, horario_id, version_numero=1
        )
        
        print(f"\n✅ Rollback ejecutado:")
        print(f"   Hora: {horario_revertido.hora_inicio} - {horario_revertido.hora_fin}")
        
        # Verificar que ahora tenemos 3 versiones
        versiones, total = horario_version_service.get_versiones_horario(
            db, horario_id
        )
        
        assert total == 3, f"Esperaba 3 versiones, encontré {total}"
        assert versiones[0].tipo_cambio == "rollback"
        assert versiones[0].version_numero == 3
        
        print(f"\n✅ Versiones registradas: {total}")
        print(f"   v3: rollback (nueva versión después de revertir)")
        print(f"\n✨ TEST 3 PASADO")
        
    except Exception as e:
        print(f"❌ TEST 3 FALLÓ: {e}")
        import traceback
        traceback.print_exc()

def test_snapshot():
    """Test: snapshot JSON"""
    print("\n" + "="*60)
    print("TEST 4: Snapshot JSON")
    print("="*60)
    
    try:
        horario = db.query(Horario).first()
        if not horario:
            print("⚠️  No hay horarios. Saltando test.")
            return
        
        snapshot = horario_version_service.snapshot_horario(horario)
        
        print(f"✅ Snapshot creado:")
        print(f"   id: {snapshot['id']}")
        print(f"   dia_semana: {snapshot['dia_semana']}")
        print(f"   hora_inicio: {snapshot['hora_inicio']}")
        print(f"   hora_fin: {snapshot['hora_fin']}")
        print(f"   aula_id: {snapshot['aula_id']}")
        print(f"   tipo_sesion: {snapshot['tipo_sesion']}")
        print(f"   activo: {snapshot['activo']}")
        
        assert "dia_semana" in snapshot
        assert "hora_inicio" in snapshot
        assert "hora_fin" in snapshot
        
        print("\n✨ TEST 4 PASADO")
        
    except Exception as e:
        print(f"❌ TEST 4 FALLÓ: {e}")
        import traceback
        traceback.print_exc()

def test_query_versiones():
    """Test: consultar versiones con paginación"""
    print("\n" + "="*60)
    print("TEST 5: Query de Versiones con Paginación")
    print("="*60)
    
    try:
        horario = db.query(Horario).first()
        if not horario:
            print("⚠️  No hay horarios. Saltando test.")
            return
        
        versiones, total = horario_version_service.get_versiones_horario(
            db, horario.id, skip=0, limit=10
        )
        
        print(f"✅ Versiones obtenidas:")
        print(f"   Total: {total}")
        print(f"   Mostradas: {len(versiones)}")
        
        for v in versiones:
            print(f"   v{v.version_numero}: {v.tipo_cambio} - {v.descripcion_cambio}")
        
        print("\n✨ TEST 5 PASADO")
        
    except Exception as e:
        print(f"❌ TEST 5 FALLÓ: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("\n" + "🚀 INICIANDO TESTS DE VERSIONADO".center(60, "="))
    print("Asegúrate de haber ejecutado: alembic upgrade head")
    print("="*60)
    
    # Ejecutar tests
    horario_id = test_versionado_basico()
    
    if horario_id:
        test_versionado_modificacion(horario_id)
        test_rollback(horario_id)
        test_snapshot()
        test_query_versiones()
    
    print("\n" + "✨ TODOS LOS TESTS COMPLETADOS".center(60, "="))
    print("="*60)
    
    db.close()
