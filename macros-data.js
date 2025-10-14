// === BASE DE DATOS DE MACROS CORREGIDAS ===
const MACROS_DB = [
    {
        id: 'acq_registro_documentos',
        type: 'ACQ',
        category: 'Registro',
        title: '[ACQ] - Registro: Documentos necesarios',
        content: `Para el proceso de registro en Nu necesitas uno de estos documentos:

✅ **Documentos aceptados:**
• Cédula de Ciudadanía (vigente)
• Cédula de Extranjería (vigente)
• Pasaporte (vigente)

📋 **Requisitos:**
• Documento completamente legible
• Sin fechas de vencimiento
• Información personal completa

El proceso de validación toma 24-48 horas hábiles.`,
        keywords: ['registro', 'documentos', 'cédula', 'identificación'],
        emotions: ['confundido', 'molesto', 'preocupado']
    },
    
    {
        id: 'acq_retiros_exterior',
        type: 'ACQ',
        category: 'Financiero',
        title: '[ACQ] - Retiros: Uso en exterior',
        content: `Tu tarjeta débito Nu funciona internacionalmente:

💳 **Retiros en exterior:**
• Disponible en cajeros con logos Visa/Mastercard
• Se aplican comisiones según tarifario vigente
• Notifica tu viaje para evitar bloqueos por seguridad
• Límites diarios según tu perfil de cuenta

💰 **Comisiones:**
• Consulta el tarifario vigente en la app
• Tipo de cambio aplicado al momento de transacción`,
        keywords: ['retiros', 'exterior', 'viaje', 'tarjeta', 'débito'],
        emotions: ['neutro', 'preocupado']
    },
    
    {
        id: 'acq_data_policy',
        type: 'ACQ',
        category: 'Datos',
        title: '[ACQ] - Política: Tratamiento de datos',
        content: `Tu privacidad es importante para nosotros:

🔒 **Tus derechos:**
• Conocer qué datos personales tenemos
• Solicitar corrección de información incorrecta
• Solicitar eliminación (según legislación aplicable)
• Restricción del uso de tus datos

📧 **Cómo ejercer derechos:**
• Contacta a través de canales oficiales
• Presenta solicitud por escrito
• Respuesta máximo en 15 días hábiles`,
        keywords: ['datos', 'privacidad', 'información', 'derechos'],
        emotions: ['preocupado', 'molesto']
    },
    
    {
        id: 'acq_validacion_proceso',
        type: 'ACQ',
        category: 'Registro',
        title: '[ACQ] - Proceso: Validación de registro',
        content: `El proceso de validación incluye:

⏱️ **Tiempos:**
• Registro inicial: 5-10 minutos
• Validación completa: 24-48 horas hábiles
• Notificación automática al completarse

🔍 **Verificación:**
• Autenticidad del documento
• Coincidencia de datos personales
• Cumplimiento de requisitos legales`,
        keywords: ['validación', 'proceso', 'verificación', 'tiempo'],
        emotions: ['preocupado', 'confundido']
    }
];

// Función para buscar macros por contexto
function findRelevantMacros(context, emotion = '', caseType = '') {
    const contextLower = context.toLowerCase();
    const relevantMacros = [];
    
    MACROS_DB.forEach(macro => {
        let score = 0;
        
        // Puntuación por keywords
        macro.keywords.forEach(keyword => {
            if (contextLower.includes(keyword)) {
                score += 2;
            }
        });
        
        // Puntuación por emoción
        if (emotion && macro.emotions.includes(emotion)) {
            score += 1;
        }
        
        // Puntuación por categoría
        if (caseType && macro.category.toLowerCase().includes(caseType.toLowerCase())) {
            score += 1;
        }
        
        if (score > 0) {
            relevantMacros.push({
                ...macro,
                relevanceScore: score
            });
        }
    });
    
    // Ordenar por relevancia
    return relevantMacros
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 4); // Máximo 4 macros
}

// Función para generar respuesta basada en macro
function generateMacroBasedResponse(context, selectedMacro, emotion = '') {
    const emotionalState = CONFIG.EMOTIONAL_STATES[emotion] || CONFIG.EMOTIONAL_STATES['neutro'];
    let response = emotionalState.greeting + '\n\n';
    
    // Contextualizar la consulta
    if (context) {
        response += `He revisado tu situación: *${context}*\n\n`;
    }
    
    // Agregar contenido de la macro
    response += selectedMacro.content + '\n\n';
    
    // Cierre personalizado
    response += '¿Hay algo más específico en lo que pueda ayudarte?\n\n';
    
    // Metadatos
    response += `**Tipo de Contacto:** ${getContactType(selectedMacro.category)}\n`;
    response += `**Macro utilizada:** ${selectedMacro.type} - ${selectedMacro.title.split(':')[0]}\n`;
    response += `**Generado:** ${new Date().toLocaleString()}`;
    
    return response;
}

// Función auxiliar para obtener tipo de contacto
function getContactType(category) {
    const typeMap = {
        'Registro': 'Registro/Validación',
        'Financiero': 'Consulta Financiera',
        'Datos': 'Política de Datos',
        'Soporte': 'Soporte Técnico'
    };
    
    return typeMap[category] || 'Consulta General';
}
