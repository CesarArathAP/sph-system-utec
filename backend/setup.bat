@echo off
echo ========================================
echo   SPH System - Setup Inicial
echo ========================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no esta en el PATH
    echo Por favor instala Python desde: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/4] Creando entorno virtual...
python -m venv venv
if errorlevel 1 (
    echo [ERROR] No se pudo crear el entorno virtual
    pause
    exit /b 1
)
echo [OK] Entorno virtual creado

echo.
echo [2/4] Activando entorno virtual...
call venv\Scripts\activate.bat
echo [OK] Entorno virtual activado

echo.
echo [3/4] Instalando dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

echo.
echo [4/4] Configurando variables de entorno...
if not exist .env (
    copy .env.example .env
    echo [OK] Archivo .env creado
) else (
    echo [INFO] El archivo .env ya existe
)

echo.
echo ========================================
echo   Setup completado exitosamente!
echo ========================================
echo.
echo Para iniciar el servidor ejecuta:
echo   start.bat
echo.
pause
