# 📖 SPH System UTEC — Guía de Usuario Final

> **Para:** Administradores, Coordinadores y Docentes  
> **Versión:** 1.0  
> **Fecha:** Marzo 2, 2026

---

## 🎯 ¿Qué es SPH System?

**SPH (Sistema de Planificación de Horarios)** es una plataforma que automatiza la generación y gestión de horarios escolares.

**El objetivo:** Eliminar conflictos de horarios, optimizar uso de aulas y simplificar la carga de trabajo administrativo.

---

## 🚀 Inicio Rápido

### Paso 1: Acceder al Sistema

Abre tu navegador web y ve a:
```
http://localhost:4321
```

Verás la pantalla de **Login**.

### Paso 2: Ingresar Credenciales

Por defecto, hay 3 usuarios:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin@utec.edu.mx` | `admin123` | Administrador |
| `coordinador@utec.edu.mx` | `coord123` | Coordinador |
| `carlos.mendoza@utec.edu.mx` | `docente123` | Docente |

Ingresa cualquiera de estos usuarios y haz clic en **"Ingresar"**.

### Paso 3: Dashboard Principal

Una vez dentro, verás el **menú principal** con opciones para:
- 👥 **Docentes** - Gestionar profesores
- 📚 **Materias** - Gestionar cursos
- 👨‍🎓 **Grupos** - Gestionar grupos de estudiantes
- 🏫 **Aulas** - Gestionar salones
- 📋 **Asignaciones** - Asignar docentes a materias
- 📅 **Horarios** - Ver y generar horarios

---

## 📚 Módulos Principales

### 1️⃣ **Docentes**

#### ¿Qué es?
Aquí se registran y gestionan a todos los profesores del sistema.

#### ¿Qué puedo hacer?
- ✅ **Ver lista de docentes** - Tabla con nombre, código, departamento y horas máximas
- ✅ **Crear nuevo docente** - Agregar profesor a la base de datos
- ✅ **Editar docente** - Cambiar información
- ✅ **Ver disponibilidad** - Qué días/horas está disponible cada docente
- ✅ **Definir disponibilidad** - Establecer cuándo puede enseñar (ej: lunes-viernes 7-13)

#### Ejemplo de Flujo
```
1. Haz clic en "Docentes" del menú
2. Ves la lista de profesores
3. Haz clic en un profesor para ver detalles
4. Haz clic en "Ver disponibilidad"
5. Verás un calendario con los horarios que está disponible
6. Los slots AZULES = disponible
7. Los slots AMARILLOS = ya tiene clase asignada
```

#### Tips
- ⭐ **Obligatorio:** Cada docente DEBE tener disponibilidad registrada ANTES de generar horarios
- ⭐ **Realista:** Usa horarios verdaderos (nicht 7-21 si no puede)
- ⭐ **Máximo Horas:** Define cuántas horas máximo puede trabajar por semana

---

### 2️⃣ **Materias**

#### ¿Qué es?
Las asignaturas o cursos que ofrece la universidad (Matemáticas, Programación, etc).

#### ¿Qué puedo hacer?
- ✅ **Ver lista de materias** - Tabla con código, nombre, créditos, horas/semana
- ✅ **Crear materia** - Agregar nuevo curso
- ✅ **Especificar tipo de aula** - ¿Necesita aula normal, laboratorio o sala de cómputo?

#### Ejemplo
```
Materia: Programación Básica
- Código: PRG-101
- Créditos: 4
- Horas/semana: 4
- Tipo aula: Laboratorio (necesita computadoras)
```

---

### 3️⃣ **Grupos**

#### ¿Qué es?
Los grupos de estudiantes (cursos). Ejemplo: ISC Semestre 1-A (35 estudiantes).

#### ¿Qué puedo hacer?
- ✅ **Ver grupos** - Lista de todos (carrera, semestre, turno, cantidad estudiantes)
- ✅ **Crear grupo** - Agregar nuevo
- ✅ **Consultar capacidad** - Cuántos estudiantes hay

#### Info Importante
- 🎓 Cada grupo está en una carrera (Ing. Sistemas, Electrónica, etc)
- 📊 Cada grupo tiene un semestre (1, 2, 3, etc)
- ⏰ Puede ser turno "matutino" o "vespertino"

---

### 4️⃣ **Aulas**

#### ¿Qué es?
Los salones, laboratorios y espacios donde se imparten clases.

#### ¿Qué puedo hacer?
- ✅ **Ver aulas disponibles** - Lista con capacidad y tipo
- ✅ **Crear aula** - Agregar nuevo salón
- ✅ **Especificar tipo** - Normal, Laboratorio, Sala de Cómputo

#### Ejemplo
```
Aula A101
- Capacidad: 40 estudiantes
- Tipo: Normal
- Edificio: A, Piso: 1
```

---

### 5️⃣ **Asignaciones**

#### ¿Qué es?
Conecta:
- **Docente** (profesor)
- **Materia** (curso)
- **Grupo** (estudiantes)

"El profesor Carlos enseña Matemáticas I al grupo ISC-1A"

#### ¿Qué puedo hacer?
- ✅ **Ver asignaciones** - Tabla con docente-materia-grupo
- ✅ **Crear asignación** - Asignar un profesor a un curso para un grupo
- ✅ **Editar/Eliminar** - Cambiar o remover

#### Importante
- ⚠️ Antes de crear asignaciones, debes tener:
  - Docentes creados
  - Materias creadas
  - Grupos creados
- ⚠️ Cada docente debe tener disponibilidad registrada

---

### 6️⃣ **Horarios**

#### ¿Qué es?
El calendario final con todos los horarios:
- Qué profesor enseña
- Qué materia
- A qué grupo
- En qué aula
- Qué día y hora

#### ¿Qué puedo hacer?
- ✅ **Ver horarios** - Tabla con todos los horarios generados
- ✅ **Filtrar** - Por día, aula, docente, grupo
- ✅ **Generar automáticamente** - Dejar que el sistema cree horarios sin conflictos
- ✅ **Ver conflictos** - Si hay solapamientos o problemas
- ✅ **Crear manualmente** - Crear un horario específico

#### Ver disponibilidad de un Docente

En la tabla de horarios, haz clic en un docente:

```
1. Haz clic en el nombre del docente
2. Se abre modal "Ver disponibilidad y sesiones"
3. Verás un calendario con:
   - AZUL = disponible
   - AMARILLO = ocupado (tiene clase)
