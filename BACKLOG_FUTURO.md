# 🚀 Backlog Futuro — Funcionalidades Post-MVP

**Versión:** 1.0  
**Fecha:** Marzo 2, 2026  
**Estado:** Propuestas para Semanas 8+

---

## 📋 Resumen

Este documento lista todas las funcionalidades que fueron **DESCARTADAS** del MVP (Semana 7) pero que deberían implementarse en versiones futuras.

**Criterio de descarte:** Funcionalidad no es crítica para el core de generación de horarios sin conflictos.

---

## 📱 Prioridades

Las features están organizadas por:
- **P0 (CRÍTICA):** Deberían estar en v1.1
- **P1 (ALTA):** Sprint siguiente (1-2 semanas)
- **P2 (MEDIA):** Próximo trimestre
- **P3 (BAJA):** Cuando haya tiempo / recursos

---

# P0 — CRÍTICAS (v1.1 — Semanas 8-9)

## 1. 🔐 Autenticación Avanzada

### Descripción
Mejorar seguridad y usabilidad del login.

### Features Propuestas
- [ ] **Remember me** - Mantener sesión por 30 días
- [ ] **Recuperar contraseña** - Email reset
- [ ] **Cambiar contraseña** - Usuarios pueden cambiar su propia password
- [ ] **2FA (Two-Factor Authentication)** - Código SMS o Authenticator app
- [ ] **OAuth Google/Microsoft** - Login con cuenta institucional

### Estimación
- **Esfuerzo:** 5-7 días
- **Dependencias:** Backend (fastapi-users), Frontend (UI)
- **Riesgo:** Bajo

### Beneficio
- 🔒 Reducir riesgos de seguridad
- 👤 Mejor UX para usuarios
- 🏢 Integración con SSO institucional

---

## 2. 📧 Notificaciones y Alertas

### Descripción
Avisar a usuarios sobre cambios importantes en el sistema.

### Features Propuestas
- [ ] **Email:** Docentes reciben sus horarios generados
- [ ] **Email:** Coordinadores alertados de conflictos detectados
- [ ] **Push notifications:** En navegador cuando hay cambios
- [ ] **Webhooks:** Integración con teams/slack

### Ejemplo de Flujo
```
[Evento] Horarios Generados
    ↓
[Sistema] Detecta cambios
    ↓
[Envío] Email a docentes: "Tus horarios para 2026-1"
    ↓
[Notificación] Push al coordinador: "Generación completada, 0 conflictos"
```

### Estimación
- **Esfuerzo:** 4-5 días
- **Dependencias:** SMTP, Backend tasks (Celery)
- **Riesgo:** Bajo-Medio

### Beneficio
- 📬 Usuarios informados en tiempo real
- ✉️ Reduce necesidad de checks manuales

---

## 3. ♿ Accesibilidad (WCAG 2.1)

### Descripción
Cumplir estándares de accesibilidad web.

### Features Propuestas
- [ ] **Alt text** en todas las imágenes
- [ ] **Labels** en todos los inputs
- [ ] **ARIA attributes** en componentes complejos
- [ ] **Keyboard navigation** - Navegar sin mouse
- [ ] **Screen reader support** - Compatible con NVDA, JAWS
- [ ] **Color contrast** - AA o AAA según WCAG
- [ ] **Focus management** - Indicadores visuales claros

### Testing
```bash
# Tools sugeridas
- axe DevTools (browser extension)
- WAVE (web accessibility evaluation)
- Lighthouse (Chrome DevTools)
```

### Estimación
- **Esfuerzo:** 5-7 días
- **Dependencias:** Frontend (Radix UI ya es accessible)
- **Riesgo:** Bajo

### Beneficio
- ♿ Inclusión de usuarios con discapacidades
- ⚖️ Cumplimiento legal (ADA, AODA)

---

## 4. 📊 Reportes y Exportación

### Descripción
Generar reportes en múltiples formatos.

### Features Propuestas
- [ ] **PDF:** Horarios por grupo, docente, aula
- [ ] **Excel:** Datos crudos para análisis
- [ ] **CSV:** Integración con otros sistemas
- [ ] **Impresión:** Versión print-friendly
- [ ] **Estadísticas:** % cobertura, conflictos, horas/docente

