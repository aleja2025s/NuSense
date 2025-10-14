# 🧠 NuSense AIgent - Versión Mejorada

## 📋 Descripción
Herramienta inteligente para servicio al cliente de Nu, optimizada para Colombia con información correcta y funcionalidades mejoradas.

## ✨ Características Principales

### 🎯 **Información Corregida**
- **Documentos**: Cédula de Ciudadanía/Extranjería en lugar de INE
- **Requisitos**: Adaptados a la legislación colombiana
- **Macros**: Base de datos actualizada con información relevante

### 🚀 **Funcionalidades Mejoradas**
- **Captura inteligente de contexto**: Detecta automáticamente la situación del cliente
- **Selección de macros contextual**: Sugiere macros relevantes según el contexto
- **Generación de respuestas híbridas**: Combina IA + macro + contexto específico
- **Estados emocionales**: Ajusta el tono según el estado del cliente
- **Interfaz optimizada**: Diseño compacto y responsivo

### 📊 **Sistema de Macros**
- **Base de datos CSV**: Macros organizadas por tipo y categoría
- **Búsqueda inteligente**: Encuentra macros por palabras clave
- **Puntuación de relevancia**: Ordena macros por pertinencia al contexto

## 🛠️ Instalación y Uso

### 1️⃣ **Estructura de Archivos**
```
NuSense-AIgent-Mejorado/
├── index.html          # Página principal
├── styles.css          # Estilos optimizados
├── config.js           # Configuración colombiana
├── macros-data.js      # Base de datos de macros
├── app.js              # Lógica principal
├── MACROSACQ-Macros.csv # Archivo CSV de macros
└── README.md           # Este archivo
```

### 2️⃣ **Cómo Usar**
1. **Abrir** `index.html` en el navegador
2. **Escribir contexto** del cliente en el área correspondiente
3. **Seleccionar estado emocional** (neutro, molesto, preocupado, etc.)
4. **Elegir macro relevante** de las sugerencias automáticas
5. **Generar respuesta** con el botón "Generar Respuesta con IA"
6. **Copiar respuesta** completa para usar con el cliente

## 🔧 Configuraciones

### 📄 **Documentos Aceptados (Colombia)**
- Cédula de Ciudadanía (vigente)
- Cédula de Extranjería (vigente)
- Pasaporte (vigente)

### 😊 **Estados Emocionales**
- **😐 Neutro**: Tono profesional estándar
- **😕 Confundido**: Tono explicativo y didáctico
- **😠 Molesto**: Tono empático y resolutivo
- **😊 Satisfecho**: Tono positivo y amigable
- **😟 Preocupado**: Tono tranquilizador y detallado

### 📋 **Tipos de Macros**
- **ACQ**: Atención al cliente general
- **MGM**: Programas de referidos
- **Registro**: Procesos de inscripción
- **Financiero**: Consultas monetarias
- **Datos**: Política de privacidad

## 🚀 Diferencias con la Versión Original

### ❌ **Problemas Solucionados**
- Información de México → Información de Colombia
- Respuestas genéricas → Respuestas contextuales
- Macros desconectadas → Macros integradas con IA
- Diseño no responsivo → Interfaz adaptativa
- Texto invisible → Contrastes corregidos

### ✅ **Mejoras Implementadas**
- **Override automático**: Corrige información hardcoded
- **Interceptor de respuestas**: Mejora automática de respuestas
- **Sistema híbrido**: Combina IA + macro + contexto
- **Responsive design**: Funciona en cualquier tamaño de pantalla
- **Base de conocimiento**: Macros organizadas y searchables

## 🔄 Flujo de Trabajo Mejorado

1. **📝 Contexto** → Sistema captura automáticamente
2. **🎯 Identificación** → Detecta tipo de caso y emoción
3. **📋 Macros** → Sugiere macros relevantes automáticamente
4. **🤖 Generación** → Combina todo en respuesta coherente
5. **✅ Resultado** → Respuesta completa lista para usar

## 📞 Soporte Técnico

Para modificaciones adicionales o problemas:
- Revisar archivos de configuración (`config.js`)
- Actualizar base de macros (`macros-data.js`)
- Modificar estilos en (`styles.css`)

## 🎯 Próximas Mejoras

- [ ] Integración con API real de IA
- [ ] Sistema de plantillas personalizables
- [ ] Analytics de uso de macros
- [ ] Modo offline con cache local
- [ ] Exportar conversaciones completas

---

**Versión**: 2.0 Mejorada Colombia  
**Última actualización**: $(date)  
**Compatibilidad**: Chrome, Firefox, Safari, Edge
