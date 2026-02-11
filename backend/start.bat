@echo off
echo ========================================
echo   SPH System - Backend Server
echo ========================================
echo.

REM Activar entorno virtual
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo [OK] Entorno virtual activado
) else (
    echo [ERROR] No se encontro el entorno virtual
    echo Por favor ejecuta: python -m venv venv
    pause
    exit /b 1
)

echo.
echo Iniciando servidor FastAPI...
echo Servidor disponible en: http://localhost:8000
echo Documentacion en: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
