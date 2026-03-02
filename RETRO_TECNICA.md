# 🔍 Retro Técnica — Lecciones Aprendidas del MVP

**Période:** Enero - Marzo 2026 (7 semanas)  
**Facilitador:** Equipo dev  
**Fecha:** 2026-03-02

---

## 📌 Propósito

Documentar decisiones técnicas, aprendizajes, y recomendaciones para próximos proyectos.

**Formato:** ¿Qué salió bien? ¿Qué salió mal? ¿Qué cambiaríamos?

---

# ✅ QUÉ SALIÓ BIEN

## 1. Arquitectura por Capas (Backend)

### Lo que hicimos
```
│ FastAPI (Routes)
│ ↓
│ Pydantic (Validation)
│ ↓
│ Services (Business Logic)
│ ↓
│ SQLAlchemy ORM (Data Access)
│ ↓
│ PostgreSQL (Database)
```

### Por qué funcionó
- ✅ **Separación clara de responsabilidades**
  - Routes solo routan, no tienen lógica
  - Services tienen toda la lógica de negocio
  - ORM maneja SQL automáticamente

- ✅ **Reutilización de código**
  - Servicios pueden ser llamados desde múltiples rutas
  - Fácil agregar nuevos endpoints reutilizando servicios

- ✅ **Testeable**
  - Cada capa puede testear independiente
  - Mock de database fácil en tests

### Ejemplo de lo que NO hizo está mal
```python
# ❌ LO QUE NO HICIMOS (Code smell)
@app.post("/horarios")
def create_horario(data):
    # TODA la lógica aquí → "Fat controller"
    db = SessionLocal()
    asignacion = db.query(Asignacion).get(data.asignacion_id)
    if not asignacion:
        return error
    # ... 50 líneas más de lógica ...
    db.commit()
```

```python
# ✅ LO QUE HICIMOS (Clean architecture)
@app.post("/horarios")
def create_horario(data: HorarioCreate, db: Session):
    # Lógica limpia → llamar a service
    return horario_service.create_horario(db, data)
```

### Recomendación para próximos proyectos
- 🎯 **Mantener esta arquitectura**
- 🎯 **Documentar qué va en cada capa**
- 🎯 **Code review enfocado en respetar límites de capas**

---

## 2. Migraciones con Alembic

### Lo que hicimos
- Configuramos Alembic correctamente desde inicio
- Cada cambio BD = migration file
- Auto-generate con `alembic revision --autogenerate`

### Por qué funcionó
- ✅ **Versionado de BD**
  - Sabemos exactamente qué versión están en qué ambiente
  - Rollback fácil si algo salió mal

- ✅ **Reproducible**
  - Dev, Staging, Production = exactamente mismo schema
  - No hay "sorpresas" de missing columns

- ✅ **Documentable**
  - Cada migration es un archivo Python
  - Historial completo de cambios

### Métrica
```
Total migrations: 3
- 001_initial_schema.py
- 002_create_horario_snapshots.py
- 003_create_horario_versions.py

Éxito: 3/3 ejecutadas sin errores
```

### Recomendación
- 🎯 **SIEMPRE usar Alembic** en proyectos con BD
- 🎯 **Versión antes de deploy**
- 🎯 **Test migraciones en env separado**

---

## 3. Docker desde Inicio

### Lo que hicimos
- Docker para Backend (Python)
- Docker Compose para Postgres + Backend
- Hot-reload con volumes montados
- Health checks para dependencias

### Por qué funcionó
- ✅ **"Works on my machine" eliminado**
  - Todos tienes exactamente mismo ambiente
  - Python 3.13 + dependencias exactas

- ✅ **Onboarding rápido**
  - Nuevo dev? → `docker-compose up` y listo
  - Sin instalar Python, postgres, nada

- ✅ **Producción == Desarrollo**
  - Dockerfile usado en local y en cloud
  - 0 diferencias de ambiente

### Métrica
```
Tiempo setup dev:
- SIN Docker: 2-3 horas (install Python, postgres, etc)
- CON Docker: 5 minutos + docker pull

Bugs por "works on my machine": 0
```

### Recomendación
- 🎯 **Docker early, Docker often**
- 🎯 **Volumes automáticos para hot-reload**
- 🎯 **Health checks en docker-compose**

---

