# 📘 SPH System UTEC — Documentación Técnica Completa

**Versión:** 1.0  
**Fecha:** Marzo 2, 2026  
**Estado:** ✅ MVP Semana 6 - Demo Funcional (85-90%)

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [Base de Datos](#base-de-datos)
7. [Docker & Despliegue](#docker--despliegue)
8. [Guía de Desarrollo](#guía-de-desarrollo)
9. [Documentación de APIs](#documentación-de-apis)
10. [Testing y Validación](#testing-y-validación)

---

# 🏗️ Arquitectura General

## Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Navegador)                     │
│                                                              │
│  Frontend: Astro + React + TypeScript + Tailwind CSS       │
│  URL: http://localhost:4321                                │
└────────────────────┬────────────────────────────────────────┘
                     │ (HTTP/REST)
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    GATEWAY API                              │
│                                                              │
│  FastAPI (Python) - JWT Auth - CORS                        │
│  URL: http://localhost:8000                                │
│  Docs: http://localhost:8000/docs (Swagger)               │
└────────────────────┬────────────────────────────────────────┘
                     │ (SQLAlchemy ORM)
                     │
┌────────────────────▼────────────────────────────────────────┐
│               BASE DE DATOS RELACIONAL                      │
│                                                              │
│  PostgreSQL 16 (Docker)                                    │
│  Host: localhost:5432                                      │
│  DB: sph_system                                            │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de Datos Principal

```
Usuario → Frontend (UI) → Backend API → Database
                ↓              ↓            ↓
            React            FastAPI    PostgreSQL
          Components,        Services,  Tables,
          State              Models,    Schemas
                            Middleware
```

---

# 💻 Stack Tecnológico

## Frontend

| Componente | Versión | Propósito |
|-----------|---------|-----------|
| **Astro** | Latest | Meta-framework, SSR + Static |
| **React** | 18+ | UI Components, State Management |
| **TypeScript** | 5.0+ | Type Safety |
| **Tailwind CSS** | 3.0+ | Utility-first styling |
| **Radix UI** | Latest | Accessible components (Dialog, etc) |
| **Lucide React** | Latest | Icon library |

## Backend

| Componente | Versión | Propósito |
|-----------|---------|-----------|
| **Python** | 3.13 | Lenguaje base |
| **FastAPI** | 0.95+ | Framework web moderno |
| **SQLAlchemy** | 2.0+ | ORM |
| **Alembic** | 1.12+ | Migraciones BD |
| **Pydantic** | 2.0+ | Validación de datos |
| **python-jose** | 3.3+ | JWT tokens |
| **bcrypt** | 4.0+ | Hashing de contraseñas |

## Base de Datos

| Componente | Versión | Propósito |
|-----------|---------|-----------|
| **PostgreSQL** | 16-alpine | Database principal |
| **SQL** | - | Queries |

## DevOps

| Componente | Propósito |
|-----------|-----------|
| **Docker** | Containerización |
| **Docker Compose** | Orquestación multi-servicio |
| **Git** | Control de versiones |

---

# 📁 Estructura de Carpetas

```
sph-system-utec/
├── docker-compose.yml          # Orquestación de servicios
├── README.md                   # README principal
├── README_TECNICO.md           # Este archivo
├── SEMANA_6_DEMO.md            # Guía de demo Semana 6
│
├── backend/                    # API FastAPI (Python)
│   ├── app/
│   │   ├── main.py                      # Punto entrada FastAPI
│   │   ├── config.py                    # Configuración
│   │   ├── database.py                  # Conexión BD
│   │   ├── dependencies.py              # Inyección de dependencias
│   │   ├── __init__.py
│   │   │
│   │   ├── api/
│   │   │   ├── dependencies.py          # Auth, get_db
│   │   │   ├── routes/
│   │   │   │   ├── auth.py              # POST /auth/login, /register
│   │   │   │   ├── docentes.py          # GET/POST /docentes
│   │   │   │   ├── materias.py          # GET/POST /materias
│   │   │   │   ├── grupos.py            # GET/POST /grupos
│   │   │   │   ├── aulas.py             # GET/POST /aulas
│   │   │   │   ├── asignaciones.py      # GET/POST /asignaciones
│   │   │   │   ├── horarios.py          # GET/POST /horarios
│   │   │   │   ├── schedule.py          # POST /schedule/generate
│   │   │   │   ├── horario_versiones.py # GET /horario_versiones
│   │   │   │   └── users.py             # GET/POST /users
│   │   │
│   │   ├── core/
│   │   │   ├── security.py              # JWT, password hashing
│   │   │   ├── exceptions.py            # Custom exceptions
│   │   │   └── __init__.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                  # ORM: User
│   │   │   ├── docente.py               # ORM: Docente
│   │   │   ├── materia.py               # ORM: Materia
│   │   │   ├── grupo.py                 # ORM: Grupo
│   │   │   ├── aula.py                  # ORM: Aula
│   │   │   ├── asignacion.py            # ORM: Asignacion
│   │   │   ├── disponibilidad_docente.py # ORM: DisponibilidadDocente
│   │   │   ├── horario.py               # ORM: Horario
│   │   │   ├── horario_snapshot.py      # ORM: HorarioSnapshot
│   │   │   ├── horario_version.py       # ORM: HorarioVersion
│   │   │   └── conflicto.py             # ORM: Conflicto
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                  # Pydantic: UserCreate, UserResponse
│   │   │   ├── docente.py               # Pydantic: DocenteCreate, etc
│   │   │   ├── materia.py
│   │   │   ├── grupo.py
│   │   │   ├── aula.py
│   │   │   ├── asignacion.py
│   │   │   ├── horario.py
│   │   │   ├── conflicto.py
│   │   │   └── horario_version.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py          # Lógica de autenticación
│   │   │   ├── docente_service.py       # CRUD docentes, disponibilidad
│   │   │   ├── materia_service.py       # CRUD materias
│   │   │   ├── grupo_service.py         # CRUD grupos
│   │   │   ├── aula_service.py          # CRUD aulas
│   │   │   ├── asignacion_service.py    # CRUD asignaciones
│   │   │   ├── horario_service.py       # CRUD horarios, validaciones
│   │   │   ├── schedule_generator.py    # Generación automática
│   │   │   ├── snapshot_service.py      # Versioning de horarios
│   │   │   └── horario_version_service.py
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── (funciones auxiliares)
│   │
│   ├── alembic/
│   │   ├── env.py                       # Configuración migraciones
│   │   ├── script.py.mako               # Template de migraciones
│   │   └── versions/
│   │       ├── 16238af16232_create_initial_database_schema.py
│   │       ├── 001_create_horario_snapshots.py
│   │       └── horario_versions_001_create_horario_versiones_table.py
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_horario_version.py
│   │
│   ├── requirements.txt         # Dependencias Python
│   ├── alembic.ini              # Config Alembic
│   ├── Dockerfile               # Imagen Docker backend
│   ├── setup.bat                # Setup script Windows
│   ├── start.bat                # Start script Windows
│   ├── 
│   ├── seed_db.py               # Seed inicial (básico)
│   ├── seed_db_realista.py      # Seed realista (Semana 6)
│   ├── demo.py                  # Demo automática (Semana 6)
│   ├── clean_db.py              # Limpiar BD
│   ├── diagnostico_horas.py     # Diagnóstico de horas
│   ├── regen_horarios.py        # Regenerar horarios
│   └── README.md
│
└── frontend/                    # Astro + React
    ├── src/
    │   ├── layouts/
    │   │   └── BaseLayout.astro     # Layout principal
    │   │
    │   ├── pages/
    │   │   ├── index.astro          # Home
    │   │   ├── register.astro       # Registro
    │   │   ├── auth/
    │   │   │   ├── login.astro      # Login
    │   │   │   ├── logout.astro     # Logout
    │   │   │   └── callback.astro
    │   │   └── [módulos]/           # Páginas de módulos
    │   │       ├── docentes.astro
    │   │       ├── materias.astro
    │   │       ├── grupos.astro
    │   │       ├── aulas.astro
    │   │       ├── asignaciones.astro
    │   │       ├── horarios.astro
    │   │       └── disponibilidad.astro
    │   │
    │   ├── components/
    │   │   ├── index.ts             # Exports centralizados
    │   │   │
    │   │   ├── Auth/
    │   │   │   ├── AuthCard.tsx      # Card de login/registro
    │   │   │   ├── AuthGuard.tsx     # Protección de rutas
    │   │   │   ├── AuthLayout.tsx    # Layout auth
    │   │   │   └── LoginForm.tsx
    │   │   │
    │   │   ├── layout/
    │   │   │   ├── Header.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   └── Footer.tsx
    │   │   │
    │   │   ├── common/
    │   │   │   ├── Button.tsx
    │   │   │   ├── Table.tsx
    │   │   │   ├── Modal.tsx
    │   │   │   └── (componentes reutilizables)
    │   │   │
    │   │   └── modules/
    │   │       ├── Docentes/
    │   │       │   ├── DocenteList.tsx
    │   │       │   ├── DocenteForm.tsx
    │   │       │   ├── DocenteHorarioModal.tsx
    │   │       │   └── DisponibilidadModal.tsx
    │   │       │
    │   │       ├── Materias/
    │   │       │   ├── MateriaList.tsx
    │   │       │   └── MateriaForm.tsx
    │   │       │
    │   │       ├── Grupos/
    │   │       │   ├── GrupoList.tsx
    │   │       │   └── GrupoForm.tsx
    │   │       │
    │   │       ├── Horarios/
    │   │       │   ├── HorarioList.tsx
    │   │       │   ├── HorarioForm.tsx
    │   │       │   └── ConflictViewer.tsx
    │   │       │
    │   │       └── (más módulos)
    │   │
    │   ├── services/
    │   │   ├── index.ts
    │   │   ├── config.ts              # API_CONFIG, BASE_URL
    │   │   ├── authService.ts
    │   │   ├── docenteService.ts      # GET/POST /docentes
    │   │   ├── materiaService.ts      # GET/POST /materias
    │   │   ├── grupoService.ts        # GET/POST /grupos
    │   │   ├── aulasService.ts        # GET/POST /aulas
    │   │   ├── asignacionService.ts   # GET/POST /asignaciones
    │   │   ├── horarioService.ts      # GET/POST /horarios
    │   │   └── scheduleService.ts     # POST /schedule/generate
    │   │
    │   ├── types/
    │   │   └── index.ts               # TypeScript interfaces
    │   │
    │   ├── assets/
    │   │   └── images/
    │   │
    │   ├── env.d.ts                   # Astro types
    │   └── app.css                    # Estilos globales
    │
    ├── public/                        # Assets estáticos
    ├── package.json
    ├── tsconfig.json
    ├── astro.config.mjs
    ├── README.md
    └── (más config)
```

---

# 🔌 Backend

## Arquitectura Backend

```
Rutas HTTP (API)
        ↓
Middleware (Auth, CORS)
        ↓
Validación Pydantic (Schemas)
        ↓
Lógica de Negocio (Services)
        ↓
Acceso a Datos (Models/ORM)
        ↓
Base de Datos (PostgreSQL)
```

## Tecnologías Principales

### FastAPI
- Framework web asincrónico moderno
- Auto-documentación (Swagger en `/docs`)
- Validación automática de tipos
- CORS configurado para desarrollo

### SQLAlchemy 2.0
- ORM declarativo
- Lazy loading y eager loading (joinedload)
- Transacciones atómicas
- Relaciones entre modelos

### Pydantic 2.0
- Validación de datos en runtime
- Serialización/deserialización JSON
- Type hints completos
- Error messages claros

### Security
- **JWT:** Tokens seguros con expiración
- **Bcrypt:** Hashing compatible
- **CORS:** Control de origen

## Endpoints Principales

### Autenticación

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "coordinador@utec.edu.mx",
  "password": "coord123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "email": "coordinador@utec.edu.mx",
    "nombre": "Laura",
    "apellido": "Vázquez",
    "rol": "coordinador",
    "activo": true
  }
}
```

### Docentes

```http
# Listar docentes
GET /api/v1/docentes?page=1&page_size=10

# Crear docente
POST /api/v1/docentes
Content-Type: application/json
Authorization: Bearer {token}

{
  "codigo_docente": "DOC-999",
  "departamento": "Ciencias Básicas",
  "horas_maximas_semana": 40
}

# Obtener docente específico
GET /api/v1/docentes/{docente_id}

# Obtener ocupaciones de docente
GET /api/v1/docentes/{docente_id}/ocupaciones
```

### Materias

```http
GET /api/v1/materias
POST /api/v1/materias
GET /api/v1/materias/{materia_id}
PUT /api/v1/materias/{materia_id}
DELETE /api/v1/materias/{materia_id}
```

### Horarios

```http
# Listar horarios
GET /api/v1/horarios?page=1&page_size=10&dia_semana=lunes

# Crear horario
POST /api/v1/horarios
Content-Type: application/json

{
  "asignacion_id": 1,
  "aula_id": 5,
  "dia_semana": "lunes",
  "hora_inicio": "07:00:00",
  "hora_fin": "09:00:00",
  "tipo_sesion": "teorica"
}

# Generar horarios automáticamente
POST /api/v1/schedule/generate
Content-Type: application/json

{
  "ciclo_escolar": "2026-1"
}
```

## Servicios Backend

### `auth_service.py`
- Generación y validación de JWT
- Hashing de contraseñas
- Login y creación de usuarios

### `docente_service.py`
- CRUD docentes
- Validaciones de disponibilidad
- Cálculo de ocupaciones
- Conteo de horas

### `schedule_generator.py`
- Generación automática de horarios
- Resolución de conflictos
- Validación de disponibilidades
- Conteo de horas máximas semanales
- Búsqueda de aulas disponibles
- Diagnósticos pre-generación

### `horario_service.py`
- CRUD horarios
- Validación de conflictos
- Detección de solapamientos

### `snapshot_service.py`
- Versionado de horarios
- Backup automático
- Rollback de cambios

---

# 🎨 Frontend

## Arquitectura Frontend

```
Astro (Meta-framework SSR)
    ↓ (integración con)
React (Components)
    ↓ (estilizado con)
Tailwind CSS + Radix UI
    ↓ (datos desde)
Services (API Calls)
    ↓ (consultando)
SPA State Management (useState)
```

## Tecnologías

### Astro
- SSR por defecto
- Compilación estática para performance
- Integración nativa de React
- Auto-routing con carpeta `/pages`

### React + TypeScript
- Componentes funcionales con hooks
- State management local con `useState`
- Type safety completo
- Reutilización de componentes

### Tailwind CSS
- Utility-first CSS
- Dark mode ready
- Responsive (mobile-first)
- Customizable

### Radix UI
- Componentes accesibles (WCAG)
- Dialog, Popover, Tabs, etc
- Sin estilos por defecto (se customiza con Tailwind)

## Flujo de Datos

```
Usuario Interactúa
    ↓
React Component (useState)
    ↓
Service (API Call: fetch)
    ↓
Backend API
    ↓
Response JSON
    ↓
Component State Update
    ↓
Re-render (React)
    ↓
UI Actualizada
```

## Componentes Principales

### `DisponibilidadModal.tsx`
- Visualiza disponibilidades de docentes
- Muestra slots disponibles vs ocupados
- Código de colores: azul (disponible), amarillo (ocupado)
- Tooltip con detalles de ocupación
- Grid organizado por día de semana

**Props:**
```typescript
interface DisponibilidadModalProps {
  isOpen: boolean
  docente: Docente
  onClose: () => void
}
```

**State:**
- `selected: Set<string>` - slots seleccionados
- `ocupadas: Set<string>` - slots ocupados
- `ocupacionesData: Ocupacion[]` - datos de ocupaciones
- `horarios: Horario[]` - horarios del docente

### `DocenteHorarioModal.tsx`
- Perfil de docente con información general
- Botón para ver disponibilidad y sesiones
- Integración con `DisponibilidadModal`

### `AuthGuard.tsx`
- Protección de rutas
- Redirección a login si no autenticado
- Verificación de token JWT

### `Table.tsx`
- Tabla reutilizable con paginación
- Búsqueda y filtrado
- Sorting columnnas

## Servicios Frontend

### `authService.ts`
```typescript
login(email: string, password: string): Promise<LoginResponse>
register(data: RegisterData): Promise<User>
logout(): void
getCurrentUser(): User | null
getToken(): string | null
```

### `docenteService.ts`
```typescript
getDocentes(page?: number): Promise<DocentesResponse>
getDocenteById(id: number): Promise<Docente>
createDocente(data: DocenteCreate): Promise<Docente>
updateDocente(id: number, data: DocenteUpdate): Promise<Docente>
deleteDocente(id: number): Promise<void>
getOcupacionesDocente(docenteId: number): Promise<Ocupacion[]>
```

### `config.ts`
```typescript
const API_BASE_URL = 'http://localhost:8000/api/v1'

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
    },
    DOCENTES: '/docentes',
    HORARIOS: '/horarios',
    // ... más
  },
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
}
```

---

# 🗄️ Base de Datos

## Tablas Principales

### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(128) NOT NULL,
  apellido VARCHAR(128) NOT NULL,
  rol ENUM ('admin', 'coordinador', 'docente') NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### `docentes`
```sql
CREATE TABLE docentes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  codigo_docente VARCHAR(20) UNIQUE NOT NULL,
  departamento VARCHAR(128) NOT NULL,
  horas_maximas_semana INTEGER DEFAULT 40,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### `disponibilidad_docente`
