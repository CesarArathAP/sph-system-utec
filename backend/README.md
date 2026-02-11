# Backend - Sistema de Planificación de Horarios

## Stack Técnico
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Base de Datos**: SQLite (desarrollo) → PostgreSQL (staging/producción)
- **Migraciones**: Alembic
- **Autenticación**: JWT
- **Arquitectura**: Monolito modular

## Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Punto de entrada de la aplicación
│   ├── config.py               # Configuración de la aplicación
│   ├── database.py             # Configuración de la base de datos
│   ├── dependencies.py         # Dependencias compartidas
│   │
│   ├── models/                 # Modelos SQLAlchemy
│   │   ├── __init__.py
│   │   └── ...
│   │
│   ├── schemas/                # Esquemas Pydantic
│   │   ├── __init__.py
│   │   └── ...
│   │
│   ├── api/                    # Endpoints de la API
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── docentes.py
│   │   │   ├── materias.py
│   │   │   ├── grupos.py
│   │   │   ├── aulas.py
│   │   │   └── horarios.py
│   │   └── deps.py
│   │
│   ├── services/               # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── horario_service.py
│   │   └── ...
│   │
│   ├── core/                   # Funcionalidades core
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, hashing, etc.
│   │   └── exceptions.py       # Excepciones personalizadas
│   │
│   └── utils/                  # Utilidades
│       ├── __init__.py
│       └── ...
│
├── alembic/                    # Migraciones de base de datos
│   ├── versions/
│   └── env.py
│
├── tests/                      # Tests
│   ├── __init__.py
│   └── ...
│
├── .env.example                # Ejemplo de variables de entorno
├── .gitignore
├── alembic.ini                 # Configuración de Alembic
├── requirements.txt            # Dependencias
└── README.md
```

## Instalación

### 1. Crear entorno virtual
```bash
python -m venv venv
```

### 2. Activar entorno virtual
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 5. Inicializar base de datos
```bash
alembic upgrade head
```

### 6. Ejecutar servidor de desarrollo
```bash
uvicorn app.main:app --reload
```

## Endpoints Disponibles

Una vez iniciado el servidor, puedes acceder a:
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

## Migraciones

### Crear nueva migración
```bash
alembic revision --autogenerate -m "descripción del cambio"
```

### Aplicar migraciones
```bash
alembic upgrade head
```

### Revertir migración
```bash
alembic downgrade -1
```

## Desarrollo

### Convenciones de Commits
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Tareas de mantenimiento

### Flujo de Git
1. Crear rama desde `develop`: `git checkout -b feat/<id>-<descripcion>`
2. Hacer commits siguiendo convenciones
3. Push y crear Pull Request a `develop`
4. Revisión y merge

## Próximos Pasos

- [ ] Definir diccionario de datos
- [ ] Crear modelos SQLAlchemy
- [ ] Implementar esquemas Pydantic
- [ ] Desarrollar endpoints de la API
- [ ] Implementar lógica de generación de horarios
- [ ] Agregar tests