### Ejemplo de Reportes

**Reporte 1: Horario por Grupo**
```
Grupo: ISC-1A
Semestre: 1
Turno: Matutino

Lunes:
  07:00-09:00 | Matemáticas I | Prof. Carlos | Aula A101
  09:00-11:00 | Física I      | Prof. Ana    | Aula A102

Martes:
  ...
```

**Reporte 2: Disponibilidad vs Uso**
```
Docente: Carlos Mendoza
Disponible: 40 horas/semana (L-V, 07:00-13:00)
Asignado: 12 horas/semana (3 clases x 4 horas)
Utilización: 30%
```

### Estimación
- **Esfuerzo:** 6-8 días
- **Dependencias:** python-pptx, openpyxl, reportlab
- **Riesgo:** Bajo

### Beneficio
- 📄 Reportería para administración
- 🔄 Integración con otros sistemas

---

# P1 — ALTA PRIORIDAD (Semanas 10-11)

## 5. 🔄 Versioning y Auditoría

### Descripción
Historial completo de cambios y quién los hizo.

### Features Propuestas
- [ ] **Audit log:** Tabla con quién cambió qué y cuándo
- [ ] **Version history:** Snapshots de horarios anteriores
- [ ] **Rollback:** Revertir a una versión anterior completa
- [ ] **Diff viewer:** Ver qué cambió entre versiones

### Ejemplo
```
2026-03-02 15:30 | coordinador@utec | Generó horarios para 2026-1 | 130 sesiones
2026-03-02 14:15 | coordinador@utec | Creó materia MAT-101 | Matemáticas I
2026-03-02 13:00 | admin@utec      | Activó docente DOC-005 | Javier Hernández
```

### Estimación
- **Esfuerzo:** 5-6 días (ya hay snapshot_service.py base)
- **Dependencias:** Frontend (tabla de logs)
- **Riesgo:** Bajo

### Beneficio
- 🔍 Trazabilidad completa
- ⏮️ Capacidad de rollback
- 📑 Cumplimiento auditoría

---

## 6. 🎓 Preferencias de Docentes

### Descripción
Docentes pueden indicar sus preferencias de horario.

### Features Propuestas
- [ ] **Preferencias no obligatorias:**
  - Horas preferidas (7-10, 13-16, etc)
  - Días preferidos (solo M-V, no S)
  - No más de X horas consecutivas
  - Bloque de tiempo libre (almuerzo, etc)

- [ ] **Algoritmo mejorado:**
  - Generación respeta preferencias cuando es posible
  - Si hay conflicto, lo reporta

### Ejemplo
```
Carlos Mendoza:
- Preferencia: Evitar antes de 8:00
- Preferencia: Máximo 8 horas/día
- Restricción: Viernes libre para coordinación

Sistema genera:
✅ Todas sus clases 8:00+
✅ Máximo 8h/día respetado
✅ Viernes sin clases
```

### Estimación
- **Esfuerzo:** 7-9 días
- **Dependencias:** Algorithm, Frontend (form de preferencias)
- **Riesgo:** Medio (algoritmo complejo)

### Beneficio
- 😊 Mayor satisfacción de docentes
- ⚖️ Mejor balance carga horaria

---

## 7. 🏢 Multi-Campus / Multi-Ciclo

### Descripción
Soportar múltiples sedes simultáneamente.

### Features Propuestas
- [ ] **Selector de campus** en navegación
- [ ] **Datos separados por campus**
- [ ] **Ciclo escolar variable** (2026-1, 2026-2, 2026-V)
- [ ] **Reportes por campus**

### Estructura
```
Sistema
├── Campus A (San Salvador)
│   ├── 2026-1
│   │   ├── 25 docentes
│   │   ├── 45 materias
│   │   └── 100+ horarios
│   └── 2026-2
│
└── Campus B (Santa Ana)
    ├── 2026-1
    └── 2026-2
```