```sql
CREATE TABLE disponibilidad_docente (
  id SERIAL PRIMARY KEY,
  docente_id INTEGER NOT NULL REFERENCES docentes(id),
  dia_semana ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(docente_id, dia_semana, hora_inicio)
)
```

### `materias`
```sql
CREATE TABLE materias (
  id SERIAL PRIMARY KEY,
  codigo_materia VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  creditos INTEGER NOT NULL,
  horas_semana INTEGER NOT NULL,
  tipo_aula_requerida ENUM ('aula', 'laboratorio', 'computo'),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### `grupos`
```sql
CREATE TABLE grupos (
  id SERIAL PRIMARY KEY,
  codigo_grupo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(128) NOT NULL,
  carrera VARCHAR(255) NOT NULL,
  semestre INTEGER NOT NULL,
  turno VARCHAR(20) NOT NULL,
  num_estudiantes INTEGER NOT NULL,
  ciclo_escolar VARCHAR(10) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### `aulas`
```sql
CREATE TABLE aulas (
  id SERIAL PRIMARY KEY,
  codigo_aula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(128) NOT NULL,
  capacidad INTEGER NOT NULL,
  tipo ENUM ('aula', 'laboratorio', 'computo') NOT NULL,
  edificio VARCHAR(10),
  piso INTEGER,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### `asignaciones`
```sql
CREATE TABLE asignaciones (
  id SERIAL PRIMARY KEY,
  grupo_id INTEGER NOT NULL REFERENCES grupos(id),
  materia_id INTEGER NOT NULL REFERENCES materias(id),
  docente_id INTEGER NOT NULL REFERENCES docentes(id),
  ciclo_escolar VARCHAR(10) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grupo_id, materia_id, ciclo_escolar)
)
```

### `horarios`
```sql
CREATE TABLE horarios (
  id SERIAL PRIMARY KEY,
  asignacion_id INTEGER NOT NULL REFERENCES asignaciones(id),
  aula_id INTEGER NOT NULL REFERENCES aulas(id),
  dia_semana ENUM ('lunes', 'martes', ...),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  tipo_sesion ENUM ('teorica', 'practica', 'laboratorio'),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### `conflictos`
```sql
CREATE TABLE conflictos (
  id SERIAL PRIMARY KEY,
  tipo_conflicto VARCHAR(50) NOT NULL,
  descripcion TEXT,
  horario_id INTEGER REFERENCES horarios(id),
  activo BOOLEAN DEFAULT TRUE,
  resuelto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Relaciones

```
users (1) ──────────── (1) docentes
users (1) ──────────── (n) horario_versions

docentes (1) ──────────── (n) disponibilidad_docente
docentes (1) ──────────── (n) asignaciones

grupos (1) ──────────── (n) asignaciones
materias (1) ──────────── (n) asignaciones
aulas (1) ──────────── (n) horarios

asignaciones (1) ──────────── (n) horarios

horarios (1) ──────────── (n) conflictos
```

---

# 🐳 Docker & Despliegue

## Docker Compose

### Servicios Disponibles

```yaml
services:
  db:                      # PostgreSQL 16
    port: 5432
    user: sph_user
    password: sph_password
    database: sph_system

  backend:                 # FastAPI
    port: 8000
    build: ./backend
    ambiente: DATABASE_URL=postgresql://...
    volumes: ./backend:/app (hot-reload)
    depends_on: db (con health check)

  frontend:               # Astro (si se agrega)
    port: 4321
    build: ./frontend
```

## Comandos Docker

```bash
# Levantar todos los servicios
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs backend
docker-compose logs -f db

# Acceder a un contenedor
docker exec -it sph-backend /bin/bash
docker exec -it sph-postgres psql -U sph_user -d sph_system

# Detener todo
docker-compose down

# Limpiar volúmenes (resetear BD)
docker-compose down -v
```

## Variables de Entorno (docker-compose.yml)

```yaml
DATABASE_URL: postgresql://sph_user:sph_password@db:5432/sph_system
PROJECT_NAME: "Sistema de Planificación de Horarios"
VERSION: "1.0.0"
API_V1_STR: "/api/v1"
SECRET_KEY: "tu-clave-secreta..." (CAMBIAR EN PROD)
ALGORITHM: "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: "30"
BACKEND_CORS_ORIGINS: '["http://localhost:3000","http://localhost:4321"]'
```

---

# 🛠️ Guía de Desarrollo

## Setup Local

### 1. Clonar Repositorio
```bash
git clone <repo-url>
cd sph-system-utec
```

### 2. Levantars Backend

```bash
# Crear venv (opcional pero recomendado)
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate.bat  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones (si no usa Docker)
python -m alembic upgrade head

# Poblar datos de prueba
python seed_db_realista.py

# Iniciar servidor
uvicorn app.main:app --reload
```

### 3. Levantar Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Acceder a la Aplicación

```
Frontend:     http://localhost:4321
Backend API:  http://localhost:8000
API Docs:     http://localhost:8000/docs
```

## Workflow de Desarrollo

```bash
# 1. Crear rama feature
git checkout -b feat/nombre-feature

# 2. Hacer cambios
# ... editar archivos ...

# 3. Testear localmente
python demo.py  # Demo automática

# 4. Commit
git add .
git commit -m "feat: descripción en español"

# 5. Push
git push origin feat/nombre-feature

# 6. Pull Request
# Crear PR desde GitHub hacia 'develop'

# 7. Merge después de review
git checkout develop
git merge feat/nombre-feature
```

## Scripts Útiles

### Backend

```bash
# Población inicial
python seed_db.py

# Población realista (Semana 6)
python seed_db_realista.py

# Demo automática
python demo.py

# Limpiar BD
python clean_db.py

# Diagnostico de horas
python diagnostico_horas.py

# Regenerar horarios
python regen_horarios.py

# Testing
pytest tests/
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview

# Linting
npm run lint
```

---

# 📚 Documentación de APIs

## Autenticación

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "coordinador@utec.edu.mx",
  "password": "coord123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "email": "coordinador@utec.edu.mx",
    "nombre": "Laura",
    "apellido": "Vázquez",
    "rol": "coordinador",
    "activo": true
  }
}
```

### Headers Requeridos para Endpoints Protegidos

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

## Docentes

### Listar Docentes
```http
GET /api/v1/docentes?page=1&page_size=10
```

**Query Params:**
- `page` (int, default 1)
- `page_size` (int, default 10, max 100)

### Crear Docente
```http
POST /api/v1/docentes
Authorization: Bearer {token}

{
  "codigo_docente": "DOC-025",
  "departamento": "Ciencias Básicas",
  "horas_maximas_semana": 40,
  "user_id": 5
}
```

### Obtener Ocupaciones
```http
GET /api/v1/docentes/{docente_id}/ocupaciones
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "dia_semana": "lunes",
    "hora_inicio": "07:00:00",
    "hora_fin": "09:00:00",
    "grupo_id": 1,
    "materia_nombre": "Matemáticas I",
    "grupo_nombre": "ISC-1A",
    "aula_nombre": "Aula 101"
  }
]
```

## Horarios

### Listar Horarios
```http
GET /api/v1/horarios?page=1&page_size=20&dia_semana=lunes&activo=true
```

### Crear Horario
```http
POST /api/v1/horarios
Authorization: Bearer {token}

{
  "asignacion_id": 1,
  "aula_id": 5,
  "dia_semana": "lunes",
  "hora_inicio": "07:00:00",
  "hora_fin": "09:00:00",
  "tipo_sesion": "teorica"
}
```

### Generar Horarios Automáticamente
```http
POST /api/v1/schedule/generate
Authorization: Bearer {token}

{
  "ciclo_escolar": "2026-1"
}
```

**Response:**
```json
{
  "ciclo_escolar": "2026-1",
  "total_asignaciones": 65,
  "horarios_creados": 130,
  "asignaciones_completadas": 65,
  "asignaciones_parciales": 0,
  "asignaciones_fallidas": [],
  "status": "success",
  "mensaje": "✅ Generación exitosa: 130 horarios creados"
}
```

---

# ✅ Testing y Validación

## Testing Manual

### 1. Flow de Autenticación

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coordinador@utec.edu.mx","password":"coord123"}'

# Copiar token de access_token

# Usar token
curl -X GET http://localhost:8000/api/v1/docentes \
  -H "Authorization: Bearer {token}"
```

### 2. Demo Automática

```bash
cd backend
python demo.py
```

### 3. Seed Realista

```bash
python seed_db_realista.py
```

## Tests Unitarios

```bash
cd backend
pytest tests/ -v
```

## Checklist de Validación

- [ ] Docker se levanta sin errores
- [ ] Migraciones ejecutadas correctamente
- [ ] Seed poblado (usuarios, docentes, etc)
- [ ] Login funciona correctamente
- [ ] CRUD endpoints responden bien
- [ ] Generación de horarios sin conflictos
- [ ] Frontend carga sin errores CORS
- [ ] Disponibilidad modal muestra datos correcto
- [ ] Horarios generados visibles en tablas
- [ ] No hay conflictos detectados

---

# 📞 Soporte & Recursos

## URLs Importantes

| Servicio | URL | Usuario | Contraseña |
|----------|-----|---------|-----------|
| Frontend | http://localhost:4321 | - | - |
| Backend API | http://localhost:8000 | - | - |
| API Docs | http://localhost:8000/docs | - | - |
| Swagger UI | http://localhost:8000/api/v1 | - | - |
| Postgres | localhost:5432 | sph_user | sph_password |

## Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@utec.edu.mx | admin123 | ADMIN |
| coordinador@utec.edu.mx | coord123 | COORDINADOR |
| carlos.mendoza@utec.edu.mx | docente123 | COORDINADOR |

## Documentación Relacionada

- [SEMANA_6_DEMO.md](./SEMANA_6_DEMO.md) - Guía de demo
- [README.md](./README.md) - README principal
- [backend/README.md](./backend/README.md) - Backend específico
- [frontend/README.md](./frontend/README.md) - Frontend específico

---

**Documentación Versión:** 1.0  
**Actualizado:** 2026-03-02  
**Estado:** ✅ MVP Semana 6 Completo
