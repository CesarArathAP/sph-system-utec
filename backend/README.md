# Backend - Sistema de Planificación de Horarios

Backend del sistema de planificación inteligente de horarios académicos.

## Stack Técnico

- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Base de Datos**: SQLite (desarrollo) → PostgreSQL (producción)
- **Migraciones**: Alembic
- **Autenticación**: JWT

---

## Instalación

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
copy .env.example .env
```

---

## Comandos

### Iniciar servidor de desarrollo

```bash
uvicorn app.main:app --reload
```

El servidor estará disponible en: http://localhost:8000

### Documentación de la API

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Migraciones de base de datos

```bash
# Crear migración
alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

---

## Scripts de ayuda

### Setup automático (Windows)

```bash
setup.bat
```

### Inicio rápido (Windows)

```bash
start.bat
```

---

## Equipo

- Cesar Arath Angeles Pérez
- Angel Guerra Muñoz