### Estimación
- **Esfuerzo:** 8-10 días
- **Dependencias:** Database schema (campus_id everywhere)
- **Riesgo:** Medio-Alto

### Beneficio
- 🏢 Escalabilidad institucional
- 📂 Separación de datos

---

# P2 — MEDIA PRIORIDAD (Semanas 12-14)

## 8. 🤖 Inteligencia Artificial y Optimización

### Descripción
Mejorar automáticamente los horarios generados.

### Features Propuestas
- [ ] **Smart recommendations:**
  - "Agrupa clases de mismo grupo en misma aula si es posible"
  - "Minimiza tiempo muerto entre clases"
  - "Evita 'días vacíos' múltiples para docentes"

- [ ] **Predictive analytics:**
  - "Riesgo del 30% de conflicto_si se agrega esta clase"
  - "Con Carlos ocupado, capacidad de María es insuficiente"

- [ ] **ML models:**
  - Prediction de conflictos
  - Clustering de horarios óptimos
  - Recomendaciones de cambios

### Ejemplo
```
Sistema detecta:
- Grupo ISC-1A solo tiene clases lunes, miércoles, viernes
- Propone: "Agregar clase los martes para mejor distribución"

Sistema sugiere:
- Reemplazar aula A101 con B102 (más cerca de docente)
- Estimado 5 min menos de transito promedio
```

### Estimación
- **Esfuerzo:** 12-15 días
- **Dependencias:** scikit-learn, pandas, modelo training
- **Riesgo:** Alto

### Beneficio
- 🤖 Horarios más optimizados
- 📈 Menos intervención manual

---

## 9. 📱 Aplicación Móvil

### Descripción
Acceso a horarios desde smartphone.

### Features Propuestas
- [ ] **App nativa iOS** (React Native)
- [ ] **App nativa Android** (React Native)
- [ ] **Features:**
  - Ver mi horario
  - Recordatorios de cambios
  - Push notifications
  - Disponibilidad móvil (offline)

### Estimación
- **Esfuerzo:** 15-20 días
- **Dependencias:** React Native, API backend
- **Riesgo:** Medio

### Beneficio
- 📲 Acceso en cualquier lugar
- 🔔 Notificaciones móviles

---

## 10. 💬 Chat y Comunicación

### Descripción
Coordinadores pueden comunicarse con docentes directamente.

### Features Propuestas
- [ ] **Chat interno** entre coordinador y docente
- [ ] **Notificaciones** de nuevos mensajes
- [ ] **Historial** de conversaciones
- [ ] **Compartir archivos** (documentos, ajustes)

### Caso de Uso
```
Coordinadora: "Carlos, ¿puedes cambiar Matemática I a viernes?"
Carlos: "Sí, si es después de 12:00 porque tengo reunión matutina"
Coordinadora: "Perfecto, cambio a 13:00"
```

### Estimación
- **Esfuerzo:** 8-10 días
- **Dependencias:** WebSockets, Frontend (chat UI)
- **Riesgo:** Bajo

### Beneficio
- 💬 Comunicación sin email
- ⚡ Resolución rápida de conflicts

---

# P3 — BAJA PRIORIDAD (Backlog abierto)

## 11. 📍 Ubicación y Navegación

### Descripción
Mapa del campus dentro del sistema.

### Features
- [ ] Mapa interactivo del campus
- [ ] Ubicación de cada aula
- [ ] Ruta (A101 → B202) con tiempo estimado
- [ ] AR (Realidad Aumentada) para navegación

---

## 12. 🌐 Integración Sistemas Externos

### Descripción
Conectar con otros sistemas de la universidad.

### Features
- [ ] **SIS (Sistema de Información Estudiantil):**
  - Sincronizar grupos automáticamente
  - Importar docentes validado
  - Exportar horarios finales

- [ ] **Moodle:**
  - Crear cursos automáticamente
  - Enrollar estudiantes
  - Sincronizar horarios

- [ ] **Google Workspace:**
  - Crear eventos en Google Calendar
  - Compartir con docentes automáticamente

- [ ] **SAP, Oracle, Banner**
  - Integración data warehouse

---

