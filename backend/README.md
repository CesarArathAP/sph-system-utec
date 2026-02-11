# Backend - Sistema de Planificación de Horarios

Backend del sistema de planificación inteligente de horarios académicos desarrollado con FastAPI, SQLAlchemy y Alembic.

---

## 📋 Tabla de Contenidos

- [Stack Técnico](#-stack-técnico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación Rápida](#-instalación-rápida)
- [Instalación Manual](#-instalación-manual)
- [Uso](#-uso)
- [Migraciones de Base de Datos](#-migraciones-de-base-de-datos)
- [Desarrollo](#-desarrollo)
- [Variables de Entorno](#-variables-de-entorno)
- [Próximos Pasos](#-próximos-pasos)

---

## 🛠 Stack Técnico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **FastAPI** | 0.115.0 | Framework web moderno y rápido |
| **SQLAlchemy** | 2.0.36 | ORM para manejo de base de datos |
| **Alembic** | 1.14.0 | Sistema de migraciones |
| **Pydantic** | 2.10.2 | Validación de datos |
| **Uvicorn** | 0.32.0 | Servidor ASGI |
| **Python-Jose** | 3.3.0 | Manejo de JWT |
| **Passlib** | 1.7.4 | Hashing de contraseñas |

**Base de Datos:**
- Desarrollo: SQLite
- Staging/Producción: PostgreSQL

**Arquitectura:** Monolito modular

---

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py                 # Punto de entrada de FastAPI
│   ├── config.py               # Configuración (variables de entorno)
│   ├── database.py             # Configuración de SQLAlchemy
│   ├── dependencies.py         # Dependencias compartidas
│   │
│   ├── models/                 # Modelos de base de datos (SQLAlchemy)
│   │   └── __init__.py
│   │
│   ├── schemas/                # Esquemas de validación (Pydantic)
│   │   └── __init__.py
│   │
│   ├── api/
│   │   └── routes/             # Endpoints REST
│   │       ├── auth.py         # Autenticación y autorización
│   │       ├── docentes.py     # CRUD de docentes
│   │       ├── materias.py     # CRUD de materias
│   │       ├── grupos.py       # CRUD de grupos
│   │       ├── aulas.py        # CRUD de aulas
│   │       └── horarios.py     # Generación y gestión de horarios
│   │
│   ├── services/               # Lógica de negocio
│   │   ├── auth_service.py     # Servicio de autenticación
│   │   └── horario_service.py  # Algoritmo de generación de horarios
│   │
│   ├── core/                   # Funcionalidades core
│   │   ├── security.py         # JWT, hashing de passwords
│   │   └── exceptions.py       # Excepciones personalizadas
│   │
│   └── utils/                  # Utilidades generales
│       └── __init__.py
│
├── alembic/                    # Sistema de migraciones
│   ├── versions/               # Archivos de migración
│   ├── env.py                  # Configuración de Alembic
│   └── script.py.mako          # Plantilla de migraciones
│
├── tests/                      # Tests unitarios e integración
│   └── __init__.py
│
├── .env.example                # Plantilla de variables de entorno
├── .env                        # Variables de entorno (no versionado)
├── .gitignore                  # Archivos ignorados por Git
├── alembic.ini                 # Configuración de Alembic
├── requirements.txt            # Dependencias de Python
├── setup.bat                   # Script de instalación automática
├── start.bat                   # Script de inicio rápido
└── README.md                   # Este archivo
```

---

## 🚀 Instalación Rápida

### Opción 1: Script Automático (Recomendado)

```bash
# 1. Navegar a la carpeta backend
cd backend

# 2. Ejecutar setup automático
setup.bat
```

Este script automáticamente:
- ✅ Crea el entorno virtual
- ✅ Instala todas las dependencias
- ✅ Configura las variables de entorno

### Opción 2: Inicio después del setup

```bash
start.bat
```

---

## 🔧 Instalación Manual

### 1. Crear entorno virtual

```bash
python -m venv venv
```

### 2. Activar entorno virtual

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
copy .env.example .env

# Editar .env con tus configuraciones (opcional para desarrollo)
```

### 5. Inicializar base de datos (cuando se tengan modelos)

```bash
alembic upgrade head
```

---

## 💻 Uso

### Iniciar el servidor de desarrollo

```bash
uvicorn app.main:app --reload
```

**Parámetros opcionales:**
```bash
# Especificar host y puerto
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Sin auto-reload (producción)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Acceder a la documentación

Una vez iniciado el servidor:

| Recurso | URL |
|---------|-----|
| **API Root** | http://localhost:8000 |
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **OpenAPI JSON** | http://localhost:8000/api/v1/openapi.json |

---

## 🗄 Migraciones de Base de Datos

### Crear una nueva migración

```bash
# Migración automática (detecta cambios en modelos)
alembic revision --autogenerate -m "descripción del cambio"

# Migración manual
alembic revision -m "descripción del cambio"
```

### Aplicar migraciones

```bash
# Aplicar todas las migraciones pendientes
alembic upgrade head

# Aplicar una migración específica
alembic upgrade <revision_id>
```

### Revertir migraciones

```bash
# Revertir la última migración
alembic downgrade -1

# Revertir a una revisión específica
alembic downgrade <revision_id>

# Revertir todas las migraciones
alembic downgrade base
```

### Ver historial de migraciones

```bash
# Ver historial
alembic history

# Ver migración actual
alembic current
```

---

## 👨‍💻 Desarrollo

### Convenciones de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat:` | Nueva funcionalidad | `feat: add docentes CRUD endpoints` |
| `fix:` | Corrección de bugs | `fix: resolve horario conflict validation` |
| `docs:` | Cambios en documentación | `docs: update API endpoints in README` |
| `refactor:` | Refactorización de código | `refactor: extract validation logic to service` |
| `test:` | Añadir o modificar tests | `test: add unit tests for auth service` |
| `chore:` | Tareas de mantenimiento | `chore: update dependencies` |

### Flujo de Git

```bash
# 1. Asegurarse de estar en develop
git checkout develop
git pull origin develop

# 2. Crear nueva rama
git checkout -b feat/nombre-descriptivo

# 3. Hacer cambios y commits
git add .
git commit -m "feat: descripción del cambio"

# 4. Push a la rama
git push origin feat/nombre-descriptivo

# 5. Crear Pull Request a develop en GitHub
```

### Estructura de una Feature

Al implementar una nueva funcionalidad, sigue este orden:

1. **Modelo** (`app/models/`) - Definir la estructura de datos
2. **Schema** (`app/schemas/`) - Definir validaciones Pydantic
3. **Service** (`app/services/`) - Implementar lógica de negocio
4. **Router** (`app/api/routes/`) - Crear endpoints REST
5. **Tests** (`tests/`) - Escribir pruebas

### Ejemplo de implementación

```python
# 1. Modelo (app/models/docente.py)
from app.database import Base
from sqlalchemy import Column, Integer, String

class Docente(Base):
    __tablename__ = "docentes"
    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)

# 2. Schema (app/schemas/docente.py)
from pydantic import BaseModel

class DocenteCreate(BaseModel):
    nombre: str

# 3. Service (app/services/docente_service.py)
def create_docente(db, docente_data):
    # Lógica de negocio
    pass

# 4. Router (app/api/routes/docentes.py)
from fastapi import APIRouter
router = APIRouter()

@router.post("/")
def create_docente_endpoint(docente: DocenteCreate):
    # Llamar al servicio
    pass
```

---

## 🔐 Variables de Entorno

Archivo `.env` (creado desde `.env.example`):

```bash
# Información del proyecto
PROJECT_NAME=SPH System UTEC
VERSION=1.0.0
API_V1_STR=/api/v1

# Base de datos
DATABASE_URL=sqlite:///./sph_system.db
# Para PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/sph_system

# Seguridad
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (orígenes permitidos)
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:4321"]

# Entorno
ENVIRONMENT=development
```

**⚠️ Importante:** 
- Nunca versionar el archivo `.env`
- Cambiar `SECRET_KEY` en producción
- Usar PostgreSQL en staging/producción

---

## 📝 Próximos Pasos

### Sprint 1 - Base del sistema
- [ ] Definir diccionario de datos
- [ ] Crear modelos SQLAlchemy (Usuario, Docente, Materia, Grupo, Aula)
- [ ] Implementar esquemas Pydantic
- [ ] Configurar migraciones con Alembic
- [ ] Implementar autenticación JWT

### Sprint 2 - Primer flujo funcional
- [ ] Desarrollar CRUD de docentes
- [ ] Desarrollar CRUD de materias
- [ ] Desarrollar CRUD de aulas
- [ ] Implementar validaciones

### Sprint 3 - Operaciones esenciales
- [ ] Desarrollar CRUD de grupos
- [ ] Implementar asignación de materias a grupos
- [ ] Gestión de disponibilidad de docentes

### Sprint 4 - Generación de horarios
- [ ] Implementar algoritmo básico de generación
- [ ] Validación de conflictos (docente, aula, grupo)
- [ ] Creación automática de horarios

### Sprints 5-7
- [ ] Consultas por docente/estudiante
- [ ] Edición de horarios
- [ ] Exportación de datos
- [ ] Tests y refinamiento

---

## 📚 Recursos Adicionales

- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de SQLAlchemy](https://docs.sqlalchemy.org/)
- [Documentación de Alembic](https://alembic.sqlalchemy.org/)
- [Documentación de Pydantic](https://docs.pydantic.dev/)

---

## 👥 Equipo

- Cesar Arath Angeles Pérez
- Angel Guerra Muñoz

---

**Última actualización:** Febrero 2026