4. Abajo verás detalles de sus clases actuales
```

---

## 🎬 **Flujo Completo: De 0 a Horario**

### Escenario Real

Queremos crear horarios para el Ciclo 2026-1.

### Paso a Paso

**FASE 1: PREPARACIÓN (Días 1-2)**

1. **Crear Docentes**
   - Ir a Docentes → "Crear Nuevo"
   - Ingresar profesor Carlos Mendoza (DOC-001)
   - Repetir para otros docentes (20+ docentes)

2. **Crear Materias**
   - Ir a Materias → "Crear Nueva"
   - Ingresar Matemáticas I (MAT-101)
   - Especificar: 4 horas/semana, aula normal
   - Repetir para otras materias (40+ materias)

3. **Crear Aulas**
   - Ir a Aulas → "Crear Nueva"
   - Ingresar Aula A101 (40 capacidad, normal)
   - Repetir para otros espacios (25+ aulas)

4. **Crear Grupos**
   - Ir a Grupos → "Crear Nuevo"
   - Ingresar ISC-1A (35 estudiantes, Ing. Sistemas, Semestre 1)
   - Repetir para otros grupos (25+ grupos)

**FASE 2: CONFIGURACIÓN (Días 3-4)**

5. **Definir Disponibilidades**
   - Ir a Docentes → Click en "Carlos Mendoza"
   - Click en "Ver disponibilidad"
   - Seleccionar: Lunes a Viernes, 7:00 - 13:00
   - Guardar
   - Repetir para todos los docentes

6. **Crear Asignaciones**
   - Ir a Asignaciones → "Crear Nueva"
   - Seleccionar: Docente (Carlos), Materia (Matemáticas I), Grupo (ISC-1A)
   - Guardar
   - Repetir para todas las combinaciones (65+ asignaciones)

**FASE 3: GENERACIÓN (Día 5)**

7. **Generar Horarios Automáticamente**
   - Ir a Horarios → "Generar Horarios"
   - El sistema crea automáticamente 130+ horarios sin conflictos
   - Resultado:
     - ✅ 65 asignaciones with 2 sesiones cada una
     - ✅ 0 conflictos de docente
     - ✅ 0 conflictos de aula
     - ✅ 0 conflictos de grupo

**FASE 4: VALIDACIÓN (Día 6)**

8. **Revisar Horarios**
   - Ir a Hogarios → Ver tabla completa
   - Hacer click en docentes para ver disponibilidad
   - Verificar: slots azules (disponible) vs amarillos (ocupado)
   - Confirmar que cada docente respeta su disponibilidad

9. **Ver Reportes**
   - Cantidad total de horarios generados
   - Conflictos detectados (idealmente 0)
   - Cobertura de asignaciones

---

## ❓ Preguntas Frecuentes

### P: ¿Qué pasa si no registro disponibilidad de un docente?
**R:** El sistema NO dejará generar horarios. Mostrará error: "Docente X sin disponibilidad registrada".

### P: ¿Puedo cambiar un horario después de generar?
**R:** Sí, puedes:
- Editar un horario específico
- O regenerar todos (borra los anteriores)

### P: ¿Qué significa "conflicto"?
**R:** Cuando algo no puede ocurrir simultáneamente:
- **Aula:** Dos clases en la misma aula, mismo día/hora
- **Docente:** Profesor enseñando en dos lugares a la vez
- **Grupo:** Estudiantes en dos clases simultáneamente

### P: ¿Por qué me dice "Sin aulas disponibles"?
**R:** Si generas horarios y no hay suficientes aulas para la capacidad de estudiantes.
- Solución: Crear más aulas o aumentar capacidad

### P: ¿Puedo definir disponibilidad solo para ciertos días?
**R:** Sí, completamente. Ejemplo:
- Lunes, Miércoles, Viernes: 9-15
- Martes, Jueves: 10-17

### P: ¿Cuántas horas máximo puede enseñar un docente?
**R:** Lo defines tú. Por ejemplo:
- Carlos: máximo 40 horas/semana
- María: máximo 36 horas/semana

---

## 🛟 Soporte & Ayuda

### El sistema no carga
1. Verifica que estés en `http://localhost:4321`
2. Verifica que Docker está corriendo (`docker-compose up`)
3. Espera 10 segundos y recarga