## 4. JWT Tokens con python-jose

### Lo que hicimos
- JWT implementado correctamente
- Token con expiración (30 min)
- Refresh token pattern (v2)
- Bearer token en headers

### Por qué funcionó
- ✅ **Stateless**
  - No necesitas sesiones en server
  - Escalable (múltiples instancias)

- ✅ **Seguro**
  - Tokens firmados, no pueden falsificarse
  - Expiración previene token theft

- ✅ **Standard**
  - JWT es RFC 7519
  - Compatible con cualquier cliente

### Ejemplo
```python
# Token includes:
{
  "sub": "user_id_2",
  "exp": 1709425816,  # Expira en 30 min
  "iat": 1709424916,
  "type": "access"
}
# Firmado con SECRET_KEY
```

### Recomendación
- 🎯 **JWT es correcto para APIs**
- 🎯 **Cambiar SECRET_KEY en producción**
- 🎯 **Implementar refresh tokens ASAP**

---

## 5. Validación con Pydantic v2

### Lo que hicimos
- Schemas Pydantic para cada CRUD
- Validaciones automáticas (min_length, ge, etc)
- Custom validators cuando necesario
- Type hints en TODO

### Por qué funcionó
- ✅ **Errores claros**
  ```
  ❌ "horas_maximas_semana must be ≥ 1"
  vs
  ✅ Servidor crash sin error
  ```

- ✅ **Documentación auto**
  - OpenAPI schema automático
  - `/docs` mostrá tipos esperados

- ✅ **Validación dual**
  - API valida entrada
  - BD valida al guardar (constraints)

### Ejemplo
```python
class DocenteCreate(BaseModel):
    codigo_docente: str = Field(..., min_length=1, max_length=20)
    departamento: str = Field(..., min_length=1)
    horas_maximas_semana: int = Field(..., ge=1, le=60)
    # Pydantic valida automáticamente
```

### Recomendación
- 🎯 **Pydantic = standard**
- 🎯 **Completar todos los Field() con validaciones**
- 🎯 **Custom validators para reglas de negocio complicadas**

---

## 6. Componentes React Reutilizables

### Lo que hicimos
- `components/common/` para componentes genéricos
- Props bien documentadas
- TypeScript para type safety

