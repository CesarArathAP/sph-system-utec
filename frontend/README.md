# SPH System UTEC — Frontend

Frontend Astro + React para el Sistema de Programación de Horarios (SPH) de UTEC.

**🌐 Sitio Desplegado:** https://sph-system-utec.netlify.app

## 📋 Descripción

Cliente web para la generación automática de horarios académicos. Permite:
- Gestión de docentes, materias, grupos y aulas
- Definición de disponibilidad docente
- Generación automática de horarios sin conflictos
- Visualización de horarios por docente/grupo/aula
- Versionado y rollback de horarios

## 🛠 Stack Técnico

- **Framework:** Astro (meta-framework)
- **Componentes:** React 18+
- **Lenguaje:** TypeScript 5.0+
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **HTTP Client:** Fetch API

## 🚀 Inicio Rápido

### Desarrollo Local
```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:4321

### Build Producción
```bash
npm run build
npm run preview
```

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

---

## 🌐 Despliegue en Netlify

El frontend está configurado para desplegarse automáticamente en Netlify.

### Sitio Actual
- **URL:** https://sph-system-utec.netlify.app
- **Rama:** `develop` (auto-deploy)

### Configuración

**Archivo:** `netlify.toml`
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"
```

### Variables de Ambiente

En Netlify, configura la variable `PUBLIC_API_BASE_URL`:

```
Netlify Dashboard → Site settings → Build & deploy → Environment

PUBLIC_API_BASE_URL=https://tu-backend.com/api/v1
```

**En desarrollo** (local):
- Automáticamente usa `http://localhost:8000/api/v1`

**En producción** (Netlify):
- Usa la variable `PUBLIC_API_BASE_URL` configurada

### Flujo de Deploy

1. **Cambios en código**
   ```bash
   git add frontend/...
   git commit -m "feat: descripción"
   git push origin develop
   ```

2. **Netlify auto-deploy**
   - Detectar push a `develop`
   - Ejecutar `npm run build`
   - Desplegar a https://sph-system-utec.netlify.app

3. **Mergear a main** (cuando está listo para producción)
   ```bash
   # En GitHub: Create Pull Request develop → main
   # Merge y celebrar 🎉
   ```

### Credenciales de Prueba

```
Admin:
- Email: admin@utec.edu.sv
- Password: admin123

Coordinador:
- Email: coordinador@utec.edu.sv
- Password: coord123
```

### Troubleshooting

**Error: "Cannot find PUBLIC_API_BASE_URL"**
- Verifica que `src/services/config.ts` use `import.meta.env.PUBLIC_API_BASE_URL`
- Configura la variable en Netlify Dashboard

**Error: "API connection failed"**
- Verifica que el backend está disponible (no es localhost)
- Revisa CORS en backend (debe incluir tu URL de Netlify)
