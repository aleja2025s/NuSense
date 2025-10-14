#!/bin/bash
# 🚀 NuSense AIgent - Script de Inicio Rápido

echo "🚀 Iniciando NuSense AIgent..."
echo "=============================="
echo ""
echo "🌐 URL: http://localhost:8000"
echo "👤 Usuario: admin | Contraseña: Nu2024*"
echo "👤 Usuario: agente | Contraseña: Nu2024"
echo ""
echo "📱 Para detener: Presiona Ctrl+C"
echo "🔄 Para reiniciar: Ejecuta este script nuevamente"
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no encontrado."
    echo "📥 Instala Python desde: https://python.org/downloads"
    exit 1
fi

# Verificar archivos
if [ ! -f "login.html" ]; then
    echo "❌ Archivos no encontrados."
    echo "📁 Ejecuta desde el directorio correcto de NuSense."
    exit 1
fi

echo "✅ Todo listo. Abriendo navegador..."

# Abrir navegador automáticamente (funciona en Mac/Linux/Windows)
sleep 2 && {
    if command -v open &> /dev/null; then
        open "http://localhost:8000"  # macOS
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8000"  # Linux
    elif command -v start &> /dev/null; then
        start "http://localhost:8000"  # Windows
    fi
} &

# Iniciar servidor
echo "🚀 Servidor iniciado en http://localhost:8000"
echo ""
python3 -m http.server 8000