### Olvide mi contraseña
- En desarrollo, usa los usuarios por defecto (arriba)
- En producción, contacta al administrador

### Hay un error al crear algo
- Verifica que rellenaste todos los campos requeridos
- Asegúrate de usar valores únicos (códigos sin repetir)
- Lee el mensaje de error — generalmente indica qué está mal

---

## 📝 Checklist Para Generar Horarios con Éxito

Antes de hacer clic en "Generar Horarios":

- [ ] ✅ Tengo **20+ docentes** creados
- [ ] ✅ Cada docente tiene **disponibilidad definida** (L-V, horario realista)
- [ ] ✅ Tengo **40+ materias** creadas especificando tipo de aula
- [ ] ✅ Tengo **25+ aulas** creadas con tipo y capacidad correcta
- [ ] ✅ Tengo **25+ grupos** creados con cantidad de estudiantes
- [ ] ✅ Tengo **65+ asignaciones** creadas (docente-materia-grupo)
- [ ] ✅ Las asignaciones coinciden con grupos reales (no repito)
- [ ] ✅ Las aulas son suficientes para la capacidad de estudiantes

Si falta algo:
- ❌ El sistema dirá cuál es el problema
- ❌ No generará horarios
- ✅ Fix el problema y reinténtalo

---

## 🎓 Para Docentes

### ¿Qué verán los docentes?

1. **Acceder:** `http://localhost:4321` con tu usuario
2. **Ver mis clases:** Haz clic en tu nombre → "Mi Horario"
3. **Ver mis sesiones:**
   - Tabla con: Día | Hora | Materia | Grupo | Aula | Tipo

### ¿Puedo cambiar mi disponibilidad?
**No** (en esta fase MVP). Solo el coordinador puede cambiarla.

Próximas versiones: Sí, con aprobación.

---

## 📞 Contacto

- **Problemas técnicos:** admin@utec.edu.mx
- **Cambios en disponibilidad:** coordinador@utec.edu.mx
- **Sugerencias:** feedback@utec.edu.mx

---

## 📈 Información del Sistema

| Métrica | Cantidad |
|---------|----------|
| Docentes | 20+ |
| Materias | 45+ |
| Grupos | 25+ |
| Aulas | 27 |
| Asignaciones | 65+ |
| Horarios generables | 130+ |
| Ciclo actual | 2026-1 |

---

**Última actualización:** 2026-03-02  
**Versión:** 1.0 MVP  
**Estado:** ✅ Listo para usar
