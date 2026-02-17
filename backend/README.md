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

A continuación se detallan los endpoints disponibles en el sistema. Todos los endpoints están prefijados con `/api/v1`.

### 🔐 Autenticación (`/auth`)
*   `POST /auth/login/access-token`: Obtener token de acceso (OAuth2).
*   `POST /auth/login/test-token`: Probar validez del token actual.

### 👤 Usuarios (`/users`)
*   `GET /users/me`: Obtener información del usuario actual.
*   `POST /users`: Crear nuevo usuario (Admin).
*   `GET /users`: Listar usuarios (Admin).

### 👨‍🏫 Docentes (`/docentes`)
*   `GET /docentes`: Listar docentes con filtros (departamento, activo).
*   `POST /docentes`: Registrar nuevo docente.
*   `GET /docentes/{id}`: Obtener detalle de docente.
*   `PUT /docentes/{id}`: Actualizar docente.
*   `DELETE /docentes/{id}`: Desactivar docente.
*   `POST /docentes/{id}/disponibilidad`: Configurar disponibilidad horaria.

### 📚 Materias (`/materias`)
*   `GET /materias`: Catálogo de materias.
*   `POST /materias`: Crear materia.
*   `PUT /materias/{id}`: Editar materia.
*   `DELETE /materias/{id}`: Eliminar materia.

### 👥 Grupos (`/grupos`)
*   `GET /grupos`: Listar grupos.
*   `POST /grupos`: Crear grupo.
*   `PUT /grupos/{id}`: Editar grupo.
*   `DELETE /grupos/{id}`: Eliminar grupo.

### 🏫 Aulas (`/aulas`)
*   `GET /aulas`: Listar aulas (filtro por tipo, capacidad).
*   `POST /aulas`: Registrar aula.
*   `PUT /aulas/{id}`: Editar aula.
*   `DELETE /aulas/{id}`: Eliminar aula.

### 📋 Asignaciones (`/asignaciones`)
*   `GET /asignaciones`: Ver asignaciones Grupo-Materia-Docente.
*   `POST /asignaciones`: Crear nueva asignación.
*   `PUT /asignaciones/{id}`: Modificar asignación.
*   `DELETE /asignaciones/{id}`: Eliminar asignación.

### 📅 Horarios (`/horarios`)
*   `GET /horarios`: Listar horarios generados.
*   `POST /horarios`: Crear bloque de horario manual (con detección de conflictos).
*   `PUT /horarios/{id}`: Modificar horario.
*   `DELETE /horarios/{id}`: Eliminar horario.
*   `POST /horarios/check-conflicts`: Verificar conflictos sin guardar.
*   `GET /horarios/registered-conflicts/list`: Ver historial de conflictos registrados.
*   `PUT /horarios/conflicts/{id}/resolve`: Marcar conflicto como resuelto.

### ⚡ Generación Automática (`/schedule`)
*   `POST /schedule/generate`: **Generar horarios automáticamente**.
    *   Algoritmo optimizado que considera: 
        *   Disponibilidad docente.
        *   Carga máxima semanal.
        *   Preferencias de horario.
        *   Tipo y capacidad de aula.
*   `GET /schedule/{ciclo}/summary`: Resumen estadístico de la generación.
*   `DELETE /schedule/{ciclo}`: Limpiar todos los horarios del ciclo.