## 13. 📈 Business Intelligence

### Descripción
Dashboards y análisis profundos.

### Features
- [ ] **KPIs:**
  - % utilización de aulas
  - % disponibilidad docentes utilizada
  - Promedio horas/docente
  - Conflictos históricos

- [ ] **Dashboards interactivos** (Tableau, Power BI)
- [ ] **Trends:** Cómo cambió capacidad año a año
- [ ] **Predictive:** Necesidad futura de aulas

---

## 14. 🎨 Personalización de Tema

### Descripción
Permitir customización visual.

### Features
- [ ] Tema oscuro / claro
- [ ] Colores corporativos UTEC
- [ ] Logos personalizados
- [ ] Fuentes institucionales

---

# 📊 Matriz de Priorización

| ID | Feature | Prioridad | Esfuerzo | Impacto | Dependencias |
|----|---------|-----------|----------|---------|--------------|
| 1 | Autenticación Avanzada | P0 | 5-7 días | 🟢 Alto | Backend |
| 2 | Notificaciones | P0 | 4-5 días | 🟢 Alto | Email service |
| 3 | Accesibilidad | P0 | 5-7 días | 🟢 Alto | Frontend |
| 4 | Reportes/Export | P0 | 6-8 días | 🟢 Alto | Libraries |
| 5 | Versioning | P1 | 5-6 días | 🟡 Medio | Snapshot base |
| 6 | Preferencias | P1 | 7-9 días | 🟡 Medio | Algorithm |
| 7 | Multi-Campus | P1 | 8-10 días | 🟡 Medio-Alto | Database |
| 8 | IA/Optimización | P2 | 12-15 días | 🟢 Alto | ML libs |
| 9 | App Móvil | P2 | 15-20 días | 🟡 Medio | React Native |
| 10 | Chat | P2 | 8-10 días | 🟡 Medio | WebSockets |

---

# 🗺️ Hoja de Ruta (Roadmap)

## Timeline Propuesto

```
AHORA (Semana 7)
├── MVP v1.0 FINALIZADO ✅
│   ├── Generación horarios
│   ├── Detección conflictos
│   └── UI funcional

PRÓXIMAS 2-3 SEMANAS (v1.1)
├── P0 (Autenticación, Notificaciones, Reportes, Accesibilidad)
└── Roadmap público
    └── "Próximamente: Preferencias de docentes"

PRÓXIMO TRIMESTRE (v1.2)
├── P1 (Versioning, Preferencias, Multi-Campus)
├── Feedback de usuarios
└── Ajustes basados en uso

3-6 MESES (v2.0)
├── P2 (IA, Mobile)
├── Integraciones SIS
└── Business Intelligence
```

---

# 📋 Criterios para Incluir Feature en Backlog

Cada feature en este documento fue evaluada con:

- ✅ **Out of Scope Justificado:** "No es necesario para v1.0 MVP"
- ✅ **Viabilidad confirmada:** "Es técnicamente posible"
- ✅ **Impacto positivo:** "Añade valor probado"
- ✅ **Estimación realista:** "Equipo puede hacerlo en X días"

---

# 📞 Proceso de Votación

### Cómo se decide qué feature es siguiente?

1. **Equipo elige TOP 3 de P1** (máximo 3 semanas de trabajo)
2. **Se valida con stakeholders** (¿Es realmente necesario?)
3. **Se planifica detalladamente** (Historias de usuario específicas)
4. **Se implementa en sprint** (Usualmente 2 semanas)
5. **Se integra a main** después de code review

---

# 🎯 Conclusión

Este backlog es **vivo** y evoluciona.

**Cada mes se revisará:**
- P0 features completadas → Marquen como done ✅
- P1 features a mover → Priorizan según feedback real
- Nuevos features → Se validan y agregan

**El éxito del sistema dependerá de:**
1. MVP v1.0 bien hecho (✅ DONE)
2. Feedback de usuarios reales (próximas 2 semanas)
3. Iteración rápida basada en feedback

---

**Documento versión:** 1.0  
**Fecha creación:** 2026-03-02  
**Próxima revisión:** 2026-04-02