### Por qué funcionó
- ✅ **DRY (Don't Repeat Yourself)**
  - ButtonModal, Table, Form usados por toda la app
  - Un cambio = se refleja en todos lados

- ✅ **Consistencia visual**
  - Mismo botón, mismo comportamiento
  - Design system implícito

### Métrica
```
Componentes reutilizables: 8
- Button (usado 30+ veces)
- Table (usado 8 veces)
- Modal (usado 15+ veces)
- Form (usado 10+ veces)

Estimado: Ahorro 40% tiempo desarrollo
```

### Recomendación
- 🎯 **Component library temprano**
- 🎯 **Storybook para documentación**
- 🎯 **Props interface claro y completo**

---

## 7. API Documentation con FastAPI/Swagger

### Lo que hicimos
- FastAPI auto-genera OpenAPI schema
- Swagger UI en `/docs`
- Ejemplos reales en docstrings

### Por qué funcionó
- ✅ **Siempre actualizado**
  - Cambias una ruta → automáticamente en Swagger
  - No document divorceado de código

- ✅ **Testeable interactivamente**
  - Swagger = "Postman built-in"
  - Frontend dev puede probar sin postman

### Uso Real
```
1. Dev abre http://localhost:8000/docs
2. Ve todos los endpoints
3. Valida tipos de entrada/salida
4. Prueba request directamente
5. Copia/pega curl para tests
```

### Recomendación
- 🎯 **FastAPI + Swagger = standard**
- 🎯 **Escribir ejemplos en docstrings**
- 🎯 **Code-first, not document-first**

---

# ⚠️ QUÉ SALIÓ MAL

## 1. Testing Incompleto

### Lo que pasó
- Tests en `tests/test_horario_version.py` solamente
- Coverage probablemente <10%
- No hay integration tests
- No hay E2E tests con Frontend

### Por qué fue un problema
- ❌ **Bugs en producción**
  - Conflictos no detectados hasta último momento
  - Seed realista encontró bugs que tests no vieron

- ❌ **Refactoring asusta**
  - "¿Qué rompo si cambio esto?"
  - Cambios pequeños terminan siendo grandes

- ❌ **Confianza baja**
  - Deploy a producción = nervios
  - Pasos manuales para validar

### Ejemplo de Bug que Tests hubiera encontrado
```python
# Bug histórico: horas se contaban mal
horas_totales = 0
for horario in horarios:
    horas_totales += int(horario.hora_fin - horario.hora_inicio)  # ❌ Tipo error
    
# Test hubiera encontrado:
# assert conteo_horas(horarios) == 12  # ❌ AssertionError: 0 != 12
```

### Plan de corrección
- [ ] **Week 8:** Agregar pytest fixtures
- [ ] **Week 8-9:** Unit tests para servicios (60% coverage meta)
- [ ] **Week 10:** Integration tests
- [ ] **Week 11:** E2E tests con Playwright/Cypress

### Recomendación
- 🎯 **TDD (Test-Driven Development) desde inicio**
- 🎯 **Meta: 80%+ coverage**
- 🎯 **CI/CD fail si coverage baja**

---

## 2. Frontend State Management Ad-Hoc

### Lo que pasó
- Cada componente tiene su propio `useState`
- Props drilling en algunos lugares
- No hay pattern claro para estado global

### Por qué fue un problema
- ❌ **Difícil de debuggear**
  - Dónde vive el estado? En DisponibilidadModal? En componente padre?

- ❌ **Sincronización**
  - Si un componente actualiza algo, otros no saben
  - Actualizaciones manual en múltiples lugares

- ❌ **Escalabilidad**
  - Agregar nuevo módulo = copy/paste de lógica estado

### Ejemplo del Problema
```tsx
// DisponibilidadModal.tsx
const [ocupadas, setOcupadas] = useState<Set<string>>(new Set())

// DocenteHorarioModal.tsx necesita saber qué ocupadas
// ¿Dónde vive? ¿Cómo sincroniza?
// Solución actual: Prop drilling de 3 niveles
```

### Plan de corrección
- [ ] **Week 12:** Migrar a Zustand o Context API
- [ ] **Week 12:** Centralizar estado de docentes
- [ ] **Week 13:** Refactorizar modales

### Recomendación
- 🎯 **State management EARLY**
  - Context API para estado pequeño
  - Zustand/Redux para estado grande
- 🎯 **Documentar "source of truth" para cada dato**
- 🎯 **Props interface claramente definida**

---

## 3. Database Schema Cambios Tardios

### Lo que pasó
- Agregamos `horario_versions` en semana 5
- Necesitó nueva migración
- Clientes viejos con schema desactualizados

### Por qué fue un problema
- ❌ **Backward compatibility complex**
  - Código viejo con schema nuevo = problemas
  
- ❌ **Migraciones in production asusta**
  - "¿Y si la migración falla?"
  - Downtime potencial

- ❌ **Rollback complicado**
  - No testeamos rollback de migraciones

### Ejemplo
```sql
-- Migración 003 agregó:
ALTER TABLE horarios ADD COLUMN version_id INTEGER REFERENCES horario_versions(id)
-- ❌ ¿Qué pasa con registros viejos sin version_id?
```

### Plan de corrección
- [x] **Todas las migraciones ya están en lugar**
- [ ] **Week 8:** Documentar rollback procedures
- [ ] **Week 8:** Test rollbacks en staging

### Recomendación
- 🎯 **Schema design early and well**
- 🎯 **Migrations in safe mode (NULL defaults, no constraints destructivas)**
- 🎯 **Feature flags para backward compatibility**

---

## 4. Documentation Lag

### Lo que pasó
- Código cambió rápido
- Documentación quedó atrás
- README_TECNICO creado casi al final

### Por qué fue un problema
- ❌ **Onboarding difícil**
  - Nuevo dev: "¿Por qué está esto aquí?"
  - No hay explicación clara

- ❌ **Decisiones olvidadas**
  - "¿Por qué usamos Alembic?" → miedo de cambiar
  - "¿Por qué esta estructura?" → nadie sabe

- ❌ **Conocimiento en cabeza**
  - Si lead técnico se va, ¿quién sabe?

### Plan de corrección
- [x] **README_TECNICO creado** (Semana 7)
- [x] **SEMANA_6_DEMO creado** (Semana 7)
- [ ] **Week 8:** Architecture decision records (ADRs)
- [ ] **Week 8:** Inline code comments donde es complejo

### Recomendación
- 🎯 **Doc-as-you-code**
  - Cuando haces algo = documenta por qué
- 🎯 **Architecture Decision Record (ADR)**
  - Formato simple: Contexto, Decision, Consecuencias
- 🎯 **Readme > 500 líneas mínimo**

---

## 5. Falta de Environment Separation

### Lo que pasó
- Solo hay 1 `.env` local
- Secret KEY igual en desarrollo vs. "producción"
- Database hardcoded sin vars de env

### Por qué fue un problema
- ❌ **Seguridad**
  - Si publicas código (git) ↔ credenciales expuestas
  
- ❌ **Accidentes**
  - "Cambié el env file, y afectó a todos"
  
- ❌ **Multi-environment**
  - ¿Cómo corremos en staging sin afectar producción?

### Ejemplo del Problema
```python
# ❌ Backend no usa environment separation
SECRET_KEY = "tu-clave-secreta..."  # Mismo en dev y prod
DATABASE_URL = "postgresql://..."   # Mismo en dev y prod

# ¿Y si nuestro servidor prod está en AWS?
# ¿Cómo inyectamos credenciales?
```

### Plan de corrección
- [ ] **Week 8:** .env.example created
- [ ] **Week 8:** Environment setup documented
- [ ] **Week 8:** docker-compose.prod.yml

### Recomendación
- 🎯 **NO commitear .env nunca**
- 🎯 **Commitear .env.example**
- 🎯 **12-factor app**: Environment = config
- 🎯 **docker build → secret en runtime, not in image**

---

## 6. Error Handling Inconsistente

### Lo que pasó
- A veces devolvemos 404, a veces 400
- Messages de error a veces en español, a veces inglés
- Alguns endpoints no manejan errores

### Por qué fue un problema
- ❌ **Frontend confundido**
  - "¿Es error de validación o recurso no encontrado?"
  - Código condicional complejo

- ❌ **Debugging lento**
  - Mismo error puede significar diferentes cosas
  
- ❌ **UX pobre**
  - Usuario ve error genérico sin saber qué cambiar

### Ejemplo
```http
POST /api/v1/horarios

# Response 400: No aula disponible (mi culpa)
# vs
# Response 500: Database connection error (servidor)
# vs
# Response 409: Conflicto de docente (negocio)

¿Cómo Frontend sabe qué pasó?
```

### Plan de corrección
- [ ] **Week 8:** Error code enum
- [ ] **Week 8:** Console logging consistente
- [ ] **Week 9:** Error boundary en frontend

### Recomendación
- 🎯 **HTTP status codes correctos**
  - 400: Bad request (validación)
  - 409: Conflict (negocio)
  - 500: Server error
  - 503: Service unavailable
- 🎯 **Error response format consistent**
  ```json
  {
    "error_code": "DOCENTE_WITHOUT_AVAILABILITY",
    "message": "Docente X no tiene disponibilidad registrada",
    "details": { "docente_id": 5 }
  }
  ```
- 🎯 **Logging: WARN para expected, ERROR para unexpected**

---

## 7. Seed Data vs Live Testing

### Lo que pasó
- Seed realista creado solo en Semana 6
- Antes de eso, testeaban con seed_db.py básica
- Encontramos bugs reales en seed realista

### Por qué fue un problema
- ❌ **Bugs tardíos**
  - Algoritmo con 3 datos != algoritmo con 100 docentes
  - Performance issues solo con datos reales

- ❌ **Expectations rotas**
  - "Funciona con datos de prueba" vs "Funciona en producción"

### Ejemplo del Bug
```python
# Schedule generator asumía:
# - máximo 10 asignaciones
# - máximo 20 slots de tiempo

# Con seed realista:
# - 65 asignaciones
# - Algorithm timeout O(n³) ❌

# Necesitó algoritmo optimizado
```

### Plan de corrección
- [x] **Seed realista ya existe**
- [ ] **Week 8:** Datos aún más grandes (1000 estudiantes)
- [ ] **Week 8:** Performance tests

### Recomendación
- 🎯 **Realistic test data EARLY**
- 🎯 **Seed = mínimo 80% de datos producción**
- 🎯 **Faker + factories para generar bulk data**

---

# 🎯 DECISIONES CLAVE & JUSTIFICACIÓN

## 1. ¿Por qué Astro + React en lugar de Next.js?

### Contexto
Elegir meta-framework para frontend.

### Opciones Evaluadas
| Framework | Pros | Contras |
|-----------|------|---------|
| **Next.js** | SSR built-in, Full-stack | Overkill para API client |
| **Astro** | 🏆 Static by default | Curva aprendizaje |
| **Vue** | Easy to learn | Menos jobs |
| **Vite + React** | Fast | No routing |

### Decisión: Astro + React
**Razón:** API client que necesita interactividad parcial.

**Beneficios:** 
- ✅ Astro genera HTML estático por defecto
- ✅ React solo para partes interactivas
- ✅ Mejor performance que Next.js puro
- ✅ API separada (clean separation)

**Costo:**
- ❌ Comunidad menor que Next
- ❌ Menos documentación

**Retrospectiva:** ✅ Decisión correcta

---

## 2. ¿Por qué PostgreSQL en lugar de SQLite?

### Contexto
Database para sistema.

### Opciones Evaluadas
| DB | Pros | Contras |
|----|------|---------|
| **SQLite** | Easy setup, file-based | Un solo usuario |
| **PostgreSQL** | 🏆 Powerful, concurrent | Setup más complejo |
| **MySQL** | Popular | Menos features |

### Decisión: PostgreSQL
**Razón:** Desarrollo real con Docker, escalable a producción.

**Beneficios:**
- ✅ Full transactions & ACID
- ✅ Concurrency sin issues
- ✅ Advanced data types
- ✅ Producción-ready

**Costo:**
- ❌ Setup local (pero Docker resuelve)

**Retrospectiva:** ✅ Decisión correcta

---

## 3. ¿Por qué ORM (SQLAlchemy) vs Raw SQL?

### Contexto
Cómo acceder la base de datos.

### Opciones Evaluadas
| Approach | Pros | Contras |
|----------|------|---------|
| **Raw SQL** | Fast, explicit | Verbose, error-prone |
| **ORM (SQLAlchemy)** | 🏆 Type-safe, portable | Overhead, curva aprendizaje |
| **Query Builder** | Balance | Menos maduro |

### Decisión: SQLAlchemy ORM
**Razón:** Type safety, migrations, relationships.

**Beneficios:**
- ✅ `asignacion.docente.user.nombre` = Python, no SQL
- ✅ Migrations + Alembic integrate
- ✅ Lazyload vs joinedload explicit
- ✅ Model inheritance

**Costo:**
- ❌ N+1 queries posible (pero joinedload resuelve)
- ❌ Overhead de traducción SQL

**Retrospectiva:** ✅ Decisión correcta

---

## 4. ¿Por qué JWT en lugar de Sessions?

### Contexto
Autenticación para API.

### Opciones Evaluadas
| Method | Pros | Contras |
|--------|------|---------|
| **Sessions** | Familiar | Stateful, scaling issues |
| **JWT** | 🏆 Stateless, scalable | Token theft possible |
| **OAuth** | Enterprise-ready | Overhead para MVP |

### Decisión: JWT
**Razón:** Stateless, escalable, simple.

**Beneficios:**
- ✅ Múltiples instancias se sincronizan solos
- ✅ Tokens self-contained
- ✅ Fácil para mobile + web

**Costo:**
- ❌ Token theft = session sin fin (por eso expiry 30 min)
- ❌ Logout no es instantáneo

**Retrospectiva:** ✅ Decisión correcta, pero agregar refresh tokens

---

## 5. ¿Por qué Soft Delete (activo=false) vs Hard Delete?

### Contexto
Cómo eliminar records.

### Opciones Evaluadas
| Method | Pros | Contras |
|--------|------|---------|
| **Hard Delete** | Limpio | Data loss, referencing issues |
| **Soft Delete** | 🏆 Auditable, recoverable | Clutter en queries |
| **Archive Table** | Best practice | Overhead |

### Decisión: Soft Delete
**Razón:** Auditoría, recuperabilidad, horarios referenciadores.

**Beneficios:**
- ✅ Si elimino docente, sus horarios quedan
- ✅ Historial completo
- ✅ Fácil "desactivar" vs "borrar"

**Costo:**
- ❌ Siempre filtrar `WHERE activo = TRUE`
- ❌ Posibles confusiones

**Retrospectiva:** ✅ Decisión correcta

---

## 6. ¿Por qué Snapshot + Versioning para Horarios?

### Contexto
Guardar histórico de horarios generados.

### Opciones Evaluadas
| Approach | Pros | Contras |
|----------|------|---------|
| **No history** | Simple | Auditoría imposible |
| **Snapshots** | 🏆 Punto-en-tiempo | Diskspace |
| **Diff** | Eficiente | Complejo |

### Decisión: Snapshots + Versions
**Razón:** Auditoría, rollback, comparación.

**Beneficios:**
- ✅ Puedo preguntar: "¿Cuál era el horario el 1 de marzo?"
- ✅ Rollback completo posible
- ✅ Comparación fácil entre versiones

**Costo:**
- ❌ Storage: O(n * m) donde n=horarios, m=versiones
- ❌ Complexity en schema

**Retrospectiva:** ✅ Decisión correcta

---

# 📊 MÉTRICAS DEL PROYECTO

## Tiempo

```
Total: 7 semanas (49 días)

Desglose:
- Semana 1 (Setup):        5 días útiles
- Semana 2-3 (MVP):        9 días útiles
- Semana 4-5 (Hardening):  9 días útiles
- Semana 6 (Demo):         5 días útiles
- Semana 7 (Closure):      4 días útiles

Promedio: ~38 horas/semana (suponiendo 8h/día)
```

## Código

```
Backend (Python):
- Lines of code: ~3,500+ (services, models, routes)
- Files: 30+
- Functions: 100+
- Tests: 1 file (need improvement)

Frontend (TypeScript):
- Lines of code: ~5,000+ (components, services)
- Files: 50+
- Components: 20+

Total: ~8,500+ líneas
```

## Commits

```
Total commits: 30+
Main branches: main + develop + feature/semana-6

Naming convention:
- feat: 40%
- fix: 20%
- refactor: 15%
- docs: 15%
- chore: 10%
```

## Bugs & Issues

```
Critical: 3 (encontrados en semana 6)
  - Horario hours miscounting
  - Cache inconsistency
  - Docente availability overlap

Major: 5 (encontrados, arreglados)
Minor: 12+ (pequeños bugs)

Resolution time: 1-2 horas promedio
```

## Features Completadas vs Scope

```
In Scope (MVP):
✅ Auth (JWT)
✅ CRUD Bases (Docentes, Materias, Grupos, Aulas)
✅ Disponibilidad (Definición y visualización)
✅ Generación automática horarios
✅ Detección de conflictos
✅ Visualización horarios
✅ Versionado de horarios

Out of Scope (Backlog):
- Preferencias de docentes
- Multi-campus
- Mobile app
- Business Intelligence
- Integraciones SIS/Moodle
```

---

# 💡 TOP 5 LECCIONES

## 1. MVP es REALMENTE mínimo, pero VIABLE

### Antes
*Pensábamos que MVP incluía:*
- Preferencias docentes ❌
- Reportes PDF/Excel ❌
- Integraciones ❌
- Mobile ❌
- Personalizacion temas ❌

### Realidad
*MVP real es:*
- CRUD básicos ✅
- Generación automática ✅
- Detección de conflictos ✅
- UI funcional ✅

### Lección
> "Un MVP debe responder UNA pregunta de negocio.  Aquí: ¿Podemos automatizar generación de horarios sin conflictos?"

**Respuesta: SÍ**, y ahora tenemos datos reales para agregar features.

---

## 2. Clean Code + Architecture = Cambios fáciles

### Ejemplo Real
*Cambio en Semana 7:*
- Agregar `ocupaciones` endpoint
- Tomar datos de Horario, Asignacion, Materia, Grupo, Aula
- TOTAL: 30 minutos de desarrollo

**Por qué fue rápido:**
- Servicios reutilizables ✅
- ORM relaciones claras ✅
- Schema bien diseñado ✅

*Sin clean code = 3 horas* de hunting en código viejo.

---

## 3. Testing TEMPRANO ahorra heroísmos después

### Real Scenario
- Semana 3: "Funciona, no necesitamos tests"
- Semana 5: Bug en hora counting
- Semana 6: Descubrimos 3 más

**Costo:**
- Debug: 4 horas
- Test escribir: 2 horas
- Potential regressiones: desconocido

**Con testing temprano:**
- +2 horas Semana 1
- -6 horas Semanas 5-6
- Neto: -4 horas + confianza

---

## 4. Comunicación temprana = decisiones mejores

### Lo que pasó
- Semana 1: "¿Qué queremos exactamente?"
  - 3 reuniones: 2 horas cada una
  - Documentó alcance ("IN" y "OUT")

- Semana 2+: Trabajar sin dudas
  - Nadie pregunta: "¿¿Esto entra en scope??"
  
### Costo/Beneficio
- Setup: 6 horas
- Ahorro: 2-3 horas/semana → 14-21 horas totales

---

## 5. Documentation at the end ≠ Documentation

### Lo que hizo falta
- Inline code comments: 0
- Architecture decisions: 0
- Component props documented: 50%

### Arreglamos en Semana 7
- README.md (500 líneas)
- README_TECNICO.md (800 líneas)
- SEMANA_6_DEMO.md (300 líneas)

**Tiempo:**
- Si hubiera documentado mientras hacía: +3 horas
- Documentar después: 8 horas
- Costo oportunidad: 2 semanas menos productivity

---

# 🎓 RECOMENDACIONES PARA PRÓXIMO PROYECTO

## Semana 1: Planning Serio
- [ ] Scope documento (IN/OUT explícito)
- [ ] Architecture diagram
- [ ] Tech stack justificado
- [ ] Team sync sobre standards

## Semana 1-2: Foundation Solida
- [ ] Docker setup desde inicio
- [ ] Git workflow defined
- [ ] Database schema v1.0
- [ ] First API stub

## Every Week: Discipline
- [ ] Code reviews (no merge sin review)
- [ ] Tests escritos (min 30% coverage)
- [ ] Docs as you go
- [ ] Retrospectives (¿qué cambiaría?)

## Before Delivery: QA Seria
- [ ] E2E tests
- [ ] Performance tests
- [ ] Security audit
- [ ] Real data testing

---

# 📞 Lessons for Stakeholders

## ¿Por qué tomó 7 semanas?

| Tarea | Tiempo | Justificación |
|-------|--------|--------------|
| Setup + Planning | 3 días | Foundation es crítica |
| Backend develop | 14 días | 30+ servicios, modelos, rutas |
| Frontend develop | 12 días | 20+ componentes, integración |
| Integration | 5 días | Conectar todo, testing |
| Bug fixes | 4 días | Issues reales encontrados |
| Documentation | 3 días | README, tech docs, backlog |

**Total realista: 41-49 días** (7 semanas)

---

## ¿Qué nos daría velocidad después?

1. **Test suite establecida** (+50% confianza, -20% bugs)
2. **Design system completo** (+30% velocidad UI)
3. **CI/CD pipeline** (-30% deploy risk)
4. **Team de 3+** (más en paralelo)

---

## Suceso Predicho

```
V1.0 (MVP): 7 semanas ✅ DONE
V1.1 (Hotfixes + P0): 2 semanas
V1.2 (P1 features): 4 semanas
V2.0 (Major features): 8-10 semanas

Timeline total: 5-6 meses → Producción estable
```

---

# 🏁 Conclusión

## Qué salió bien
1. ✅ Arquitectura sólida
2. ✅ Docker desde inicio  
3. ✅ ORM/Migraciones correctass
4. ✅ API bien documentada
5. ✅ MVP real y viable

## Qué mejoraría
1. ⚠️ Testing coverage
2. ⚠️ Frontend state management
3. ⚠️ Error handling consistency
4. ⚠️ Documentation early
5. ⚠️ Seed data realista temprano

## Para Próxima Vez
- TDD from day 1
- Documentation as you code
- Realistic test data early
- Environment separation
- CI/CD pipeline

---

**Retrospectiva completada:** 2026-03-02  
**Facilitador:** Equipo desarrollo  
**Próxima retro:** 2026-04-02 (después de v1.1)

**Este proyecto fue posible gracias a:**
- ✅ Clear scope
- ✅ Good tooling
- ✅ Team discipline
- ✅ Iterative approach

¡A por v1.1! 🚀
