// === APLICACIÓN PRINCIPAL NUSENSE AIGENT ===
class NuSenseApp {
    constructor() {
        this.currentContext = '';
        this.currentEmotion = 'neutro';
        this.selectedMacro = null;
        this.caseType = '';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadMacros();
        this.startContextMonitoring();
        console.log('✅ NuSense AIgent inicializado');
    }
    
    setupEventListeners() {
        // Captura de contexto
        const contextInput = document.getElementById('client-context-input');
        if (contextInput) {
            contextInput.addEventListener('input', (e) => {
                this.currentContext = e.target.value;
                this.updateStatus();
                this.loadRelevantMacros();
            });
        }
        
        const mainContextInput = document.getElementById('main-context-input');
        if (mainContextInput) {
            mainContextInput.addEventListener('input', (e) => {
                this.currentContext = e.target.value;
                this.updateStatus();
                this.loadRelevantMacros();
            });
        }
        
        // Selección de emociones
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.currentEmotion = e.target.dataset.emotion;
                this.updateStatus();
            });
        });
        
        // Generar respuesta IA
        const generateBtn = document.getElementById('generate-ia-response');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateIAResponse());
        }
        
        // Mejorar respuesta
        const improveBtn = document.getElementById('improve-response');
        if (improveBtn) {
            improveBtn.addEventListener('click', () => this.improveResponse());
        }
        
        // Vista previa
        const previewBtn = document.getElementById('preview-response');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showPreview());
        }
        
        // Limpiar datos
        const clearBtn = document.getElementById('clear-all-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllData());
        }
        
        // Copiar respuesta
        const copyBtn = document.getElementById('copy-response');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyResponse());
        }
    }
    
    loadMacros() {
        const macrosContainer = document.getElementById('related-macros');
        if (!macrosContainer) return;
        
        let macrosHTML = '';
        MACROS_DB.forEach(macro => {
            macrosHTML += `
            <div class="macro-item" onclick="nuSenseApp.selectMacro('${macro.id}')">
                <div class="macro-title">${macro.title}</div>
                <div class="macro-content">${macro.content.substring(0, 100)}...</div>
                <div class="macro-actions">
                    <button onclick="nuSenseApp.copyMacro('${macro.id}')">📋 Copiar</button>
                    <button onclick="nuSenseApp.useMacro('${macro.id}')">✅ Usar</button>
                </div>
            </div>`;
        });
        
        macrosContainer.innerHTML = macrosHTML;
    }
    
    loadRelevantMacros() {
        if (!this.currentContext) return;
        
        const relevantMacros = findRelevantMacros(this.currentContext, this.currentEmotion);
        const macrosContainer = document.getElementById('related-macros');
        
        if (!macrosContainer || relevantMacros.length === 0) return;
        
        let macrosHTML = '';
        relevantMacros.forEach(macro => {
            macrosHTML += `
            <div class="macro-item" onclick="nuSenseApp.selectMacro('${macro.id}')">
                <div class="macro-title">${macro.title} (${macro.relevanceScore} pts)</div>
                <div class="macro-content">${macro.content.substring(0, 100)}...</div>
                <div class="macro-actions">
                    <button onclick="nuSenseApp.copyMacro('${macro.id}')">📋 Copiar</button>
                    <button onclick="nuSenseApp.useMacro('${macro.id}')">✅ Usar</button>
                </div>
            </div>`;
        });
        
        macrosContainer.innerHTML = macrosHTML;
    }
    
    selectMacro(macroId) {
        this.selectedMacro = MACROS_DB.find(m => m.id === macroId);
        
        const macroDisplay = document.getElementById('macro-display');
        if (macroDisplay && this.selectedMacro) {
            macroDisplay.textContent = this.selectedMacro.title.substring(0, 50) + '...';
        }
        
        this.updateStatus();
    }
    
    useMacro(macroId) {
        this.selectMacro(macroId);
        if (this.currentContext && this.selectedMacro) {
            this.generateContextualResponse();
        } else {
            alert('⚠️ Completa el contexto del cliente primero');
        }
    }
    
    copyMacro(macroId) {
        const macro = MACROS_DB.find(m => m.id === macroId);
        if (macro) {
            navigator.clipboard.writeText(macro.content);
            alert('📋 Macro copiada al portapapeles');
        }
    }
    
    generateIAResponse() {
        if (!this.currentContext) {
            alert('⚠️ Ingresa el contexto del cliente primero');
            return;
        }
        
        if (this.selectedMacro) {
            this.generateContextualResponse();
        } else {
            this.generateBasicResponse();
        }
    }
    
    generateContextualResponse() {
        const response = generateMacroBasedResponse(
            this.currentContext, 
            this.selectedMacro, 
            this.currentEmotion
        );
        
        this.displayResponse(response);
    }
    
    generateBasicResponse() {
        const emotionalState = CONFIG.EMOTIONAL_STATES[this.currentEmotion];
        let response = emotionalState.greeting + '\n\n';
        
        response += `He revisado tu consulta: ${this.currentContext}\n\n`;
        
        // Detectar tipo de consulta y dar respuesta apropiada
        if (this.currentContext.toLowerCase().includes('registro') || 
            this.currentContext.toLowerCase().includes('documento')) {
            response += `**Para el proceso de registro necesitas:**\n\n`;
            response += `✅ **Documentos aceptados:**\n`;
            response += `• Cédula de Ciudadanía (vigente)\n`;
            response += `• Cédula de Extranjería (vigente)\n`;
            response += `• Pasaporte (vigente)\n\n`;
            response += `El proceso de validación toma 24-48 horas hábiles.\n\n`;
        } else {
            response += `Con gusto te ayudo con tu consulta. Para brindarte información más específica, `;
            response += `selecciona una de las macros relacionadas que aparecen abajo.\n\n`;
        }
        
        response += `¿Hay algo más específico en lo que pueda ayudarte?\n\n`;
        response += `**Tipo de Contacto:** Consulta General\n`;
        response += `**Generado:** ${new Date().toLocaleString()}`;
        
        this.displayResponse(response);
    }
    
    displayResponse(response) {
        const responseArea = document.getElementById('ia-generated-response');
        if (responseArea) {
            responseArea.innerHTML = response.replace(/\n/g, '<br>');
            responseArea.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    improveResponse() {
        const responseArea = document.getElementById('ia-generated-response');
        if (!responseArea || !responseArea.textContent) {
            alert('⚠️ Genera una respuesta primero');
            return;
        }
        
        if (this.selectedMacro && this.currentContext) {
            // Mejorar con más detalles
            let improvedResponse = generateMacroBasedResponse(
                this.currentContext, 
                this.selectedMacro, 
                this.currentEmotion
            );
            
            // Agregar sección adicional
            improvedResponse += '\n\n**📞 Información adicional:**\n';
            improvedResponse += '• Nuestro equipo está disponible para acompañarte\n';
            improvedResponse += '• Si tienes dudas, no dudes en contactarnos nuevamente\n';
            improvedResponse += '• Conserva este mensaje para tu referencia';
            
            this.displayResponse(improvedResponse);
        } else {
            alert('⚠️ Selecciona una macro para mejorar la respuesta');
        }
    }
    
    showPreview() {
        if (this.currentContext && this.selectedMacro) {
            const preview = generateMacroBasedResponse(
                this.currentContext, 
                this.selectedMacro, 
                this.currentEmotion
            );
            
            alert(`Vista Previa:\n\n${preview.substring(0, 300)}...`);
        } else {
            alert('⚠️ Completa la información primero');
        }
    }
    
    copyResponse() {
        const responseArea = document.getElementById('ia-generated-response');
        if (responseArea && responseArea.textContent) {
            const textContent = responseArea.textContent;
            navigator.clipboard.writeText(textContent);
            alert('✅ Respuesta copiada al portapapeles');
        } else {
            alert('⚠️ No hay respuesta para copiar');
        }
    }
    
    clearAllData() {
        this.currentContext = '';
        this.currentEmotion = 'neutro';
        this.selectedMacro = null;
        this.caseType = '';
        
        // Limpiar inputs
        const contextInput = document.getElementById('client-context-input');
        const mainContextInput = document.getElementById('main-context-input');
        const responseArea = document.getElementById('ia-generated-response');
        
        if (contextInput) contextInput.value = '';
        if (mainContextInput) mainContextInput.value = '';
        if (responseArea) responseArea.innerHTML = 'Haz clic en "Generar Respuesta con IA" para crear una respuesta contextual...';
        
        // Resetear displays
        const caseTypeDisplay = document.getElementById('case-type-display');
        const macroDisplay = document.getElementById('macro-display');
        
        if (caseTypeDisplay) caseTypeDisplay.textContent = 'Selecciona en "Identificar tema del caso"';
        if (macroDisplay) macroDisplay.textContent = 'Selecciona una macro';
        
        // Resetear emociones
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector('[data-emotion="neutro"]')?.classList.add('selected');
        
        this.updateStatus();
        this.loadMacros(); // Cargar todas las macros
    }
    
    updateStatus() {
        const statusDiv = document.getElementById('status-indicator');
        if (!statusDiv) return;
        
        const hasContext = this.currentContext.trim().length > 0;
        const hasMacro = this.selectedMacro !== null;
        
        if (hasContext && hasMacro) {
            statusDiv.innerHTML = '✅ Listo para generar respuesta completa';
            statusDiv.className = 'status-success';
        } else if (hasContext) {
            statusDiv.innerHTML = '⚠️ Selecciona una macro para respuesta específica';
            statusDiv.className = 'status-warning';
        } else {
            statusDiv.innerHTML = '❌ Ingresa el contexto del cliente';
            statusDiv.className = 'status-error';
        }
    }
    
    startContextMonitoring() {
        // Monitorear cambios cada 2 segundos
        setInterval(() => {
            this.captureContextFromPage();
        }, 2000);
    }
    
    captureContextFromPage() {
        // Capturar contexto de diferentes fuentes en la página
        const mainInput = document.getElementById('main-context-input');
        const contextInput = document.getElementById('client-context-input');
        
        if (mainInput && mainInput.value && mainInput.value !== this.currentContext) {
            this.currentContext = mainInput.value;
            if (contextInput) contextInput.value = this.currentContext;
            this.updateStatus();
            this.loadRelevantMacros();
        }
        
        if (contextInput && contextInput.value && contextInput.value !== this.currentContext) {
            this.currentContext = contextInput.value;
            if (mainInput) mainInput.value = this.currentContext;
            this.updateStatus();
            this.loadRelevantMacros();
        }
    }
}

// Función global para minimizar panel
function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    const button = panel.querySelector('.minimize-btn');
    
    if (panel.style.height === '60px') {
        panel.style.height = 'auto';
        panel.style.overflow = 'visible';
        if (button) button.textContent = '−';
    } else {
        panel.style.height = '60px';
        panel.style.overflow = 'hidden';
        if (button) button.textContent = '+';
    }
}

// Inicializar aplicación cuando carga la página
let nuSenseApp;
document.addEventListener('DOMContentLoaded', function() {
    nuSenseApp = new NuSenseApp();
});
