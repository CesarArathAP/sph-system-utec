"""
Punto de entrada de la aplicación FastAPI.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base

# Importar routers (se agregarán cuando estén implementados)
# from app.api.routes import auth, docentes, materias, grupos, aulas, horarios


# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/")
async def root():
    """
    Endpoint raíz de la API.
    """
    return {
        "message": "Sistema de Planificación de Horarios - API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

# Incluir routers (se descomentarán cuando estén implementados)
# app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
# app.include_router(docentes.router, prefix=f"{settings.API_V1_STR}/docentes", tags=["docentes"])
# app.include_router(materias.router, prefix=f"{settings.API_V1_STR}/materias", tags=["materias"])
# app.include_router(grupos.router, prefix=f"{settings.API_V1_STR}/grupos", tags=["grupos"])
# app.include_router(aulas.router, prefix=f"{settings.API_V1_STR}/aulas", tags=["aulas"])
# app.include_router(horarios.router, prefix=f"{settings.API_V1_STR}/horarios", tags=["horarios"])