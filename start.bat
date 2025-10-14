@echo off
REM 🚀 NuSense AIgent - Script de Inicio para Windows

echo 🚀 Iniciando NuSense AIgent...
echo ==============================
echo.
echo 🌐 URL: http://localhost:8000
echo 👤 Usuario: admin ^| Contraseña: Nu2024*
echo 👤 Usuario: agente ^| Contraseña: Nu2024
echo.
echo 📱 Para detener: Presiona Ctrl+C
echo 🔄 Para reiniciar: Ejecuta este script nuevamente
echo.

REM Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python no encontrado.
    echo 📥 Instala Python desde: https://python.org/downloads
    pause
    exit /b 1
)

REM Verificar archivos
if not exist "login.html" (
    echo ❌ Archivos no encontrados.
    echo 📁 Ejecuta desde el directorio correcto de NuSense.
    pause
    exit /b 1
)

echo ✅ Todo listo. Abriendo navegador...

REM Abrir navegador automáticamente
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000"

REM Iniciar servidor
echo 🚀 Servidor iniciado en http://localhost:8000
echo.
python -m http.server 8000
