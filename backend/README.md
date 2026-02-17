# Sistema de Gestión de Horarios (Backend)

Backend desarrollado con FastAPI para la gestión de horarios, docentes, materias y asignaciones de la UTEC.

## 🚀 Instalación y Ejecución

1.  **Clonar el repositorio**
2.  **Crear entorno virtual**:
    ```bash
    python -m venv venv
    venv\Scripts\activate  # Windows
    ```
3.  **Instalar dependencias**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configurar variables de entorno** (`.env`)
5.  **Ejecutar migraciones**:
    ```bash
    alembic upgrade head
    ```
6.  **Iniciar servidor**:
    ```bash
    uvicorn app.main:app --reload
    ```

## 👥 Equipo de Desarrollo

*   **Cesar Arath** - *Backend Developer* - [GitHub](https://github.com/CesarArathAP)

---

## 📚 Documentación de API Endpoints

A continuación se detallan los endpoints principales con ejemplos de uso mediante `curl`.

> **Nota:** Para la mayoría de los endpoints de modificación (`POST`, `PUT`, `DELETE`) se requiere un token de autenticación (Bearer Token) en el header: `-H "Authorization: Bearer <token>"`.

### 🔐 Autenticación (`/auth`)

**Obtener Token (Login)**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login/access-token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin@example.com&password=securepassword"
```

### 👤 Usuarios (`/users`)

**Crear Usuario (Admin)**
```bash
curl -X POST "http://localhost:8000/api/v1/users" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "email": "docente@utec.edu.mx",
       "password": "password123",
       "nombre": "Juan",
       "apellido": "Pérez",
       "rol": "docente"
     }'
```

### 👨‍🏫 Docentes (`/docentes`)

**Registrar Docente**
```bash
curl -X POST "http://localhost:8000/api/v1/docentes" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "user_id": 2,
       "codigo_docente": "D-2024-001",
       "departamento": "Sistemas Computacionales",
       "horas_maximas_semana": 40,
       "disponibilidades": []
     }'
```

**Agregar Disponibilidad**
```bash
curl -X POST "http://localhost:8000/api/v1/docentes/2/disponibilidad" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '[
       {
         "dia_semana": "lunes",
         "hora_inicio": "07:00:00",
         "hora_fin": "15:00:00"
       }
     ]'
```

### 📚 Materias (`/materias`)

**Crear Materia**
```bash
curl -X POST "http://localhost:8000/api/v1/materias" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "codigo_materia": "ISC-101",
       "nombre": "Programación Orientada a Objetos",
       "creditos": 6,
       "horas_semana": 5,
       "requiere_laboratorio": true,
       "tipo_aula_requerida": "laboratorio",
       "descripcion": "Introducción a la POO con Java"
     }'
```

### 👥 Grupos (`/grupos`)

**Crear Grupo**
```bash
curl -X POST "http://localhost:8000/api/v1/grupos" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "codigo_grupo": "3A-ISC",
       "nombre": "3A Ingeniería en Sistemas",
       "carrera": "Ingeniería en Sistemas",
       "semestre": 3,
       "turno": "matutino",
       "num_estudiantes": 35,
       "ciclo_escolar": "2024-1"
     }'
```

### 🏫 Aulas (`/aulas`)

**Registrar Aula**
```bash
curl -X POST "http://localhost:8000/api/v1/aulas" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "codigo_aula": "B-105",
       "nombre": "Laboratorio de Cómputo 1",
       "capacidad": 40,
       "tipo": "laboratorio",
       "edificio": "B",
       "piso": 1
     }'
```

### 📋 Asignaciones (`/asignaciones`)

**Crear Asignación**
```bash
curl -X POST "http://localhost:8000/api/v1/asignaciones" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "grupo_id": 1,
       "materia_id": 1,
       "docente_id": 1,
       "ciclo_escolar": "2024-1"
     }'
```

### 📅 Horarios (`/horarios`)

**Crear Horario Manualmente**
```bash
curl -X POST "http://localhost:8000/api/v1/horarios" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "asignacion_id": 1,
       "aula_id": 1,
       "dia_semana": "miercoles",
       "hora_inicio": "09:00:00",
       "hora_fin": "11:00:00",
       "tipo_sesion": "teorica"
     }'
```

**Verificar Conflictos (Sin guardar)**
```bash
curl -X POST "http://localhost:8000/api/v1/horarios/check-conflicts" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{
       "dia_semana": "miercoles",
       "hora_inicio": "09:00:00",
       "hora_fin": "11:00:00",
       "aula_id": 1,
       "asignacion_id": 2
     }'
```

### ⚡ Generación Automática (`/schedule`)

**Generar Horarios Automáticamente**
Este endpoint ejecuta el algoritmo que asigna horarios basándose en la disponibilidad de docentes y aulas.

```bash
curl -X POST "http://localhost:8000/api/v1/schedule/generate?ciclo_escolar=2024-1" \
     -H "Authorization: Bearer <token>"
```

**Obtener Resumen de Generación**
```bash
curl -X GET "http://localhost:8000/api/v1/schedule/2024-1/summary" \
     -H "Authorization: Bearer <token>"
```

**Limpiar Horarios del Ciclo**
Atención: Esto eliminará todos los horarios generados para ese ciclo.
```bash
curl -X DELETE "http://localhost:8000/api/v1/schedule/2024-1" \
     -H "Authorization: Bearer <token>"
```
