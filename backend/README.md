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

## Docker

### Iniciar con Docker Compose

Desde la raíz del proyecto:

```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en puerto 5432
- Backend en puerto 8000

### Comandos útiles

```bash
# Ver logs
docker-compose logs -f backend

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose up -d --build

# Ejecutar migraciones manualmente
docker-compose exec backend alembic upgrade head

# Ejecutar seed de datos
docker-compose exec backend python seed.py
```

### Acceder a la base de datos

```bash
docker-compose exec db psql -U sph_user -d sph_system
```

---

## Equipo

- Cesar Arath Angeles Pérez
- Angel Guerra Muñoz
