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
6.  **Iniciar servidor (Importante: usar python -m para evitar bloqueos)**:
    ```bash
    python -m uvicorn app.main:app --reload
    ```

## 👥 Equipo de Desarrollo

*   **Cesar Arath** - *Backend Developer* - [GitHub](https://github.com/CesarArathAP)

---

## 📚 Documentación de API Endpoints (JSON de Prueba)

A continuación se listan los endpoints con sus respectivos payloads JSON para facilitar las pruebas en herramientas como Postman o Insomnia.

> **Nota:** Todos los endpoints protegidos requieren el header `Authorization: Bearer <token>`.

### 🔐 Autenticación (`/auth`)

#### `POST /api/v1/auth/login/access-token` (Login)
**Body (x-www-form-urlencoded):**
```text
username=admin@example.com
password=securepassword
```

#### `GET /api/v1/users/me` (Get Me)
**Headers:** `Authorization: Bearer <token>`
**Body:** (Vacío)

---

### 👤 Usuarios (`/users`)

#### `POST /api/v1/users` (Create User)
**Body (JSON):**
```json
{
  "email": "docente@utec.edu.mx",
  "password": "password123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rol": "docente"
}
```

---

### 👨‍🏫 Docentes (`/docentes`)

#### `GET /api/v1/docentes` (List Docentes)
**Query Params:** `page=1`, `page_size=10`, `departamento=Sistemas`

#### `POST /api/v1/docentes` (Create Docente)
**Body (JSON):**
```json
{
  "user_id": 2,
  "codigo_docente": "D-2024-001",
  "departamento": "Sistemas Computacionales",
  "horas_maximas_semana": 40,
  "disponibilidades": []
}
```

#### `GET /api/v1/docentes/{id}` (Get Docente)
**Body:** (Vacío)

#### `PUT /api/v1/docentes/{id}` (Update Docente)
**Body (JSON):**
```json
{
  "departamento": "Desarrollo de Software",
  "horas_maximas_semana": 35,
  "activo": true
}
```

#### `DELETE /api/v1/docentes/{id}` (Delete Docente)
**Body:** (Vacío)

#### `POST /api/v1/docentes/{id}/disponibilidad` (Add Disponibilidad)
**Body (JSON):**
```json
[
  {
    "dia_semana": "lunes",
    "hora_inicio": "07:00:00",
    "hora_fin": "15:00:00"
  },
  {
    "dia_semana": "miercoles",
    "hora_inicio": "09:00:00",
    "hora_fin": "14:00:00"
  }
]
```

---

### 📚 Materias (`/materias`)

#### `GET /api/v1/materias` (List Materias)
**Body:** (Vacío)

#### `POST /api/v1/materias` (Create Materia)
**Body (JSON):**
```json
{
  "codigo_materia": "ISC-101",
  "nombre": "Programación Orientada a Objetos",
  "creditos": 6,
  "horas_semana": 5,
  "requiere_laboratorio": true,
  "tipo_aula_requerida": "laboratorio",
  "descripcion": "Introducción a la POO con Java"
}
```

#### `PUT /api/v1/materias/{id}` (Update Materia)
**Body (JSON):**
```json
{
  "nombre": "POO Avanzada",
  "horas_semana": 6
}
```

#### `DELETE /api/v1/materias/{id}` (Delete Materia)
**Body:** (Vacío)

---

### 👥 Grupos (`/grupos`)

#### `GET /api/v1/grupos` (List Grupos)
**Body:** (Vacío)

#### `POST /api/v1/grupos` (Create Grupo)
**Body (JSON):**
```json
{
  "codigo_grupo": "3A-ISC",
  "nombre": "3A Ingeniería en Sistemas",
  "carrera": "Ingeniería en Sistemas",
  "semestre": 3,
  "turno": "matutino",
  "num_estudiantes": 35,
  "ciclo_escolar": "2024-1"
}
```

#### `PUT /api/v1/grupos/{id}` (Update Grupo)
**Body (JSON):**
```json
{
  "num_estudiantes": 40,
  "turno": "vespertino"
}
```

#### `DELETE /api/v1/grupos/{id}` (Delete Grupo)
**Body:** (Vacío)

---

### 🏫 Aulas (`/aulas`)

#### `GET /api/v1/aulas` (List Aulas)
**Query Params:** `tipo=laboratorio`, `capacidad_min=30`

#### `POST /api/v1/aulas` (Create Aula)
**Body (JSON):**
```json
{
  "codigo_aula": "B-105",
  "nombre": "Laboratorio de Cómputo 1",
  "capacidad": 40,
  "tipo": "laboratorio",
  "edificio": "B",
  "piso": 1
}
```

#### `PUT /api/v1/aulas/{id}` (Update Aula)
**Body (JSON):**
```json
{
  "capacidad": 45,
  "activo": true
}
```

#### `DELETE /api/v1/aulas/{id}` (Delete Aula)
**Body:** (Vacío)

---

### 📋 Asignaciones (`/asignaciones`)

#### `GET /api/v1/asignaciones` (List Asignaciones)
**Query Params:** `ciclo_escolar=2024-1`

#### `POST /api/v1/asignaciones` (Create Asignacion)
**Body (JSON):**
```json
{
  "grupo_id": 1,
  "materia_id": 1,
  "docente_id": 1,
  "ciclo_escolar": "2024-1"
}
```

#### `PUT /api/v1/asignaciones/{id}` (Update Asignacion)
**Body (JSON):**
```json
{
  "docente_id": 2
}
```

#### `DELETE /api/v1/asignaciones/{id}` (Delete Asignacion)
**Body:** (Vacío)

---

### 📅 Horarios (`/horarios`)

#### `GET /api/v1/horarios` (List Horarios)
**Query Params:** `asignacion_id=1`, `dia=lunes`

#### `POST /api/v1/horarios` (Create Horario - Manual)
**Body (JSON):**
```json
{
  "asignacion_id": 1,
  "aula_id": 1,
  "dia_semana": "miercoles",
  "hora_inicio": "09:00:00",
  "hora_fin": "11:00:00",
  "tipo_sesion": "teorica"
}
```

#### `PUT /api/v1/horarios/{id}` (Update Horario)
**Body (JSON):**
```json
{
  "aula_id": 2,
  "dia_semana": "jueves"
}
```

#### `POST /api/v1/horarios/check-conflicts` (Check Conflicts Only)
**Body (JSON):**
```json
{
  "asignacion_id": 1,
  "aula_id": 1,
  "dia_semana": "miercoles",
  "hora_inicio": "09:00:00",
  "hora_fin": "11:00:00"
}
```

#### `GET /api/v1/horarios/registered-conflicts/list` (List Registered Conflicts)
**Body:** (Vacío)

#### `PUT /api/v1/horarios/conflicts/{id}/resolve` (Resolve Conflict)
**Body:** (Vacío - Marca conflicto como resuelto)

---

### ⚡ Generación Automática (`/schedule`)

#### `POST /api/v1/schedule/generate` (Generate Schedule)
**Query Params:** `ciclo_escolar=2024-1`
**Body:** (Vacío)

#### `GET /api/v1/schedule/{ciclo}/summary` (Get Summary)
**Body:** (Vacío)

#### `DELETE /api/v1/schedule/{ciclo}` (Clear Schedule)
**Body:** (Vacío)
