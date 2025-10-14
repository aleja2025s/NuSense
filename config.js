// === CONFIGURACIÓN COLOMBIANA CORREGIDA ===
const CONFIG = {
    // Información de casos actualizada para Colombia
    CASE_TYPES: {
        'INSCRIPCION_Y_REGISTRO': {
            title: '📋 INSCRIPCIÓN Y REGISTRO',
            informacion_clave: [
                'Proceso de registro: Validación de identidad, datos personales y documentos',
                'Requisitos: Cédula de Ciudadanía vigente, información personal completa',
                'Tiempo estimado: 5-10 minutos para completar registro',
                'Validación: Puede tomar 24-48 horas hábiles'
            ],
            respuestas_comunes: [
                'Te ayudo con el proceso de registro paso a paso',
                'Los documentos necesarios son Cédula de Ciudadanía o Extranjería vigente',
                'El proceso de validación toma entre 24-48 horas hábiles'
            ],
            puntos_importantes: [
                'Verificar que la foto del documento sea clara y legible',
                'Comprobar que los datos coincidan exactamente',
                'Explicar proceso de validación si hay demoras'
            ],
            documentos_aceptados: [
                'Cédula de Ciudadanía (vigente)',
                'Cédula de Extranjería (vigente)',
                'Pasaporte (vigente)'
            ]
        }
    },
    
    // Estados emocionales para personalizar respuestas
    EMOTIONAL_STATES: {
        'neutro': {
            emoji: '😐',
            tone: 'neutral',
            greeting: 'Estimado cliente,\n\nGracias por contactarte con Nu.'
        },
        'confundido': {
            emoji: '😕',
            tone: 'helpful',
            greeting: 'Estimado cliente,\n\nEntiendo que puedas tener dudas, con gusto te ayudo a aclarar todo.'
        },
        'molesto': {
            emoji: '😠',
            tone: 'empathetic',
            greeting: 'Estimado cliente,\n\nEntiendo tu molestia y lamento cualquier inconveniente. Permíteme ayudarte de manera específica.'
        },
        'satisfecho': {
            emoji: '😊',
            tone: 'positive',
            greeting: 'Estimado cliente,\n\n¡Qué bueno saber de ti! Con gusto continúo ayudándote.'
        },
        'preocupado': {
            emoji: '😟',
            tone: 'reassuring',
            greeting: 'Estimado cliente,\n\nComprendo tu preocupación y quiero tranquilizarte proporcionándote toda la información necesaria.'
        }
    },
    
    // Tipos de contacto
    CONTACT_TYPES: {
        'registro': 'Registro/Validación',
        'documentos': 'Documentación',
        'datos': 'Política de Datos',
        'retiros': 'Consulta Financiera',
        'soporte': 'Soporte Técnico',
        'general': 'Consulta General'
    }
};

// Función para override de contenido hardcoded
function overrideHardcodedContent() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                document.querySelectorAll('*').forEach(el => {
                    if (el.textContent && el.textContent.includes('INE vigente')) {
                        el.textContent = el.textContent
                            .replace(/INE vigente/g, 'Cédula de Ciudadanía vigente')
                            .replace(/comprobante de ingresos/g, 'información personal completa')
                            .replace(/CURP/g, 'Cédula de Extranjería (si aplica)');
                        
                        if (el.innerHTML) {
                            el.innerHTML = el.innerHTML
                                .replace(/INE vigente/g, 'Cédula de Ciudadanía vigente')
                                .replace(/comprobante de ingresos/g, 'información personal completa')
                                .replace(/CURP/g, 'Cédula de Extranjería (si aplica)');
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Ejecutar override cuando carga la página
document.addEventListener('DOMContentLoaded', overrideHardcodedContent);
