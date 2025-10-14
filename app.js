class NuSenseApp {
    constructor() {
        this.selectedEmotion = null;
        this.selectedTopic = null;
        this.currentResponse = null;
        this.macrosData = this.loadMacrosData();
        this.wedukasData = this.loadWedukasData();
        this.processData = this.loadProcessData();
        
        // LiteLLM Integration
        this.liteLLMClient = null;
        this.aiEnabled = false;
        this.aiStats = {
            responsesGenerated: 0,
            cacheHits: 0,
            totalResponseTime: 0,
            averageResponseTime: 0
        };        
        // Training Module Variables
        this.scenarios = [];
        this.currentScenarioIndex = 0;
        this.score = 0;
        this.agentName = '';
        this.incorrectAnswers = [];
        this.selectedAnswer = null;

        // Academy Module Variables
        this.currentCase = null;
        this.currentHumanizeCase = null;
        // Adventure Module Variables
        this.currentAdventure = null;
        this.adventureStep = 0;
        this.currentScenarioId = null;
        this.adventureStepCount = 0;
        this.clientMood = 'neutral';
        this.quizQuestions = [];
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        
        // Memory Challenge Variables
        this.currentMemoryChallenge = null;
        this.memoryChallengeType = null;
        this.memoryCases = [];
        this.currentMemoryIndex = 0;
        this.memoryScore = 0;
        this.memoryStartTime = null;
        this.memoryTimes = [];
        this.memoryTimer = null;
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.populateMacrosTable();
        this.populateWedukasGrid();
        this.displayUserGreeting();
        this.initializeLiteLLM();
        this.initializeAcademy();
        this.initializeAI(); // Inicializar IA
    }

    checkAuth() {
        // Solo verificar si estamos en app.html y no hay login
        if (window.location.pathname.includes('app.html')) {
            const isLoggedIn = localStorage.getItem('nusense_logged_in') === 'true';
            if (!isLoggedIn) {
                console.log('🔐 Redirecting to login...');
                localStorage.clear(); // Limpiar cualquier dato corrupto
                window.location.href = 'login.html';
                return false;
        }
        }
        return true;
    }

    displayUserGreeting() {
        const username = localStorage.getItem('nusense_username');
        const greetingEl = document.getElementById('userGreeting');
        greetingEl.textContent = `Hola, ${username}`;
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            console.log('🔓 Cerrando sesión...');
            localStorage.clear(); // Limpiar todo
            window.location.href = 'login.html?logout=true';
        });

        // Resources buttons
        document.getElementById('toneGuideBtn').addEventListener('click', () => {
            this.openModal('toneGuideModal');
        });

        document.getElementById('caseClassificationBtn').addEventListener('click', () => {
            this.openModal('caseClassificationModal');
        });

        document.getElementById('visualExamplesBtn').addEventListener('click', () => {
            this.openModal('visualExamplesModal');
        });

        // Emotion selection
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedEmotion = btn.dataset.emotion;
                this.updateGenerateButton();
            });
        });

        // Topic selection
        document.querySelectorAll('.topic-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedTopic = card.dataset.topic;
                this.showProcessSummary();
                this.updateGenerateButton();
            });
        });

        // Context input
        document.getElementById('contextInput').addEventListener('input', () => {
            this.updateGenerateButton();
        });

        // Generate response
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateResponse();
        });

        // Copy response
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyResponse();
        });

        // Tone adjustments
        document.querySelectorAll('.tone-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.adjustTone(btn.dataset.tone);
            });
        });

        // Search functionality
        document.getElementById('macrosSearch').addEventListener('input', (e) => {
            this.filterMacros(e.target.value);
        });

        document.getElementById('macrosFilter').addEventListener('change', (e) => {
            this.filterMacros(null, e.target.value);
        });

        document.getElementById('wedukasSearch').addEventListener('input', (e) => {
            this.filterWedukas(e.target.value);
        });

        document.getElementById('wedukasFilter').addEventListener('change', (e) => {
            this.filterWedukas(null, e.target.value);
        });
    }

    setupTabNavigation() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Update active tab button
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding tab panel
                document.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(tabId).classList.add('active');
                
                // Reset training to login screen when switching to training tab
                if (tabId === 'training') {
                    this.showTrainingScreen('login-screen');
                }
                
                // Initialize academy when switching to academy tab
                if (tabId === 'academy') {
                    this.initializeAcademy();
                }
            });
        });
    }

    updateGenerateButton() {
        const contextInput = document.getElementById('contextInput').value.trim();
        const generateBtn = document.getElementById('generateBtn');
        
        const isReady = contextInput && this.selectedEmotion && this.selectedTopic;
        generateBtn.disabled = !isReady;
    }

    showProcessSummary() {
        const summaryEl = document.getElementById('processSummary');
        const process = this.processData[this.selectedTopic];
        
        if (process) {
            summaryEl.innerHTML = `
                <h4>${process.title}</h4>
                <ul class="process-steps">
                    ${process.steps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            `;
        }
    }

    generateResponse() {
        const contextInput = document.getElementById('contextInput').value.trim();
        const responseContainer = document.getElementById('responseContainer');
        const responseText = document.getElementById('responseText');
        
        // Simulate AI response generation
        const responses = this.getResponseTemplates();
        const template = responses[this.selectedTopic] || responses.default;
        
        let response = template.replace('[CLIENTE]', 'estimado cliente');
        response = this.adjustForEmotion(response, this.selectedEmotion);
        
        responseText.textContent = response;
        responseContainer.style.display = 'block';
        this.currentResponse = response;
        
        // Scroll to response
        responseContainer.scrollIntoView({ behavior: 'smooth' });
    }

    adjustForEmotion(response, emotion) {
        const emotionAdjustments = {
            molesto: response.replace('Hola', 'Entiendo tu frustración').replace('te ayudo', 'voy a resolver esto inmediatamente'),
            preocupado: response.replace('Hola', 'Comprendo tu preocupación').replace('te ayudo', 'te voy a tranquilizar resolviendo esto'),
            confundido: response.replace('Hola', 'Te explico paso a paso').replace('te ayudo', 'te voy a guiar'),
            satisfecho: response.replace('Hola', '¡Qué bueno tenerte aquí!').replace('te ayudo', 'con gusto te ayudo'),
            neutro: response
        };
        
        return emotionAdjustments[emotion] || response;
    }

    adjustTone(toneType) {
        if (!this.currentResponse) return;
        
        let adjustedResponse = this.currentResponse;
        const responseText = document.getElementById('responseText');
        
        switch (toneType) {
            case 'corto':
                adjustedResponse = this.makeResponseShorter(adjustedResponse);
                break;
            case 'formal':
                adjustedResponse = this.makeResponseFormal(adjustedResponse);
                break;
            case 'empatico':
                adjustedResponse = this.makeResponseEmpathetic(adjustedResponse);
                break;
        }
        
        responseText.textContent = adjustedResponse;
        this.currentResponse = adjustedResponse;
    }

    makeResponseShorter(response) {
        return response
            .replace(/Espero que esta información sea de utilidad\./g, '')
            .replace(/Por favor, no dudes en contactarnos si tienes alguna otra pregunta\./g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    makeResponseFormal(response) {
        return response
            .replace(/Hola/g, 'Estimado/a cliente')
            .replace(/te ayudo/g, 'le asistimos')
            .replace(/puedes/g, 'puede usted')
            .replace(/tu/g, 'su');
    }

    makeResponseEmpathetic(response) {
        return response
            .replace(/Hola/g, 'Hola, entiendo cómo te sientes y')
            .replace(/\./g, '. Estamos aquí para apoyarte.');
    }

    copyResponse() {
        if (this.currentResponse) {
            navigator.clipboard.writeText(this.currentResponse).then(() => {
                const copyBtn = document.getElementById('copyBtn');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ Copiado';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            });
        }
    }

    populateMacrosTable() {
        console.log('Cargando tabla de macros...');
        const tbody = document.getElementById('macrosTableBody');
        if (!tbody) {
            console.error('No se encontró el elemento macrosTableBody');
            return;
        }
        
        tbody.innerHTML = '';
        console.log('Datos de macros:', this.macrosData.length, 'items');
        
        this.macrosData.forEach((macro, index) => {
            console.log(`Agregando macro ${index + 1}:`, macro.title);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${macro.title}</td>
                <td><span class="category-tag">${macro.category_title}</span></td>
                <td>${macro.lastUpdated}</td>
                <td>
                    <div class="macro-actions">
                        <button class="action-btn" onclick="app.viewMacro('${macro.id}')">Ver</button>
                        <button class="action-btn" onclick="app.copyMacro('${macro.id}')">Copiar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        console.log('Tabla de macros cargada exitosamente');
    }

    populateWedukasGrid() {
        const grid = document.getElementById('documentsGrid');
        grid.innerHTML = '';
        
        // Agrupar wedukas por categoría
        const categories = {};
        this.wedukasData.forEach(weduka => {
            if (!categories[weduka.category]) {
                categories[weduka.category] = {
                    title: weduka.category_title,
                    items: []
                };
            }
            categories[weduka.category].items.push(weduka);
        });
        
        // Crear acordeones por categoría
        Object.keys(categories).forEach(categoryKey => {
            const category = categories[categoryKey];
            const card = document.createElement('div');
            card.className = 'document-card';
            
            const itemsList = category.items.map(item => 
                `<div class="weduka-item">
                    <a href="${item.link}" target="_blank" class="weduka-link">
                        📄 ${item.title}
                    </a>
                </div>`
            ).join('');
            
            card.innerHTML = `
                <div class="document-header" onclick="app.toggleDocument('${categoryKey}')">
                    <h3 class="document-title">${category.title} (${category.items.length})</h3>
                    <span class="document-toggle">▼</span>
                </div>
                <div class="document-content" id="content-${categoryKey}">
                    ${itemsList}
                </div>
            `;
            grid.appendChild(card);
        });
    }

    filterMacros(searchTerm, category) {
        const tbody = document.getElementById('macrosTableBody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const title = row.children[0].textContent.toLowerCase();
            const categoryText = row.children[1].textContent.toLowerCase();
            
            const matchesSearch = !searchTerm || title.includes(searchTerm.toLowerCase());
            const matchesCategory = !category || 
                this.macrosData.find(m => m.title === row.children[0].textContent && m.category === category);
            
            row.style.display = matchesSearch && matchesCategory ? '' : 'none';
        });
    }

    filterWedukas(searchTerm, category) {
        const cards = document.querySelectorAll('.document-card');
        
        cards.forEach(card => {
            const title = card.querySelector('.document-title').textContent.toLowerCase();
            const links = card.querySelectorAll('.weduka-link');
            let hasMatch = false;
            let categoryMatch = true;
            
            // Verificar categoría primero
            if (category && category !== '') {
                if (category === 'vanguard-venus') {
                    categoryMatch = title.includes('vanguard/venus');
                } else if (category === 'nu') {
                    categoryMatch = title.includes('nu (') && !title.includes('vanguard');
                }
            }
            
            // Verificar término de búsqueda
            if (!searchTerm || searchTerm.trim() === '') {
                hasMatch = true;
            } else {
                const searchLower = searchTerm.toLowerCase();
                if (title.includes(searchLower)) {
                    hasMatch = true;
                } else {
                    // Buscar en los links individuales
                    links.forEach(link => {
                        if (link.textContent.toLowerCase().includes(searchLower)) {
                            hasMatch = true;
                        }
                    });
                }
            }
            
            // Mostrar solo si cumple ambas condiciones
            const shouldShow = hasMatch && categoryMatch;
            card.style.display = shouldShow ? '' : 'none';
        });
    }

    toggleDocument(docId) {
        const content = document.getElementById(`content-${docId}`);
        const toggle = content.previousElementSibling.querySelector('.document-toggle');
        
        content.classList.toggle('active');
        toggle.classList.toggle('active');
    }

    viewMacro(macroId) {
        const macro = this.macrosData.find(m => m.id === macroId);
        if (macro) {
            alert(`Macro: ${macro.title}\n\n${macro.content}`);
        }
    }

    copyMacro(macroId) {
        const macro = this.macrosData.find(m => m.id === macroId);
        if (macro) {
            navigator.clipboard.writeText(macro.content).then(() => {
                alert('Macro copiada al portapapeles');
            });
        }
    }

    // Data loading methods
    loadMacrosData() {
        return [
            {
                "id": "1",
                "title": "[ACQ] - Registro: ¿Puedo utilizar mi tarjeta débito para retiros en el exterior?",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Sí, puedes hacer retiros en efectivo con tu tarjeta débito Nu en una gran cantidad de cajeros electrónicos de la red Mastercard a nivel nacional o internacional. Ten presente que el límite para avances internacionales sería la equivalencia, en la moneda del país donde se haga el avance, de los $2.700.000,00 COP, en un lapso de 24 horas."
            },
            {
                "id": "2",
                "title": "[ACQ] - Registro: ¿Qué diferencia tienen Bre-B y Redeban?",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "En la siguiente tabla te contamos las diferencias principales: Transferencias con llaves de Redeban: Ya está disponible en Nu. Permite pagos rápidos entre bancos como Bancolombia, Nequi, y otros que usan Redeban."
            },
            {
                "id": "3",
                "title": "[ACQ] - Data policy: Mensaje sobre pérdida de acceso a productos Nu",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Para nosotros es muy importante contar con tu autorización, para seguir tratando tus datos personales conforme a nuestra nueva Política de Tratamiento de Datos Personales, es por ello, que es necesario que la revises y aceptes, para que puedas usar tus productos Nu sin problemas."
            },
            {
                "id": "4",
                "title": "[ACQ] - Data policy: ¿Cuál es la diferencia entre la Política de datos del 2024 y del 2025?",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Queremos contarte que actualizamos nuestra Política de Tratamiento de Datos Personales para darte mayor claridad sobre cómo usamos tu información y reforzar nuestro compromiso con tu privacidad."
            },
            {
                "id": "5",
                "title": "[ACQ] - Data policy: ¿Cómo puedo aceptar la Política de Tratamiento de Datos 2025?",
                "category": "inscripcion-registro", 
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Puedes leer y aceptar nuestra nueva Política de Tratamiento de Datos, de las siguientes formas: 1. Al ingresar a tu App Nu, te aparecerá un anuncio con la nueva Política de Tratamiento de Datos Personales, para que la revises y aceptes."
            },
            {
                "id": "6",
                "title": "[ACQ] - Data policy: ¿Por qué debo aceptar esta nueva Política de Tratamiento de Datos?",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro", 
                "lastUpdated": "2024-10-03",
                "content": "Tú tienes el control de la información que compartes con nosotros, y aceptarla es clave para seguir usando tus productos Nu sin preocupaciones."
            },
            {
                "id": "7",
                "title": "[ACQ] - Prospecto abandoned: No sé en qué pantalla está la persona",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Para mí será todo un gusto ayudarte 💜, para poder entender mejor tu consulta. Me puedes describir/contar en que paso del registro estas."
            },
            {
                "id": "8",
                "title": "[ACQ] - Prospectos que pueden acceder al home screen",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Gracias por contarnos lo sucedido. Queremos informarte que tu proceso de registro está en la etapa de validación. Esto es parte de nuestro procedimiento estándar para asegurarnos de ofrecerte el mejor servicio posible."
            },
            {
                "id": "9", 
                "title": "[ACQ] - Registro: Después de poner la dirección, ¿puedo actualizarla?",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Si puedes actualizar tus datos, también puedes indicarnos una dirección de entrega diferente a la de residencia si lo prefieres. Solo ten en cuenta que la dirección donde se entregue la tarjeta debe contar con nomenclatura visible."
            },
            {
                "id": "10",
                "title": "[ACQ] - Registro: Hago clic en el link de confirmación y no funciona",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Puedes intentar el proceso desde un computador, al darle clic al link vas a ser redirigido a nuestra página web, donde vas a ingresar tu número de documento y tu correo registrado."
            },
            {
                "id": "11",
                "title": "[ACQ] - Registro: Las fotos me están saliendo borrosas, ¿qué puedo hacer?",
                "category": "inscripcion-registro",
                "category_title": "Inscripción y Registro",
                "lastUpdated": "2024-10-03",
                "content": "Para la situación que presentas, te recomiendo buscar un lugar iluminado, pero que no afecte la visibilidad de los documentos. También, puedes colocar tu documento de identidad sobre una mesa."
            },
            {
                "id": "12",
                "title": "[MGM] - Invitar amigos: ¿Cómo funciona?",
                "category": "mgm-referidos",
                "category_title": "Invitar Amigos",
                "lastUpdated": "2024-10-03",
                "content": "Nos encanta que quieras compartir la experiencia Nu con tus amigos y familiares! En la pantalla principal de la app da clic al botón de invitar amigos que se encuentran situado en la parte superior izquierda."
            }
        ];
    }

    loadWedukasData() {
        return [
            // Vanguard/Venus Documents (24 total)
            {"id": "1", "title": "Ruta de activación de productos", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4111", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "2", "title": "Dudas de prospectos sobre la Adquisición de CDTs", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4110", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "3", "title": "Gestión de correos en Zendesk", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4107", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "4", "title": "FoN: Criterios de aprobación y validación de selfies", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4101", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "5", "title": "Pagarés", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4104", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "6", "title": "FoN: Invalidación de documentos y sospecha de fraude", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4252", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "7", "title": "FoN-Documentos Rechazados FoN Low Risk", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4098", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "8", "title": "Experiencia cross-sell en Nu", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4112", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "9", "title": "Pantalla principal de la App", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4089", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "10", "title": "Cancelación de la invitación a Nu para prospectos", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4109", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "11", "title": "FoN: Documentos aceptados FoN Low Risk", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4253", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "12", "title": "¿Cómo escalar Secondary Jobs desde Shuffle?", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4026", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "13", "title": "Características básicas de la cédula amarilla", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4105", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "14", "title": "FoN: Conceptos generales de Fraud or Not Low Risk", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4106", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "15", "title": "Gestión de Contact Reasons tercerizadas", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4146", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "16", "title": "Inscripción y registro al mundo Nu", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4021", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "17", "title": "Piloto: ¡Impulsa tus Metas! / Test MGM", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4103", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "18", "title": "Flujo de registro: Tarjeta de Crédito NuControl", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4310", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "19", "title": "Campaña: Cajitas para mi Gente", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4254", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "20", "title": "QA Process", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4288", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "21", "title": "Inconvenientes en el proceso de adquisición", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4366", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "22", "title": "PEPs - Tag REQUESTED_PEP_INFO", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4375", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "23", "title": "[REGSOL-KYCOPS] Tag KYC_INFO_REQUESTED", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4376", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            {"id": "24", "title": "Implementación Case Management", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4384", "category": "vanguard-venus", "category_title": "Vanguard/Venus"},
            
            // Nu Documents (40 total)
            {"id": "25", "title": "Contact Reasons Team Acquisition", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2008", "category": "nu", "category_title": "Nu"},
            {"id": "26", "title": "Perfil con status AR Cancelled", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=1978", "category": "nu", "category_title": "Nu"},
            {"id": "27", "title": "PV con status Confirmed/Released que no se libera", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=1981", "category": "nu", "category_title": "Nu"},
            {"id": "28", "title": "QA Process", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2837", "category": "nu", "category_title": "Nu"},
            {"id": "29", "title": "Estados de los PV en el proceso de adquisición", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=2006", "category": "nu", "category_title": "Nu"},
            {"id": "30", "title": "Status Abandoned en el PV", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2077", "category": "nu", "category_title": "Nu"},
            {"id": "31", "title": "Reportes / Jira Service Desk Acquisition", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2047", "category": "nu", "category_title": "Nu"},
            {"id": "32", "title": "[ACQ] - ¿Cómo aprobar Stuck Prospects?", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=1988", "category": "nu", "category_title": "Nu"},
            {"id": "33", "title": "Typo en Fecha de Nacimiento (DoB) y Nombres o Apellidos incompletos (REGISTRO)", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2138", "category": "nu", "category_title": "Nu"},
            {"id": "34", "title": "Instant Release FoN: Selfie sin Documento", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2574", "category": "nu", "category_title": "Nu"},
            {"id": "35", "title": "Docs Request: ¿Cómo y cuándo solicitar documentos nuevamente?", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=1874", "category": "nu", "category_title": "Nu"},
            {"id": "36", "title": "Flujo de registro: Tarjeta de Crédito NuControl", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3363", "category": "nu", "category_title": "Nu"},
            {"id": "37", "title": "Test activación de productos: descuento tasa de interés", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3608", "category": "nu", "category_title": "Nu"},
            {"id": "38", "title": "[ACQ] - App de Nu: Soporte básico", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2868", "category": "nu", "category_title": "Nu"},
            {"id": "39", "title": "Banca Abierta / Open Banking", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=1724", "category": "nu", "category_title": "Nu"},
            {"id": "40", "title": "Credit Score / Puntaje Crediticio de Datacrédito", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2067", "category": "nu", "category_title": "Nu"},
            {"id": "41", "title": "Cancelación de la invitación a Nu para prospectos (no clientes)", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=3187", "category": "nu", "category_title": "Nu"},
            {"id": "42", "title": "Prospectos que solicitan no continuar con el proceso de registro", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2063", "category": "nu", "category_title": "Nu"},
            {"id": "43", "title": "Pantalla principal de la App de Nu", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3155", "category": "nu", "category_title": "Nu"},
            {"id": "44", "title": "¿Cómo escalar secondary jobs al team de ACQ?", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2720", "category": "nu", "category_title": "Nu"},
            {"id": "45", "title": "FoN: Generalidades de FoN Low Risk", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3200", "category": "nu", "category_title": "Nu"},
            {"id": "46", "title": "Gestión Secondary Jobs Xpeers ACQ", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3207", "category": "nu", "category_title": "Nu"},
            {"id": "47", "title": "FoN sin CC/CE / Prospecto esperando reexpedición o reemisión", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=1962", "category": "nu", "category_title": "Nu"},
            {"id": "48", "title": "[ACQ] - Fraud o Not (FoN): Low Risk", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2055", "category": "nu", "category_title": "Nu"},
            {"id": "49", "title": "Notificaciones en Shuffle y Cómo configurar las Notificaciones en la App", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2140", "category": "nu", "category_title": "Nu"},
            {"id": "50", "title": "¿Qué es Republish en Nu?", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2433", "category": "nu", "category_title": "Nu"},
            {"id": "51", "title": "Gestión de contact reason Acquisition", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3300", "category": "nu", "category_title": "Nu"},
            {"id": "52", "title": "Invitado no recibe correo de confirmación / Link mágico", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2254", "category": "nu", "category_title": "Nu"},
            {"id": "53", "title": "Darse de baja en las notificaciones no obligatorias (clientes)", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=2491", "category": "nu", "category_title": "Nu"},
            {"id": "54", "title": "Piloto: ¡Impulsa tus Metas! / Test MGM", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3871", "category": "nu", "category_title": "Nu"},
            {"id": "55", "title": "[ACQ] - Flujo de registro: Tarjeta Abre Caminos", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3069", "category": "nu", "category_title": "Nu"},
            {"id": "56", "title": "Experiencia cross-sell en Nu", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3810", "category": "nu", "category_title": "Nu"},
            {"id": "57", "title": "Inscripción y registro al mundo Nu para prospectos nuevos", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3902", "category": "nu", "category_title": "Nu"},
            {"id": "58", "title": "Ruta de activación de productos", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3769", "category": "nu", "category_title": "Nu"},
            {"id": "59", "title": "Dudas de prospectos sobre la adquisición de CDTs", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3728", "category": "nu", "category_title": "Nu"},
            {"id": "60", "title": "Pagarés", "link": "http://nucolombia.myweduka.com/DocumentFind?idDocument=3292", "category": "nu", "category_title": "Nu"},
            {"id": "61", "title": "Inconvenientes en el proceso de adquisición", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=3934", "category": "nu", "category_title": "Nu"},
            {"id": "62", "title": "Yellow Docs", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=3937", "category": "nu", "category_title": "Nu"},
            {"id": "63", "title": "Flujo de registro: Tarjeta Abre Caminos", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=3069", "category": "nu", "category_title": "Nu"},
            {"id": "64", "title": "Implementación Case Management", "link": "https://nucolombia.myweduka.com/DocumentFind/Document?idDocument=4378", "category": "nu", "category_title": "Nu"}
        ];
    }

    loadProcessData() {
        return {
            'inscripcion-registro': {
                title: 'Inscripción y Registro',
                steps: [
                    'Verificar documentos de identidad del cliente',
                    'Validar información personal y financiera',
                    'Explicar el proceso paso a paso al cliente',
                    'Documentar cualquier inconveniente en el sistema',
                    'Hacer seguimiento del proceso de validación'
                ]
            },
            'mgm-referidos': {
                title: 'Invitar Amigos (MGM)',
                steps: [
                    'Explicar cómo funciona el programa de referidos',
                    'Mostrar cómo compartir el enlace de invitación',
                    'Verificar el estado de invitaciones previas',
                    'Explicar los beneficios y recompensas',
                    'Resolver problemas con invitaciones'
                ]
            },
            'activacion-productos': {
                title: 'Activación de Productos',
                steps: [
                    'Verificar el estado del producto en el sistema',
                    'Guiar al cliente en el proceso de activación',
                    'Verificar que el cliente complete las misiones',
                    'Resolver problemas técnicos de activación',
                    'Confirmar que el producto esté funcionando'
                ]
            },
            'nucontrol-registro': {
                title: 'NuControl',
                steps: [
                    'Explicar las características del producto NuControl',
                    'Verificar elegibilidad del cliente',
                    'Guiar en el proceso de solicitud',
                    'Explicar términos y condiciones específicos',
                    'Hacer seguimiento de la solicitud'
                ]
            },
            'data-policy': {
                title: 'Política de Datos',
                steps: [
                    'Explicar la importancia de la nueva política',
                    'Mostrar cómo acceder y revisar la política',
                    'Guiar en el proceso de aceptación',
                    'Resolver dudas sobre tratamiento de datos',
                    'Confirmar que la política fue aceptada'
                ]
            },
            'problemas-registro': {
                title: 'Problemas de Registro',
                steps: [
                    'Identificar el tipo específico de problema',
                    'Verificar el estado actual del registro',
                    'Aplicar solución según el tipo de error',
                    'Escalar a soporte técnico si es necesario',
                    'Hacer seguimiento hasta la resolución'
                ]
            }
        };
    }

    getResponseTemplates() {
        return {
            'inscripcion-registro': 'Hola, te ayudo con tu proceso de registro. Para completar exitosamente tu inscripción, necesitamos verificar tu identidad y validar la información proporcionada. Este es un proceso estándar que garantiza la seguridad de tu cuenta. ¿En qué paso específico del registro te encuentras?',
            'mgm-referidos': 'Hola, ¡nos encanta que quieras compartir Nu con tus amigos! El programa de referidos te permite invitar personas y obtener beneficios. En la app, ve al botón "Invitar amigos" en la parte superior. Puedes compartir tu enlace por WhatsApp, email o redes sociales. ¿Te ayudo con algún paso específico?',
            'activacion-productos': 'Hola, te ayudo con la activación de tu producto Nu. Una vez completado tu registro, podrás activar y configurar tus productos. Es importante completar las misiones para familiarizarte con todas las funcionalidades. ¿Qué producto específico quieres activar?',
            'nucontrol-registro': 'Hola, te comparto información sobre NuControl. Es nuestra tarjeta de crédito con características especiales diseñadas para acompañarte en tu viaje financiero. Tiene condiciones preferenciales y beneficios únicos. ¿Te gustaría conocer más detalles sobre este producto?',
            'data-policy': 'Hola, te ayudo con la nueva Política de Tratamiento de Datos. Es importante que la revises y aceptes para continuar usando tus productos Nu. Puedes encontrarla en tu app o en el correo que te enviamos. Tu privacidad es muy importante para nosotros. ¿Tienes alguna duda específica?',
            'problemas-registro': 'Hola, te ayudo a resolver el problema con tu registro. Hay diferentes tipos de inconvenientes que pueden presentarse. Para darte la mejor solución, necesito que me cuentes exactamente qué error o dificultad estás experimentando. ¿Podrías describirme el problema?',
            'default': 'Hola, gracias por contactarnos. He revisado tu consulta y te ayudo inmediatamente. Para brindarte la mejor solución, necesito algunos datos adicionales. Por favor compárteme más detalles sobre tu situación.'
        };
    }

    // Modal functions
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Training Module Functions
    getScenarioPool() {
        return [
            {
                case: {
                    client: "María González",
                    message: "Hola, quiero saber qué necesito para sacar la tarjeta de crédito Nu. ¿Cuáles son los requisitos?",
                    mission: "Clasificar correctamente esta consulta de adquisición inicial"
                },
                quiz: {
                    options: [
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "acquisition.new-products-request",
                        "acquisition.soft-decline"
                    ],
                    correctAnswer: 0
                },
                feedback: {
                    correct: "¡Excelente! Es una consulta de adquisición inicial de un prospecto que quiere información sobre requisitos.",
                    incorrect: "Esta es una consulta típica de 'acquisition.first-time-application' - un prospecto pidiendo información sobre requisitos para obtener el producto por primera vez."
                },
                response: {
                    robotic: "Para obtener la tarjeta de crédito debe cumplir los requisitos establecidos en nuestros términos y condiciones.",
                    human: "¡Hola María! Me da mucho gusto que quieras conocer Nu. Te explico fácil: necesitas ser mayor de edad, tener cédula colombiana y ingresos desde $800,000. El proceso es súper sencillo y te acompaño en cada paso. ¿Te parece si empezamos?"
                },
                learnings: [
                    "Los prospectos buscan información clara y didáctica sobre requisitos",
                    "Usar el nombre del cliente y un tono cercano",
                    "Explicar de forma simple, como a un familiar"
                ]
            },
            {
                case: {
                    client: "Carlos Pérez",
                    message: "Me llegó un correo diciendo que me rechazaron la solicitud. ¿Por qué no me aprobaron la tarjeta?",
                    mission: "Identificar el tipo de consulta post-declinación"
                },
                quiz: {
                    options: [
                        "acquisition.soft-decline",
                        "acquisition.first-time-application",
                        "acquisition.opt-out",
                        "acquisition.invite"
                    ],
                    correctAnswer: 0
                },
                feedback: {
                    correct: "¡Perfecto! Es un caso de 'soft-decline' - prospecto declinado que pregunta por las razones.",
                    incorrect: "Esto es 'acquisition.soft-decline' - cuando un prospecto declinado pregunta por el estado o razones de la declinación."
                },
                response: {
                    robotic: "Su solicitud fue evaluada por nuestro sistema y no cumple con los criterios establecidos.",
                    human: "Hola Carlos, entiendo tu frustración y lamento que hayas tenido esta experiencia. Te explico: nuestro algoritmo evalúa muchos factores y a veces es muy exigente. Esto no significa que no seas una persona confiable, simplemente que en este momento no pudimos ofrecerte el producto. ¿Te gustaría que revisemos si hay algo que podamos hacer?"
                },
                learnings: [
                    "Validar los sentimientos del cliente (frustración, decepción)",
                    "Explicar sin culpar al cliente",
                    "Ser transparente sobre el proceso de evaluación"
                ]
            },
            {
                case: {
                    client: "Ana Rodríguez",
                    message: "¿Cómo puedo invitar a un amigo a Nu? No encuentro la opción en la app.",
                    mission: "Clasificar una consulta sobre el programa de referidos"
                },
                quiz: {
                    options: [
                        "others.referrals",
                        "acquisition.first-time-application",
                        "others.app-issues",
                        "notification.unsubscribe"
                    ],
                    correctAnswer: 0
                },
                feedback: {
                    correct: "¡Excelente! Es una consulta sobre MGM - invitar amigos/referidos.",
                    incorrect: "Esta es una consulta de 'others.referrals' - preguntas sobre el programa MGM (invitar amigos)."
                },
                response: {
                    robotic: "Para invitar usuarios debe acceder a la sección de referidos en la aplicación.",
                    human: "¡Hola Ana! Qué genial que quieras compartir Nu con tus amigos. Te explico paso a paso: en la app, ve a la sección 'Invita y gana' que está en el menú principal. Ahí podrás generar tu link personalizado y enviárselo. Cuando tu amigo se registre usando tu link, ¡ambos reciben beneficios! ¿Te ayudo a encontrarlo?"
                },
                learnings: [
                    "Los clientes quieren instrucciones paso a paso",
                    "Mostrar entusiasmo por su interés en referir",
                    "Explicar los beneficios del programa"
                ]
            },
            {
                case: {
                    client: "Luis Morales",
                    message: "Ya no quiero seguir con el proceso de registro. ¿Cómo cancelo mi solicitud?",
                    mission: "Identificar cuando un prospecto desiste del proceso"
                },
                quiz: {
                    options: [
                        "acquisition.opt-out",
                        "acquisition.soft-decline",
                        "acquisition.first-time-application",
                        "regsol.pep-edd-contacts"
                    ],
                    correctAnswer: 0
                },
                feedback: {
                    correct: "¡Correcto! Es un 'opt-out' - prospecto que ya no desea continuar con el proceso.",
                    incorrect: "Esta es una consulta de 'acquisition.opt-out' - prospecto que desiste y quiere cancelar su proceso."
                },
                response: {
                    robotic: "Su solicitud será cancelada según lo solicitado. Los datos serán eliminados del sistema.",
                    human: "Hola Luis, entiendo tu decisión y la respeto completamente. Si cambias de opinión en el futuro, siempre serás bienvenido. Para cancelar tu proceso, yo me encargo de todo - no necesitas hacer nada adicional. Tus datos serán eliminados de forma segura. ¿Hay algo específico que te hizo cambiar de opinión? Tu feedback nos ayuda a mejorar."
                },
                learnings: [
                    "Respetar la decisión del cliente sin presionar",
                    "Ofrecer soporte para procesos futuros",
                    "Aprovechar para obtener feedback constructivo"
                ]
            },
            {
                case: {
                    client: "Sandra López",
                    message: "La app se me cierra cada vez que trato de tomar la foto de mi cédula. No puedo avanzar.",
                    mission: "Identificar un problema técnico en el proceso de registro"
                },
                quiz: {
                    options: [
                        "acquisition.invite",
                        "others.app-issues",
                        "acquisition.first-time-application",
                        "acquisition.soft-decline"
                    ],
                    correctAnswer: 0
                },
                feedback: {
                    correct: "¡Perfecto! Es 'acquisition.invite' - problemas técnicos durante el proceso de registro.",
                    incorrect: "Esta es una consulta de 'acquisition.invite' - inconvenientes técnicos durante el proceso de adquisición."
                },
                response: {
                    robotic: "Reporte el error técnico para que sea resuelto por el equipo correspondiente.",
                    human: "Hola Sandra, lamento mucho que estés teniendo esta dificultad. Entiendo lo frustrante que debe ser. Vamos a solucionarlo juntos: primero, intenta cerrar completamente la app y volver a abrirla. Si persiste, prueba actualizando la app o reiniciando tu teléfono. Mientras tanto, yo estoy reportando este error para que nuestro equipo técnico lo revise. ¿En qué tipo de celular te está pasando esto?"
                },
                learnings: [
                    "Mostrar empatía ante problemas técnicos",
                    "Ofrecer soluciones paso a paso",
                    "Asumir responsabilidad del problema y dar seguimiento"
                ]
            },
            {
                case: {
                    client: "Diego Martín",
                    message: "Ya tengo la cuenta Nu, ¿cómo puedo obtener también la tarjeta de crédito?",
                    mission: "Clasificar una consulta de producto adicional"
                },
                quiz: {
                    options: [
                        "acquisition.cross-sell",
                        "acquisition.first-time-application",
                        "acquisition.new-products-request",
                        "others.app-issues"
                    ],
                    correctAnswer: 0
                },
                feedback: {
                    correct: "¡Genial! Es 'acquisition.cross-sell' - cliente que quiere adquirir un producto adicional.",
                    incorrect: "Esta es una consulta de 'acquisition.cross-sell' - cliente existente que busca un producto adicional."
                },
                response: {
                    robotic: "Para obtener productos adicionales debe verificar las ofertas disponibles en su perfil.",
                    human: "¡Hola Diego! Qué bueno saber que ya eres parte de la familia Nu con tu cuenta. Para la tarjeta de crédito, lo primero es revisar si tienes una oferta activa en tu app - la encontrarías en la pantalla principal como un banner. Si no la ves, significa que nuestro algoritmo aún está evaluando tu perfil. Tranquilo, esto puede tomar algunas semanas. Mientras tanto, usa activamente tu cuenta Nu, ¡eso ayuda mucho!"
                },
                learnings: [
                    "Reconocer que ya es cliente de Nu",
                    "Dar instrucciones claras sobre dónde buscar ofertas",
                    "Explicar el proceso de evaluación sin crear falsas expectativas"
                ]
            }
        ];
    }

    initializeTrainingSimulation() {
        const agentNameInput = document.getElementById('agent-name');
        this.agentName = agentNameInput.value.trim();
        
        if (!this.agentName) {
            alert('Por favor, ingresa tu nombre para continuar.');
            return;
        }

        // Reset variables
        this.scenarios = [];
        this.currentScenarioIndex = 0;
        this.score = 0;
        this.incorrectAnswers = [];
        this.selectedAnswer = null;

        // Select 5 random scenarios
        const scenarioPool = this.getScenarioPool();
        const shuffled = [...scenarioPool].sort(() => 0.5 - Math.random());
        this.scenarios = shuffled.slice(0, 5);

        // Update welcome screen
        document.getElementById('welcome-name').textContent = this.agentName;
        
        this.showTrainingScreen('welcome-screen');
    }

    startTrainingQuiz() {
        this.showTrainingScreen('case-study-screen');
        this.loadScenario(0);
    }

    showTrainingScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.training-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
    }

    loadScenario(index) {
        this.currentScenarioIndex = index;
        const scenario = this.scenarios[index];
        
        // Update progress
        const progressPercent = ((index + 1) / 5) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercent}%`;
        document.getElementById('progress-text').textContent = `Pregunta ${index + 1} de 5`;
        
        // Load case content
        document.getElementById('client-name').textContent = scenario.case.client;
        document.getElementById('client-message').textContent = scenario.case.message;
        document.getElementById('mission-text').textContent = scenario.case.mission;
    }

    showQuiz() {
        this.showTrainingScreen('quiz-screen');
        const scenario = this.scenarios[this.currentScenarioIndex];
        
        // Update progress
        const progressPercent = ((this.currentScenarioIndex + 1) / 5) * 100;
        document.getElementById('progress-fill-quiz').style.width = `${progressPercent}%`;
        document.getElementById('progress-text-quiz').textContent = `Pregunta ${this.currentScenarioIndex + 1} de 5`;
        
        // Load quiz options
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        
        scenario.quiz.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';
            optionDiv.textContent = option;
            optionDiv.onclick = () => this.selectOption(index);
            optionsContainer.appendChild(optionDiv);
        });
        
        this.selectedAnswer = null;
        document.getElementById('submit-btn').disabled = true;
    }

    selectOption(index) {
        // Remove previous selection
        document.querySelectorAll('#academy-quiz-options .quiz-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Select current option
        document.querySelectorAll('.quiz-option')[index].classList.add('selected');
        this.selectedAnswer = index;
        document.getElementById('submit-btn').disabled = false;
    }

    submitAnswer() {
        if (this.selectedAnswer === null) return;
        
        const scenario = this.scenarios[this.currentScenarioIndex];
        const isCorrect = this.selectedAnswer === scenario.quiz.correctAnswer;
        
        if (isCorrect) {
            this.score++;
        } else {
            this.incorrectAnswers.push({
                question: `${scenario.case.client}: ${scenario.case.message}`,
                selectedAnswer: scenario.quiz.options[this.selectedAnswer],
                correctAnswer: scenario.quiz.options[scenario.quiz.correctAnswer]
            });
        }
        
        this.showFeedback(isCorrect);
    }

    showFeedback(isCorrect) {
        this.showTrainingScreen('feedback-screen');
        const scenario = this.scenarios[this.currentScenarioIndex];
        
        const feedbackResult = document.getElementById('feedback-result');
        const feedbackExplanation = document.getElementById('feedback-explanation');
        
        if (isCorrect) {
            feedbackResult.innerHTML = `<h3>✅ ¡Correcto!</h3>`;
            feedbackResult.className = 'feedback-result correct';
            feedbackExplanation.textContent = scenario.feedback.correct;
        } else {
            feedbackResult.innerHTML = `<h3>❌ Incorrecto</h3>`;
            feedbackResult.className = 'feedback-result incorrect';
            feedbackExplanation.innerHTML = `
                <p><strong>Respuesta correcta:</strong> ${scenario.quiz.options[scenario.quiz.correctAnswer]}</p>
                <p>${scenario.feedback.incorrect}</p>
            `;
        }
    }

    showResponse() {
        this.showTrainingScreen('response-screen');
        const scenario = this.scenarios[this.currentScenarioIndex];
        
        document.getElementById('robotic-response').textContent = scenario.response.robotic;
        document.getElementById('human-response').textContent = scenario.response.human;
        
        const learningsList = document.getElementById('learning-points');
        learningsList.innerHTML = '';
        scenario.learnings.forEach(learning => {
            const li = document.createElement('li');
            li.textContent = learning;
            learningsList.appendChild(li);
        });
        
        // Update next button
        const nextBtn = document.getElementById('next-btn');
        if (this.currentScenarioIndex === 4) {
            nextBtn.textContent = 'Ver Resultados';
        } else {
            nextBtn.textContent = 'Siguiente Pregunta';
        }
    }

    nextScenario() {
        if (this.currentScenarioIndex < 4) {
            this.showTrainingScreen('case-study-screen');
            this.loadScenario(this.currentScenarioIndex + 1);
        } else {
            this.showResults();
        }
    }

    showResults() {
        if (this.score === 5) {
            this.showCertificate();
        } else {
            this.showSummary();
        }
    }

    showSummary() {
        this.showTrainingScreen('summary-screen');
        
        document.getElementById('final-score').textContent = this.score;
        
        const scoreMessage = document.getElementById('score-message');
        if (this.score >= 4) {
            scoreMessage.textContent = '¡Excelente trabajo! Tienes un gran dominio de la clasificación de casos.';
        } else if (this.score >= 3) {
            scoreMessage.textContent = '¡Buen trabajo! Con un poco más de práctica serás un experto.';
        } else {
            scoreMessage.textContent = 'Sigue practicando. Cada intento te acerca más a la excelencia.';
        }
        
        if (this.incorrectAnswers.length > 0) {
            document.getElementById('incorrect-summary').style.display = 'block';
            const incorrectList = document.getElementById('incorrect-list');
            incorrectList.innerHTML = '';
            
            this.incorrectAnswers.forEach((item, index) => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p><strong>Pregunta ${index + 1}:</strong> ${item.question}</p>
                    <p><span style="color: #ef4444;">Tu respuesta:</span> ${item.selectedAnswer}</p>
                    <p><span style="color: #22c55e;">Respuesta correcta:</span> ${item.correctAnswer}</p>
                    <hr style="margin: 16px 0;">
                `;
                incorrectList.appendChild(div);
            });
        }
    }

    showCertificate() {
        this.showTrainingScreen('certificate-screen');
        
        document.getElementById('certificate-name').textContent = this.agentName;
        document.getElementById('certificate-date').textContent = new Date().toLocaleDateString('es-CO');
    }

    downloadCertificate() {
        const element = document.getElementById('certificate-content');
        
        html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save(`Certificado_NuSense_${this.agentName.replace(' ', '_')}.pdf`);
        });
    }

    downloadResults() {
        const csvContent = [
            ['Nombre', 'Puntuación', 'Respuestas Incorrectas'],
            [this.agentName, `${this.score}/5`, this.incorrectAnswers.length],
            [],
            ['Detalle de Respuestas Incorrectas:'],
            ...this.incorrectAnswers.map((item, index) => [
                `Pregunta ${index + 1}`,
                `Respuesta: ${item.selectedAnswer}`,
                `Correcta: ${item.correctAnswer}`
            ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Resultados_Entrenamiento_${this.agentName.replace(' ', '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    restartTrainingSimulation() {
        this.scenarios = [];
        this.currentScenarioIndex = 0;
        this.score = 0;
        this.agentName = '';
        this.incorrectAnswers = [];
        this.selectedAnswer = null;
        
        document.getElementById('agent-name').value = '';
        this.showTrainingScreen('login-screen');
    }

    // Academy Module Functions
    initializeAcademy() {
        console.log('Initializing Academy...');
        
        // Set up navigation
        this.setupAcademyNavigation();
        
        // Show the first activity by default
        document.querySelectorAll('.academy-activity').forEach(act => {
            act.style.display = 'none';
        });
        
        const firstActivity = document.getElementById('clasifica');
        if (firstActivity) {
            firstActivity.style.display = 'block';
            firstActivity.classList.add('active');
        }
        
        // Initialize only the first activity
        this.initializeActivity('clasifica');
    }

    setupAcademyNavigation() {
        const academyTabs = document.querySelectorAll('.academy-tab');
        academyTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const activity = tab.getAttribute('data-activity');
                console.log('Academy tab clicked:', activity);
                
                // Update active tab
                academyTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Hide all activities
                document.querySelectorAll('.academy-activity').forEach(act => {
                    act.classList.remove('active');
                    act.style.display = 'none';
                });
                
                // Show corresponding activity
                const activityElement = document.getElementById(activity);
                if (activityElement) {
                    activityElement.classList.add('active');
                    activityElement.style.display = 'block';
                    console.log('Showing activity:', activity);
                } else {
                    console.error('Activity element not found:', activity);
                }
                
                // Initialize the selected activity
                this.initializeActivity(activity);
            });
        });
    }

    initializeActivity(activity) {
        console.log('Initializing activity:', activity);
        
        switch(activity) {
            case 'clasifica':
                this.loadRandomCase();
                break;
            case 'humaniza':
                this.loadRandomHumanizeCase();
                break;
            case 'aventura':
                console.log('Starting adventure...');
                this.showAdventureMenu();
                break;
            case 'conocimiento':
                console.log('Starting quiz...');
                // Reset quiz state
                document.getElementById('quiz-feedback').style.display = 'none';
                document.getElementById('quiz-results').style.display = 'none';
                this.startQuiz();
                break;
            case 'memoria':
                // Reset memory challenge to menu
                this.showMemoryMenu();
                break;
        }
    }

    getAcademyData() {
        return {
            clasifica: [
                {
                    case: "Hola, quiero saber qué necesito para obtener la tarjeta de crédito Nu. ¿Cuáles son los requisitos?",
                    options: [
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "acquisition.new-products-request",
                        "acquisition.soft-decline"
                    ],
                    correct: 0,
                    explanation: "Es una consulta típica de 'acquisition.first-time-application' - un prospecto pidiendo información sobre requisitos para obtener el producto por primera vez."
                },
                {
                    case: "Me llegó un correo diciendo que me rechazaron la solicitud. ¿Por qué no me aprobaron?",
                    options: [
                        "acquisition.soft-decline",
                        "acquisition.first-time-application",
                        "acquisition.opt-out",
                        "acquisition.invite"
                    ],
                    correct: 0,
                    explanation: "Esto es 'acquisition.soft-decline' - cuando un prospecto declinado pregunta por el estado o razones de la declinación."
                },
                {
                    case: "¿Cómo puedo invitar a un amigo a Nu? No encuentro la opción en la app.",
                    options: [
                        "others.referrals",
                        "acquisition.first-time-application",
                        "others.app-issues",
                        "notification.unsubscribe"
                    ],
                    correct: 0,
                    explanation: "Esta es una consulta de 'others.referrals' - preguntas sobre el programa MGM (invitar amigos)."
                },
                {
                    case: "Ya no quiero seguir con el proceso de registro. ¿Cómo cancelo mi solicitud?",
                    options: [
                        "acquisition.opt-out",
                        "acquisition.soft-decline",
                        "acquisition.first-time-application",
                        "regsol.pep-edd-contacts"
                    ],
                    correct: 0,
                    explanation: "Esta es una consulta de 'acquisition.opt-out' - prospecto que desiste y quiere cancelar su proceso."
                },
                {
                    case: "Ya tengo la cuenta Nu, ¿cómo puedo obtener también la tarjeta de crédito?",
                    options: [
                        "acquisition.cross-sell",
                        "acquisition.first-time-application",
                        "acquisition.new-products-request",
                        "others.app-issues"
                    ],
                    correct: 0,
                    explanation: "Esta es una consulta de 'acquisition.cross-sell' - cliente existente que busca un producto adicional."
                },
                {
                    case: "La app se me cierra cada vez que trato de tomar la foto de mi cédula. No puedo avanzar.",
                    options: [
                        "acquisition.invite",
                        "others.app-issues",
                        "acquisition.first-time-application",
                        "acquisition.soft-decline"
                    ],
                    correct: 0,
                    explanation: "Esta es una consulta de 'acquisition.invite' - inconvenientes técnicos durante el proceso de adquisición."
                },
                {
                    case: "Me ofrecieron una tarjeta con cuota de manejo, pero yo no la quería. ¿Cómo la cancelo?",
                    options: [
                        "acquisition.unwanted-product-offer",
                        "acquisition.opt-out",
                        "acquisition.cross-sell",
                        "acquisition.first-time-application"
                    ],
                    correct: 0,
                    explanation: "Es 'acquisition.unwanted-product-offer' - usuario que terminó con un producto no deseado."
                },
                {
                    case: "¿Nu maneja préstamos personales? Me gustaría solicitar uno.",
                    options: [
                        "acquisition.new-products-request",
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "others.app-issues"
                    ],
                    correct: 0,
                    explanation: "Es 'acquisition.new-products-request' - consulta sobre productos que Nu no ofrece actualmente."
                },
                {
                    case: "No quiero recibir más correos promocionales de Nu. ¿Cómo me desuscribo?",
                    options: [
                        "notification.unsubscribe",
                        "acquisition.opt-out",
                        "others.app-issues",
                        "others.referrals"
                    ],
                    correct: 0,
                    explanation: "Es 'notification.unsubscribe' - cliente que quiere desactivar notificaciones no obligatorias."
                },
                {
                    case: "Los botones de mi app se ven desordenados y no encuentro algunas opciones.",
                    options: [
                        "others.app-issues",
                        "acquisition.invite",
                        "others.referrals",
                        "notification.unsubscribe"
                    ],
                    correct: 0,
                    explanation: "Es 'others.app-issues' - problemas visuales en la pantalla principal de la aplicación."
                },
                {
                    case: "Cancelé mi cuenta Nu hace unos meses y ahora quiero volver a tenerla.",
                    options: [
                        "other.reactivate-request-savings",
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "acquisition.opt-out"
                    ],
                    correct: 0,
                    explanation: "Es 'other.reactivate-request-savings' - excliente que desea reactivar su Cuenta Nu."
                },
                {
                    case: "Me llegó un correo pidiendo mi declaración de renta. ¿Es seguro?",
                    options: [
                        "regsol.pep-edd-contacts",
                        "acquisition.invite",
                        "acquisition.soft-decline",
                        "others.app-issues"
                    ],
                    correct: 0,
                    explanation: "Es 'regsol.pep-edd-contacts' - contacto relacionado con solicitudes de información adicional por Regsol."
                }
            ],
            humaniza: [
                {
                    query: "¿Cuándo me llega mi tarjeta de crédito?",
                    macro: "Su tarjeta será enviada en un plazo de 7 a 10 días hábiles a la dirección registrada.",
                    ideal: "¡Hola! Entiendo tu emoción por recibir tu nueva tarjeta Nu. Te llegará en un plazo de 7 a 10 días hábiles a la dirección que registraste. Mientras tanto, puedes ir preparándote para disfrutar todos los beneficios. ¿Hay algo más en lo que pueda ayudarte?"
                },
                {
                    query: "Mi solicitud fue rechazada, ¿por qué?",
                    macro: "Su solicitud no cumplió con los criterios de evaluación establecidos por la entidad.",
                    ideal: "Entiendo que recibir esta noticia puede ser frustrante. Aunque no podemos dar detalles específicos por políticas de privacidad, te invito a volver a intentarlo en unos meses, ya que nuestros criterios pueden cambiar. ¡No te desanimes, seguimos aquí para cuando quieras intentarlo de nuevo!"
                },
                {
                    query: "¿Cómo cancelo mi cuenta?",
                    macro: "Para cancelar su cuenta debe dirigirse a la sección de configuración en la aplicación.",
                    ideal: "Lamento que hayas decidido irte. Antes de proceder, ¿podrías contarme si hay algo específico que no te gustó? Tu opinión es muy valiosa para nosotros. Si definitivamente quieres cancelar, puedes hacerlo desde la sección de configuración en tu app."
                },
                {
                    query: "No me funciona la app, se cierra sola",
                    macro: "Debe actualizar la aplicación a la versión más reciente desde la tienda de aplicaciones.",
                    ideal: "¡Qué frustrante debe ser eso! Te entiendo perfectamente. Intentemos solucionarlo juntos. Primero, ¿podrías verificar si tienes la versión más reciente de la app? Si el problema persiste, podemos explorar otras opciones. Estoy aquí para ayudarte hasta resolverlo."
                },
                {
                    query: "¿Por qué me cobran cuota de manejo en mi tarjeta?",
                    macro: "La cuota de manejo es un costo asociado al mantenimiento de su producto financiero.",
                    ideal: "Entiendo tu pregunta sobre la cuota de manejo. Te explico: es un costo que nos ayuda a mantener todos los servicios y beneficios de tu producto. Sin embargo, déjame verificar si hay alguna promoción o beneficio que puedas aprovechar para optimizar estos costos."
                },
                {
                    query: "No entiendo por qué me negaron el crédito",
                    macro: "La evaluación crediticia se basa en múltiples factores establecidos por la entidad.",
                    ideal: "Comprendo tu confusión, y es completamente normal sentirse así. Aunque no podemos compartir detalles específicos de la evaluación por temas de privacidad, te aseguro que puedes volver a aplicar más adelante. Cada situación es única y puede cambiar con el tiempo."
                },
                {
                    query: "Quiero hablar con un supervisor",
                    macro: "Su solicitud será escalada al área correspondiente.",
                    ideal: "Por supuesto, entiendo que quieras hablar con alguien más. Antes de conectarte con mi supervisor, ¿podrías contarme qué está pasando? Me gustaría intentar ayudarte primero, pero si prefieres hablar con otra persona, con mucho gusto te conecto."
                },
                {
                    query: "¿Cuánto es mi cupo de crédito?",
                    macro: "Su cupo de crédito se encuentra disponible en la sección de productos de la aplicación.",
                    ideal: "¡Excelente pregunta! Tu cupo aparece en la pantalla principal de tu app, en la sección de tu tarjeta de crédito. Si no lo ves claramente, puedo guiarte paso a paso para encontrarlo. ¿Te parece que revisemos juntos?"
                },
                {
                    query: "No puedo hacer pagos desde la app",
                    macro: "Verifique que tenga conexión a internet estable y fondos suficientes en su cuenta.",
                    ideal: "Entiendo lo molesto que debe ser no poder hacer tus pagos. Vamos a solucionarlo paso a paso. Primero, ¿podrías verificar tu conexión a internet? También revisemos si hay fondos suficientes. Si todo está bien, exploremos otras posibles causas juntos."
                },
                {
                    query: "¿Puedo aumentar mi cupo?",
                    macro: "Las solicitudes de aumento de cupo son evaluadas automáticamente por el sistema.",
                    ideal: "¡Qué bueno que quieras crecer con Nu! Los aumentos de cupo se evalúan automáticamente según tu comportamiento de pago y otros factores. Te sugiero mantener un buen historial crediticio, y el sistema podría ofrecerte un aumento en el futuro. ¿Tienes alguna meta específica en mente?"
                },
            ],
            aventura: {
                        start: {
                    title: "Cliente Frustrado",
                    text: "Recibes una llamada de María, una cliente que suena muy molesta: 'Llevo 3 días intentando activar mi tarjeta y nada funciona. Estoy pensando en cancelar todo.'",
                            choices: [
                                { text: "Lo siento, déjeme revisar su caso en el sistema.", next: "systematic" },
                                { text: "Entiendo tu frustración María, debe ser muy molesto. Cuéntame exactamente qué has intentado.", next: "empathetic" },
                                { text: "Las activaciones a veces fallan, es normal. ¿Siguió las instrucciones?", next: "dismissive" }
                            ]
                        },
                        systematic: {
                            title: "Enfoque Sistemático",
                    text: "María responde: 'Ya revisé todo con otros agentes. Solo quiero que funcione.' Su tono sigue siendo tenso.",
                            choices: [
                                { text: "Déjeme intentar algo diferente. ¿Puede abrir la app Nu mientras hablamos?", next: "solution" },
                                { text: "Comprendo que ya revisaste todo. Vamos a solucionarlo de una vez por todas.", next: "solution" }
                            ]
                        },
                        empathetic: {
                            title: "Enfoque Empático",
                    text: "María se calma un poco: 'Gracias por entenderme. He probado el SMS, la app, llamar... nada funciona.' Su tono es menos agresivo.",
                            choices: [
                                { text: "Has hecho todo correctamente María. Vamos a revisar juntos paso a paso.", next: "success" },
                                { text: "Perfecto, con esa información puedo ayudarte mejor. Empecemos de nuevo.", next: "success" }
                            ]
                        },
                        dismissive: {
                            title: "Enfoque Desestimativo",
                    text: "María se molesta más: '¡Por supuesto que seguí las instrucciones! ¿Creen que soy tonta?' Está considerando seriamente cancelar.",
                            choices: [
                                { text: "No quise implicar eso. Déjeme ayudarla de verdad.", next: "recovery" },
                                { text: "Entiendo, vamos a solucionarlo inmediatamente.", next: "recovery" }
                            ]
                        },
                        solution: {
                            title: "Resultado Positivo",
                    text: "Con paciencia y un enfoque estructurado, logras activar la tarjeta. María dice: 'Gracias, al fin funcionó. Aprecio su ayuda.'",
                            result: "success",
                            lesson: "Un enfoque sistemático combinado con paciencia puede resolver problemas técnicos efectivamente."
                        },
                        success: {
                            title: "Resultado Excelente",
                    text: "María se siente escuchada y valorada. Después de resolver el problema, dice: 'Muchas gracias por tu paciencia y comprensión. Definitivamente seguiré con Nu.'",
                            result: "success",
                            lesson: "La empatía genuina transforma experiencias negativas en oportunidades de fidelización."
                        },
                        recovery: {
                            title: "Recuperación Parcial",
                    text: "Logras resolver el problema técnico, pero María termina la llamada diciendo: 'Está solucionado, pero no me gustó cómo empezó esta conversación.'",
                            result: "partial",
                            lesson: "Las primeras impresiones son cruciales. Una mala entrada puede afectar toda la experiencia."
                        }
                    },
            conocimiento: [
                {
                    question: "¿Cuál es el límite mínimo de ingresos para aplicar a la tarjeta de crédito Nu?",
                    options: ["$600,000", "$800,000", "$1,200,000", "$1,500,000"],
                    correct: 1,
                    type: "single",
                    explanation: "El límite mínimo de ingresos para la tarjeta de crédito Nu es de $800,000 mensuales."
                },
                {
                    question: "¿Qué documentos son válidos para el proceso de registro? (Selecciona todas las opciones correctas)",
                    options: ["Cédula de ciudadanía", "Cédula de extranjería", "Pasaporte", "Licencia de conducción"],
                    correct: [0, 1, 2],
                    type: "multiple",
                    explanation: "Son válidos: cédula de ciudadanía, cédula de extranjería y pasaporte. La licencia de conducción NO es válida."
                },
                {
                    question: "¿Cuál es la cuota de manejo mensual de la tarjeta NuControl?",
                    options: ["$0", "$10,000", "$15,000", "$20,000"],
                    correct: 2,
                    type: "single",
                    explanation: "La tarjeta NuControl tiene una cuota de manejo mensual de $15,000."
                },
                {
                    question: "¿En cuántos días hábiles se entrega una tarjeta de crédito Nu?",
                    options: ["3-5 días", "5-7 días", "7-10 días", "10-15 días"],
                    correct: 2,
                    type: "single",
                    explanation: "Las tarjetas de crédito Nu se entregan en un plazo de 7 a 10 días hábiles."
                },
                {
                    question: "¿Cuáles son características del tono Nu? (Selecciona todas las correctas)",
                    options: ["Cercano y empático", "Formal y distante", "Simple y didáctico", "Técnico y complejo"],
                    correct: [0, 2],
                    type: "multiple",
                    explanation: "El tono Nu debe ser cercano, empático, simple y didáctico. Evitamos ser formales, distantes o técnicos."
                },
                {
                    question: "¿Qué edad mínima se requiere para aplicar a productos Nu?",
                    options: ["16 años", "18 años", "21 años", "25 años"],
                    correct: 1,
                    type: "single",
                    explanation: "La edad mínima para aplicar a productos Nu es de 18 años (mayoría de edad)."
                },
                {
                    question: "¿Cuáles de estos contact reasons están permitidos para Vanguard/Venus? (Selecciona todas las correctas)",
                    options: ["acquisition.first-time-application", "acquisition.invite", "acquisition.cross-sell", "acquisition.opt-out"],
                    correct: [0, 2, 3],
                    type: "multiple",
                    explanation: "Están permitidos: first-time-application, cross-sell y opt-out. El acquisition.invite NO está permitido para Vanguard/Venus."
                },
                {
                    question: "¿Cuál es el proceso correcto cuando un cliente está frustrado?",
                    options: ["Derivar inmediatamente", "Validar sus sentimientos primero", "Explicar las políticas", "Ofrecer descuentos"],
                    correct: 1,
                    type: "single",
                    explanation: "Siempre debemos validar los sentimientos del cliente primero, mostrar empatía antes de ofrecer soluciones."
                }
            ],
            memoria: [
                {
                    case: "Cliente: 'Hola, soy nuevo en Nu y quiero saber qué documentos necesito para completar mi registro. También me gustaría conocer cuánto tiempo toma el proceso de aprobación.'",
                    options: [
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "acquisition.invite",
                        "acquisition.soft-decline"
                    ],
                    correct: 0,
                    explanation: "Es una consulta típica de 'acquisition.first-time-application' - prospecto pidiendo información sobre requisitos."
                },
                {
                    case: "Cliente: 'Intenté tomar la foto de mi cédula en la app pero se cierra automáticamente. He reiniciado el teléfono varias veces pero sigue pasando lo mismo.'",
                    options: [
                        "acquisition.invite",
                        "others.app-issues",
                        "acquisition.first-time-application",
                        "acquisition.opt-out"
                    ],
                    correct: 0,
                    explanation: "Problemas técnicos durante el proceso de registro son 'acquisition.invite'."
                },
                {
                    case: "Cliente: 'Ya tengo la cuenta Nu desde hace 6 meses y veo que en la app me aparece una oferta para la tarjeta de crédito. ¿Cómo puedo aplicar?'",
                    options: [
                        "acquisition.cross-sell",
                        "acquisition.first-time-application",
                        "acquisition.new-products-request",
                        "others.app-issues"
                    ],
                    correct: 0,
                    explanation: "Cliente existente interesado en producto adicional es 'acquisition.cross-sell'."
                },
                {
                    case: "Prospecto frustrado: 'Me rechazaron la solicitud de la tarjeta y no entiendo por qué. Tengo buenos ingresos y nunca he tenido problemas crediticios.'",
                    options: [
                        "acquisition.soft-decline",
                        "acquisition.first-time-application",
                        "acquisition.invite",
                        "regsol.pep-edd-contacts"
                    ],
                    correct: 0,
                    explanation: "Cuando un prospecto declinado pregunta por las razones, es 'acquisition.soft-decline'."
                },
                {
                    case: "Cliente: 'Ya no quiero recibir más correos promocionales de Nu. Me llegan muchos al día y es molesto. ¿Cómo me desuscribo?'",
                    options: [
                        "acquisition.opt-out",
                        "notification.unsubscribe",
                        "others.app-issues",
                        "others.referrals"
                    ],
                    correct: 1,
                    explanation: "Solicitud para desactivar notificaciones se clasifica como 'notification.unsubscribe'."
                },
                {
                    case: "Cliente: 'Quiero invitar a mi esposa a Nu pero no encuentro cómo hacerlo en la app. ¿Hay algún programa de referidos?'",
                    options: [
                        "others.referrals",
                        "others.app-issues",
                        "acquisition.first-time-application",
                        "notification.unsubscribe"
                    ],
                    correct: 0,
                    explanation: "Preguntas sobre invitar amigos/familiares son 'others.referrals'."
                },
                {
                    case: "Prospecto: 'Me llegó un correo de Nu pidiendo mi declaración de renta y otros documentos. ¿Es esto normal y seguro?'",
                    options: [
                        "regsol.pep-edd-contacts",
                        "acquisition.invite",
                        "acquisition.soft-decline",
                        "others.app-issues"
                    ],
                    correct: 0,
                    explanation: "Contactos sobre documentos adicionales solicitados por Regsol son 'regsol.pep-edd-contacts'."
                },
                {
                    case: "Cliente confundido: 'Yo solicité una tarjeta de crédito normal pero me dieron una con cuota de manejo. No entiendo por qué.'",
                    options: [
                        "acquisition.unwanted-product-offer",
                        "acquisition.cross-sell",
                        "acquisition_fee_card_general_doubts",
                        "others.app-issues"
                    ],
                    correct: 0,
                    explanation: "Cliente con producto no deseado por malentendido es 'acquisition.unwanted-product-offer'."
                },
                {
                    case: "Prospecto: '¿Nu maneja préstamos de libre inversión o créditos de vehículo? Necesito financiación para comprar un carro.'",
                    options: [
                        "acquisition.new-products-request",
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "acquisition.cdts_doubts"
                    ],
                    correct: 0,
                    explanation: "Consulta sobre productos no ofertados por Nu es 'acquisition.new-products-request'."
                },
                {
                    case: "Cliente: 'Cancelé mi cuenta Nu hace 8 meses pero ahora me arrepentí. ¿Puedo volver a abrirla con los mismos datos?'",
                    options: [
                        "other.reactivate-request-savings",
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "acquisition.opt-out"
                    ],
                    correct: 0,
                    explanation: "Excliente que quiere reactivar Cuenta Nu es 'other.reactivate-request-savings'."
                },
                {
                    case: "Cliente: 'Los botones de mi app Nu se ven raros y desordenados. Algunos no aparecen donde deberían estar.'",
                    options: [
                        "others.app-issues",
                        "acquisition.invite",
                        "others.referrals",
                        "notification.unsubscribe"
                    ],
                    correct: 0,
                    explanation: "Problemas visuales en la pantalla principal de la aplicación son 'others.app-issues'."
                },
                {
                    case: "Prospecto: 'Ya no me interesa continuar con el proceso de registro. Quiero cancelar mi solicitud y que eliminen mis datos.'",
                    options: [
                        "acquisition.opt-out",
                        "acquisition.soft-decline",
                        "other.reactivate-request",
                        "acquisition.unwanted-product-offer"
                    ],
                    correct: 0,
                    explanation: "Prospecto que desiste del proceso es 'acquisition.opt-out'."
                },
                {
                    case: "Cliente: 'Tengo la cuenta Nu pero cuando intento solicitar la tarjeta de crédito no me aparece la opción. ¿Por qué será?'",
                    options: [
                        "acquisition.cross-sell",
                        "others.app-issues",
                        "acquisition.soft-decline",
                        "acquisition.first-time-application"
                    ],
                    correct: 0,
                    explanation: "Cliente existente preguntando por producto adicional es 'acquisition.cross-sell'."
                },
                {
                    case: "Prospecto: 'Me ofrecieron la tarjeta NuControl con cuota de manejo mensual. ¿Qué beneficios tiene que la justifiquen?'",
                    options: [
                        "acquisition_fee_card_general_doubts",
                        "acquisition.first-time-application",
                        "acquisition.unwanted-product-offer",
                        "acquisition.soft-decline"
                    ],
                    correct: 0,
                    explanation: "Dudas específicas sobre la tarjeta NuControl son 'acquisition_fee_card_general_doubts'."
                },
                {
                    case: "Cliente: 'Las misiones que me aparecen en la app para activar mi producto no funcionan. No puedo completar ninguna.'",
                    options: [
                        "acquisition.offer-product.basic.onboarding",
                        "others.app-issues",
                        "acquisition.cross-sell",
                        "notification.unsubscribe"
                    ],
                    correct: 0,
                    explanation: "Problemas con las misiones de activación son 'acquisition.offer-product.basic.onboarding'."
                },
                {
                    case: "Prospecto: 'Quiero invertir en un CDT con Nu pero no sé qué documentos necesito ni cómo es el proceso.'",
                    options: [
                        "acquisition.cdts_doubts",
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "acquisition.new-products-request"
                    ],
                    correct: 0,
                    explanation: "Consultas sobre CDTs de prospectos son 'acquisition.cdts_doubts'."
                },
                {
                    case: "Cliente: 'Cancelé mi tarjeta de crédito Nu el año pasado pero ahora la necesito de nuevo. ¿Puedo reactivarla?'",
                    options: [
                        "other.reactivate-request",
                        "acquisition.first-time-application",
                        "acquisition.cross-sell",
                        "acquisition.opt-out"
                    ],
                    correct: 0,
                    explanation: "Excliente que quiere reactivar tarjeta de crédito es 'other.reactivate-request'."
                },
                {
                    case: "Cliente molesto: 'Mi tarjeta fue declinada en el supermercado frente a todos. Es muy vergonzoso. ¿Por qué pasa esto?'",
                    options: [
                        "acquisition.soft-decline",
                        "others.app-issues",
                        "acquisition.cross-sell",
                        "notification.unsubscribe"
                    ],
                    correct: 1,
                    explanation: "Problemas con el funcionamiento de la tarjeta se clasifican como 'others.app-issues'."
                }
            ]
        };
    }

    // Activity: Clasifica el Caso
    loadRandomCase() {
        const data = this.getAcademyData();
        const cases = data.clasifica;
        this.currentCase = cases[Math.floor(Math.random() * cases.length)];
        
        document.getElementById('case-text').textContent = this.currentCase.case;
        
        const optionsContainer = document.getElementById('classification-options');
        optionsContainer.innerHTML = '';
        
        this.currentCase.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'classification-option';
            optionDiv.textContent = option;
            optionDiv.onclick = () => this.selectCaseOption(index);
            optionsContainer.appendChild(optionDiv);
        });
        
        // Hide feedback and button
        document.getElementById('case-feedback').style.display = 'none';
        document.getElementById('next-case-btn').style.display = 'none';
    }

    selectCaseOption(selectedIndex) {
        const options = document.querySelectorAll('.classification-option');
        const isCorrect = selectedIndex === this.currentCase.correct;
        
        options.forEach((option, index) => {
            option.style.pointerEvents = 'none';
            if (index === this.currentCase.correct) {
                option.classList.add('correct');
            } else if (index === selectedIndex && !isCorrect) {
                option.classList.add('incorrect');
            }
        });
        
        document.getElementById('case-explanation').textContent = this.currentCase.explanation;
        document.getElementById('case-feedback').style.display = 'block';
        document.getElementById('next-case-btn').style.display = 'block';
    }

    // Activity: Humaniza la Macro
    loadRandomHumanizeCase() {
        const data = this.getAcademyData();
        const cases = data.humaniza;
        this.currentHumanizeCase = cases[Math.floor(Math.random() * cases.length)];
        
        document.getElementById('client-query').textContent = this.currentHumanizeCase.query;
        document.getElementById('robotic-macro').textContent = this.currentHumanizeCase.macro;
        document.getElementById('user-humanized').value = '';
        document.getElementById('comparison-result').style.display = 'none';
    }

    showHumanizedComparison() {
        document.getElementById('ideal-response').textContent = this.currentHumanizeCase.ideal;
        document.getElementById('comparison-result').style.display = 'block';
    }

    // Activity: Aventura de Soporte
    showAdventureMenu() {
        console.log('showAdventureMenu called');
        
        // Hide all adventure sections
        const adventureMenu = document.getElementById('adventure-menu');
        const adventureProgress = document.getElementById('adventure-progress');
        const storyContainer = document.getElementById('story-container');
        const adventureResult = document.getElementById('adventure-result');
        
        console.log('Adventure elements:', {
            adventureMenu,
            adventureProgress,
            storyContainer,
            adventureResult
        });
        
        if (adventureMenu) adventureMenu.style.display = 'block';
        if (adventureProgress) adventureProgress.style.display = 'none';
        if (storyContainer) storyContainer.style.display = 'none';
        if (adventureResult) adventureResult.style.display = 'none';
    }

    selectAdventureScenario(scenarioId) {
        console.log('selectAdventureScenario called with:', scenarioId);
        this.currentScenarioId = scenarioId;
        this.startAdventureScenario();
    }

    selectRandomAdventure() {
        const data = this.getAcademyData();
        const scenarios = data.aventura.scenarios;
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        this.currentScenarioId = randomScenario.id;
        this.startAdventureScenario();
    }

    startAdventureScenario() {
        const data = this.getAcademyData();
        const scenarios = data.aventura.scenarios;
        this.currentAdventure = scenarios.find(s => s.id === this.currentScenarioId);
        
        if (!this.currentAdventure) {
            console.error('Scenario not found:', this.currentScenarioId);
            return;
        }

        this.adventureStep = 'start';
        this.adventureStepCount = 1;
        this.clientMood = 'neutral';
        
        this.showAdventureProgress();
        this.showAdventureStep();
    }

    showAdventureProgress() {
        document.getElementById('adventure-menu').style.display = 'none';
        document.getElementById('adventure-progress').style.display = 'block';
        
        // Update progress info
        const scenarioTitles = {
            'frustrated_client': 'Cliente Frustrado - María',
            'confused_prospect': 'Prospecto Confundido - Carlos',
            'payment_issue': 'Problema de Pago - Ana',
            'cross_sell_opportunity': 'Oportunidad de Venta - Luis'
        };
        
        document.getElementById('adventure-scenario-title').textContent = scenarioTitles[this.currentScenarioId] || 'Escenario en Progreso';
        document.getElementById('step-indicator').textContent = `Paso ${this.adventureStepCount}`;
        
        // Update client mood
        const moodEmojis = {
            'happy': '😊 Contento',
            'neutral': '😐 Neutral',
            'frustrated': '😤 Frustrado',
            'confused': '🤔 Confundido',
            'satisfied': '😌 Satisfecho'
        };
        
        document.getElementById('client-mood').textContent = moodEmojis[this.clientMood] || '😐 Neutral';
    }

    showAdventureStep() {
        const step = this.currentAdventure[this.adventureStep];
        
        if (!step) {
            console.error('Step not found:', this.adventureStep);
            return;
        }
        
        document.getElementById('story-container').style.display = 'block';
        
        // Update client avatar based on scenario
        const avatars = {
            'frustrated_client': '👩‍💼',
            'confused_prospect': '👨‍💻',
            'payment_issue': '👩‍🦱',
            'cross_sell_opportunity': '👨‍🔧'
        };
        
        document.getElementById('client-avatar').textContent = avatars[this.currentScenarioId] || '👤';
        document.getElementById('adventure-title').textContent = step.title;
        document.getElementById('adventure-text').textContent = step.text;
        
        // Update client mood based on step
        if (step.title.includes('Frustrado') || step.title.includes('molesta')) {
            this.clientMood = 'frustrated';
        } else if (step.title.includes('Confundido')) {
            this.clientMood = 'confused';
        } else if (step.title.includes('Excelente') || step.title.includes('Éxito')) {
            this.clientMood = 'happy';
        } else if (step.title.includes('satisfecho') || step.title.includes('Satisfecho')) {
            this.clientMood = 'satisfied';
        }
        
        this.showAdventureProgress(); // Update mood display
        
        const choicesContainer = document.getElementById('adventure-choices');
        choicesContainer.innerHTML = '';
        
        if (step.choices) {
            step.choices.forEach((choice, index) => {
                const choiceDiv = document.createElement('div');
                choiceDiv.className = 'adventure-choice';
                
                // Add choice quality indicator
                const qualityClass = this.getChoiceQuality(choice.text);
                choiceDiv.classList.add(qualityClass);
                
                choiceDiv.innerHTML = `
                    <div class="choice-text">${choice.text}</div>
                    <div class="choice-indicator">${this.getChoiceIcon(qualityClass)}</div>
                `;
                
                choiceDiv.onclick = () => this.makeAdventureChoice(choice.next);
                choicesContainer.appendChild(choiceDiv);
            });
        } else if (step.result) {
            // Final result
            this.showAdventureResult(step);
        }
    }

    getChoiceQuality(choiceText) {
        // Analyze choice text to determine quality
        const empathetic = ['entiendo', 'comprendo', 'lamento', 'siento', 'ayudarte', 'juntos', 'contarme'];
        const neutral = ['revisar', 'verificar', 'información', 'proceso'];
        const poor = ['normal', 'siempre', 'debe', 'siguió', 'instrucciones'];
        
        const lowerText = choiceText.toLowerCase();
        
        if (empathetic.some(word => lowerText.includes(word))) {
            return 'choice-empathetic';
        } else if (poor.some(word => lowerText.includes(word))) {
            return 'choice-poor';
        } else {
            return 'choice-neutral';
        }
    }

    getChoiceIcon(qualityClass) {
        switch (qualityClass) {
            case 'choice-empathetic': return '💜';
            case 'choice-neutral': return '💬';
            case 'choice-poor': return '⚠️';
            default: return '💬';
        }
    }

    makeAdventureChoice(nextStep) {
        this.adventureStep = nextStep;
        this.adventureStepCount++;
        
        const step = this.currentAdventure[nextStep];
        
        if (step && step.result) {
            this.showAdventureResult(step);
        } else {
            this.showAdventureStep();
        }
    }

    showAdventureResult(step) {
        document.getElementById('story-container').style.display = 'none';
        document.getElementById('adventure-result').style.display = 'block';
        
        // Update result based on outcome
        const resultIcons = {
            'success': '🎉',
            'partial': '👍',
            'neutral': '😐',
            'failure': '😞'
        };
        
        document.getElementById('result-icon').textContent = resultIcons[step.result] || '🎉';
        document.getElementById('result-title').textContent = step.title;
        document.getElementById('result-text').textContent = step.text;
        document.getElementById('result-lesson').textContent = step.lesson || step.message;
    }

    startAdventure() {
        // Legacy method - redirect to new menu system
        this.showAdventureMenu();
    }

    startNewAdventure() {
        this.selectRandomAdventure();
    }

    // Activity: Ronda de Conocimiento
    startQuiz() {
        const data = this.getAcademyData();
        this.quizQuestions = [...data.conocimiento].sort(() => 0.5 - Math.random());
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        
        document.getElementById('quiz-feedback').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'none';
        
        this.showQuizQuestion();
    }

    showQuizQuestion() {
        console.log('showQuizQuestion called');
        const question = this.quizQuestions[this.currentQuizIndex];
        console.log('Current question:', question);
        
        if (!question) {
            console.error('No question found at index:', this.currentQuizIndex);
            return;
        }
        
        // Reset selected answers for multiple choice
        this.selectedAnswers = [];
        
        // Update progress
        const progress = ((this.currentQuizIndex + 1) / this.quizQuestions.length) * 100;
        const progressFill = document.getElementById('quiz-progress-fill');
        const progressText = document.getElementById('quiz-progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (progressText) {
            progressText.textContent = `Pregunta ${this.currentQuizIndex + 1} de ${this.quizQuestions.length}`;
        }
        
        const questionElement = document.getElementById('quiz-question');
        if (questionElement) {
            // Add instruction for multiple choice questions
            let questionText = question.question;
            if (question.type === 'multiple') {
                questionText += ' (Puedes seleccionar múltiples opciones)';
            }
            questionElement.textContent = questionText;
        } else {
            console.error('quiz-question element not found');
        }
        
        const optionsContainer = document.getElementById('academy-quiz-options');
        console.log('Options container:', optionsContainer);
        
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            
            if (!question.options || !Array.isArray(question.options)) {
                console.error('Question options not found or not an array:', question.options);
                return;
            }
            
            question.options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'quiz-option';
                optionDiv.textContent = option;
                
                if (question.type === 'multiple') {
                    optionDiv.onclick = () => this.selectMultipleQuizOption(index);
                } else {
                    optionDiv.onclick = () => this.selectSingleQuizOption(index);
                }
                
                optionsContainer.appendChild(optionDiv);
                console.log('Added option:', option);
            });
            
            // Add submit button for multiple choice
            if (question.type === 'multiple') {
                const submitBtn = document.createElement('button');
                submitBtn.className = 'academy-btn primary';
                submitBtn.textContent = 'Confirmar Respuestas';
                submitBtn.id = 'quiz-submit-btn';
                submitBtn.disabled = true;
                submitBtn.onclick = () => this.submitQuizAnswer();
                optionsContainer.appendChild(submitBtn);
            }
            
            // Make sure the quiz container is visible
            const quizContainer = document.querySelector('.quiz-container');
            if (quizContainer) {
                quizContainer.style.display = 'block';
            }
            
        } else {
            console.error('academy-quiz-options container not found');
        }
    }

    selectSingleQuizOption(selectedIndex) {
        // Remove previous selections
        document.querySelectorAll('#academy-quiz-options .quiz-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Select current option
        document.querySelectorAll('#academy-quiz-options .quiz-option')[selectedIndex].classList.add('selected');
        this.selectedAnswers = [selectedIndex];
        
        // Auto-submit for single choice
        setTimeout(() => this.submitQuizAnswer(), 500);
    }

    selectMultipleQuizOption(selectedIndex) {
        const optionElement = document.querySelectorAll('#academy-quiz-options .quiz-option')[selectedIndex];
        
        if (this.selectedAnswers.includes(selectedIndex)) {
            // Deselect
            this.selectedAnswers = this.selectedAnswers.filter(i => i !== selectedIndex);
            optionElement.classList.remove('selected');
        } else {
            // Select
            this.selectedAnswers.push(selectedIndex);
            optionElement.classList.add('selected');
        }
        
        // Enable/disable submit button
        const submitBtn = document.getElementById('quiz-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = this.selectedAnswers.length === 0;
        }
    }

    submitQuizAnswer() {
        const question = this.quizQuestions[this.currentQuizIndex];
        let isCorrect = false;
        
        if (question.type === 'multiple') {
            // Check if arrays are equal (same elements, same length)
            const correctAnswers = question.correct.sort();
            const selectedAnswers = this.selectedAnswers.sort();
            isCorrect = correctAnswers.length === selectedAnswers.length && 
                       correctAnswers.every((val, index) => val === selectedAnswers[index]);
        } else {
            // Single choice
            isCorrect = this.selectedAnswers.length === 1 && this.selectedAnswers[0] === question.correct;
        }
        
        if (isCorrect) {
            this.quizScore++;
        }
        
        // Show feedback
        this.showQuizFeedback(isCorrect, question);
    }

    showQuizFeedback(isCorrect, question) {
        const options = document.querySelectorAll('#academy-quiz-options .quiz-option');
        
        // Disable all options
        options.forEach(option => {
            option.style.pointerEvents = 'none';
        });
        
        // Highlight correct answers
        if (question.type === 'multiple') {
            question.correct.forEach(correctIndex => {
                options[correctIndex].classList.add('correct');
            });
            
            // Highlight incorrect selections
            this.selectedAnswers.forEach(selectedIndex => {
                if (!question.correct.includes(selectedIndex)) {
                    options[selectedIndex].classList.add('incorrect');
                }
            });
        } else {
            options[question.correct].classList.add('correct');
            
            // Highlight incorrect selection if any
            this.selectedAnswers.forEach(selectedIndex => {
                if (selectedIndex !== question.correct) {
                    options[selectedIndex].classList.add('incorrect');
                }
            });
        }
        
        // Show explanation
        document.getElementById('quiz-explanation').textContent = question.explanation;
        document.getElementById('quiz-feedback').style.display = 'block';
        
        // Update next button text
        const nextBtn = document.getElementById('next-question-btn');
        if (this.currentQuizIndex === this.quizQuestions.length - 1) {
            nextBtn.textContent = 'Ver Resultados';
        } else {
            nextBtn.textContent = 'Siguiente Pregunta';
        }
        
        // Hide submit button for multiple choice
        const submitBtn = document.getElementById('quiz-submit-btn');
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
    }

    nextQuizQuestion() {
        if (this.currentQuizIndex < this.quizQuestions.length - 1) {
            this.currentQuizIndex++;
            document.getElementById('quiz-feedback').style.display = 'none';
            
            // Reset options
            document.querySelectorAll('#academy-quiz-options .quiz-option').forEach(option => {
                option.classList.remove('correct', 'incorrect', 'selected');
                option.style.pointerEvents = 'auto';
            });
            
            this.showQuizQuestion();
        } else {
            this.showQuizResults();
        }
    }

    showQuizResults() {
        document.getElementById('quiz-feedback').style.display = 'none';
        document.getElementById('final-quiz-score').textContent = this.quizScore;
        document.getElementById('total-questions').textContent = this.quizQuestions.length;
        
        const percentage = (this.quizScore / this.quizQuestions.length) * 100;
        let message = '';
        
        if (percentage === 100) {
            message = '¡Perfecto! Tienes un dominio excelente del conocimiento.';
        } else if (percentage >= 80) {
            message = '¡Muy bien! Tienes un buen nivel de conocimiento.';
        } else if (percentage >= 60) {
            message = 'Buen trabajo, pero hay espacio para mejorar.';
        } else {
            message = 'Sigue estudiando. La práctica hace al maestro.';
        }
        
        document.getElementById('quiz-message').textContent = message;
        document.getElementById('quiz-results').style.display = 'block';
    }

    // Activity: Retos de Memoria
    showMemoryMenu() {
        // Hide all memory sections
        document.getElementById('memory-menu').style.display = 'block';
        document.getElementById('memory-progress').style.display = 'none';
        document.getElementById('memory-reading').style.display = 'none';
        document.getElementById('memory-question').style.display = 'none';
        document.getElementById('memory-result').style.display = 'none';
        document.getElementById('memory-final-results').style.display = 'none';
    }

    startMemoryChallenge(challengeType) {
        this.memoryChallengeType = challengeType;
        this.currentMemoryIndex = 0;
        this.memoryScore = 0;
        this.memoryTimes = [];
        
        // Configure challenge based on type
        const challenges = this.getMemoryChallengeConfig();
        this.currentMemoryChallenge = challenges[challengeType];
        
        // Get random cases for this challenge
        const data = this.getAcademyData();
        const allCases = data.memoria;
        this.memoryCases = [...allCases]
            .sort(() => 0.5 - Math.random())
            .slice(0, this.currentMemoryChallenge.totalCases);
        
        // Show progress and start first case
        this.showMemoryProgress();
        this.startMemoryCase();
    }

    getMemoryChallengeConfig() {
        return {
            speed: {
                name: 'Reto de Velocidad',
                totalCases: 5,
                timePerCase: 5,
                description: '5 casos en 5 segundos cada uno'
            },
            precision: {
                name: 'Reto de Precisión',
                totalCases: 3,
                timePerCase: 7,
                description: '3 casos complejos en 7 segundos'
            },
            extreme: {
                name: 'Reto Extremo',
                totalCases: 10,
                timePerCase: 3,
                description: '10 casos en 3 segundos cada uno'
            },
            marathon: {
                name: 'Maratón Mental',
                totalCases: 15,
                timePerCase: null, // Variable time
                description: '15 casos aleatorios variando tiempo'
            }
        };
    }

    showMemoryProgress() {
        document.getElementById('memory-menu').style.display = 'none';
        document.getElementById('memory-progress').style.display = 'block';
        
        document.getElementById('challenge-title').textContent = this.currentMemoryChallenge.name;
        document.getElementById('current-challenge').textContent = `Caso ${this.currentMemoryIndex + 1}`;
        document.getElementById('total-challenges').textContent = this.currentMemoryChallenge.totalCases;
        document.getElementById('memory-score').textContent = this.memoryScore;
        
        const progress = ((this.currentMemoryIndex) / this.currentMemoryChallenge.totalCases) * 100;
        document.getElementById('memory-progress-fill').style.width = `${progress}%`;
    }

    startMemoryCase() {
        if (this.currentMemoryIndex >= this.currentMemoryChallenge.totalCases) {
            this.showMemoryFinalResults();
            return;
        }

        const currentCase = this.memoryCases[this.currentMemoryIndex];
        
        // Hide other sections
        document.getElementById('memory-question').style.display = 'none';
        document.getElementById('memory-result').style.display = 'none';
        
        // Show reading section
        document.getElementById('memory-reading').style.display = 'block';
        document.getElementById('memory-case-text').textContent = currentCase.case;
        
        // Determine time for this case
        let timeForCase = this.currentMemoryChallenge.timePerCase;
        if (this.memoryChallengeType === 'marathon') {
            // Variable time for marathon: 3, 5, or 7 seconds randomly
            timeForCase = [3, 5, 7][Math.floor(Math.random() * 3)];
        }
        
        // Start timer
        this.memoryStartTime = Date.now();
        this.startMemoryTimer(timeForCase);
    }

    startMemoryTimer(seconds) {
        let timeLeft = seconds;
        document.getElementById('timer-text').textContent = `${timeLeft}s`;
        document.getElementById('timer-fill').style.width = '100%';
        
        this.memoryTimer = setInterval(() => {
            timeLeft--;
            document.getElementById('timer-text').textContent = `${timeLeft}s`;
            document.getElementById('timer-fill').style.width = `${(timeLeft / seconds) * 100}%`;
            
            if (timeLeft <= 0) {
                clearInterval(this.memoryTimer);
                this.showMemoryQuestion();
            }
        }, 1000);
    }

    // Stub methods to prevent errors
    initializeLiteLLM() {
        console.log("🤖 LiteLLM initialized");
    }
    
    initializeAcademy() {
        console.log("🎓 Academy initialized");
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    initializeTrainingSimulation() {
        console.log("📚 Training simulation initialized");
    }
    
    startTrainingQuiz() {
        console.log("🎯 Training quiz started");
    }

    // IA Integration - Local AI
    async initializeAI() {
        console.log('🤖 Inicializando IA Local...');
        
        const aiGenerateBtn = document.getElementById('aiGenerateBtn');
        const improveBtn = document.getElementById('improveResponseBtn');
        
        if (aiGenerateBtn) {
            aiGenerateBtn.addEventListener('click', () => this.generateAIResponse());
        }
        
        if (improveBtn) {
            improveBtn.addEventListener('click', () => this.improveResponse());
        }
    }

    async generateAIResponse() {
        const contextInput = document.getElementById('contextInput');
        const responseOutput = document.getElementById('responseOutput');
        const aiBtn = document.getElementById('aiGenerateBtn');
        const loader = aiBtn.querySelector('.ai-loader');
        
        if (!contextInput.value.trim()) {
            alert('Por favor, ingresa el contexto del cliente primero');
            return;
        }
        
        // Mostrar loading
        aiBtn.disabled = true;
        loader.classList.remove('hidden');
        
        // Simular procesamiento IA
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
            const selectedEmotion = document.querySelector('.emotion-btn.active');
            const emotion = selectedEmotion ? selectedEmotion.dataset.emotion : 'neutro';
            
            const aiResponse = this.generateLocalAIResponse(contextInput.value, emotion);
            
            // Efecto de escritura
            responseOutput.value = '';
            await this.typeWriter(responseOutput, aiResponse, 30);
            
        } catch (error) {
            console.error('Error IA:', error);
            responseOutput.value = 'Error generando respuesta. Inténtalo de nuevo.';
        } finally {
            aiBtn.disabled = false;
            loader.classList.add('hidden');
        }
    }

    generateLocalAIResponse(query, emotion = 'neutro') {
        const keywords = {
            tarjeta: {
                neutro: "Entiendo tu consulta sobre la tarjeta Nu. Para ayudarte mejor, verifica que esté activada y que tengas saldo disponible. Si persiste el problema, puedo guiarte paso a paso para solucionarlo.",
                molesto: "Lamento mucho la inconveniencia con tu tarjeta Nu. Comprendo tu frustración y te ayudo inmediatamente. Primero, revisemos juntos el estado de tu tarjeta para resolver esto rápidamente.",
                confundido: "Te ayudo a entender cómo funciona tu tarjeta Nu. Es muy sencillo: primero verifica que esté activada en la app, luego confirma que tengas saldo. ¿Te guío paso a paso?",
                satisfecho: "¡Excelente que uses tu tarjeta Nu! Me da gusto ayudarte. Para cualquier consulta sobre tu tarjeta, estoy aquí para apoyarte y hacer tu experiencia aún mejor.",
                preocupado: "Comprendo tu preocupación sobre tu tarjeta Nu. Tranquilo, vamos a revisar todo juntos para asegurarnos de que funcione perfectamente. Te guío paso a paso."
            },
            transferencia: {
                neutro: "Para realizar transferencias con Nu, puedes usar la app o la web. Necesitas los datos del destinatario y confirmar con tu clave. ¿En qué paso específico necesitas ayuda?",
                molesto: "Entiendo tu frustración con las transferencias. Te ayudo inmediatamente a resolver esto. Las transferencias con Nu son seguras y rápidas, déjame guiarte para completarla sin problemas.",
                confundido: "Las transferencias son muy fáciles con Nu. Te explico paso a paso: 1) Abre la app, 2) Selecciona 'Transferir', 3) Ingresa los datos, 4) Confirma. ¿Comenzamos?",
                satisfecho: "¡Genial que uses las transferencias de Nu! Son súper rápidas y seguras. Te ayudo con cualquier duda para que tengas la mejor experiencia posible.",
                preocupado: "Entiendo tu preocupación sobre las transferencias. Te aseguro que son muy seguras con Nu. Te explico todo el proceso para que te sientas completamente tranquilo."
            },
            saldo: {
                neutro: "Para consultar tu saldo en Nu, puedes usar la app, web o cajeros. Tu saldo se actualiza en tiempo real. ¿Necesitas ayuda para acceder a alguna de estas opciones?",
                molesto: "Comprendo tu preocupación por el saldo. Te ayudo inmediatamente a verificarlo. Con Nu puedes consultar tu saldo 24/7 sin costo. Déjame guiarte para que lo veas ahora mismo.",
                confundido: "Ver tu saldo es súper fácil. Te muestro las opciones: 1) App Nu (más rápido), 2) Web nu.com.mx, 3) Cualquier cajero. ¿Cuál prefieres que te explique?",
                satisfecho: "¡Excelente que monitorees tu saldo! Es una gran práctica financiera. Con Nu tienes múltiples formas de consultarlo. ¿Te muestro cuál es la más conveniente para ti?",
                preocupado: "Comprendo tu preocupación por verificar tu saldo. Con Nu puedes consultarlo de forma segura las 24 horas. Te muestro las opciones más confiables."
            },
            bloqueo: {
                neutro: "Si necesitas bloquear tu tarjeta Nu, puedes hacerlo inmediatamente desde la app o llamando a soporte. Es un proceso seguro y reversible. ¿Qué tipo de bloqueo necesitas?",
                molesto: "Entiendo la urgencia de bloquear tu tarjeta. Tranquilo, podemos hacerlo inmediatamente. Nu protege tu dinero 24/7. Te guío para bloquearlo ahora mismo y resolver tu situación.",
                confundido: "Bloquear tu tarjeta es un proceso de seguridad muy importante. Te explico las opciones: 1) Bloqueo temporal (puedes reactivar), 2) Bloqueo definitivo. ¿Cuál necesitas?",
                satisfecho: "¡Qué bueno que seas proactivo con la seguridad! Bloquear preventivamente es muy inteligente. Te muestro cómo hacerlo rápido y fácil con Nu.",
                preocupado: "Comprendo tu preocupación por la seguridad. Bloquear tu tarjeta es la decisión correcta. Te ayudo inmediatamente para que te sientas tranquilo."
            }
        };
        
        // Detectar palabra clave
        const queryLower = query.toLowerCase();
        let category = 'general';
        
        if (queryLower.includes('tarjeta') || queryLower.includes('card')) category = 'tarjeta';
        else if (queryLower.includes('transferir') || queryLower.includes('enviar') || queryLower.includes('transfer')) category = 'transferencia';
        else if (queryLower.includes('saldo') || queryLower.includes('dinero') || queryLower.includes('balance')) category = 'saldo';
        else if (queryLower.includes('bloquear') || queryLower.includes('block') || queryLower.includes('cancelar')) category = 'bloqueo';
        
        if (keywords[category] && keywords[category][emotion]) {
            return keywords[category][emotion];
        }
        
        // Respuesta general
        const generalResponses = {
            neutro: "Gracias por contactar a Nu. He revisado tu consulta y te proporciono la información correspondiente. ¿Hay algo específico en lo que pueda ayudarte adicional?",
            molesto: "Lamento mucho cualquier inconveniente que hayas experimentado. En Nu valoramos mucho tu confianza y queremos resolver tu situación inmediatamente. ¿Cómo puedo ayudarte mejor?",
            confundido: "Te ayudo a aclarar tu duda paso a paso. En Nu queremos que tengas la mejor experiencia, así que te explico todo de manera sencilla. ¿Por dónde empezamos?",
            satisfecho: "¡Me da mucho gusto poder ayudarte! En Nu estamos comprometidos con brindarte el mejor servicio. ¿En qué más puedo apoyarte para mejorar tu experiencia?",
            preocupado: "Comprendo tu preocupación y quiero ayudarte a resolverla. En Nu estamos aquí para apoyarte en todo momento. Te explico todo lo que necesitas saber."
        };
        
        return generalResponses[emotion] || generalResponses['neutro'];
    }

    async improveResponse() {
        const responseOutput = document.getElementById('responseOutput');
        
        if (!responseOutput.value.trim()) {
            alert('Primero genera o escribe una respuesta');
            return;
        }
        
        // Mejorar respuesta localmente
        const improved = this.improveLocalResponse(responseOutput.value);
        await this.typeWriter(responseOutput, improved, 30);
    }

    improveLocalResponse(originalResponse) {
        // Mejoras automáticas
        let improved = originalResponse;
        
        // Agregar empatía si no la tiene
        if (!improved.includes('entiendo') && !improved.includes('comprendo') && !improved.includes('lamento')) {
            improved = 'Entiendo tu situación. ' + improved;
        }
        
        // Agregar siguiente paso si no lo tiene
        if (!improved.includes('?') && !improved.includes('siguiente') && !improved.includes('ayudar')) {
            improved += ' ¿Te gustaría que te ayude con algo más específico?';
        }
        
        // Hacer más profesional
        improved = improved.replace(/ok/gi, 'perfecto');
        improved = improved.replace(/bye/gi, 'que tengas un excelente día');
        improved = improved.replace(/hola/gi, 'Hola, es un gusto atenderte');
        
        return improved;
    }

    async typeWriter(element, text, speed = 30) {
        element.value = '';
        for (let i = 0; i < text.length; i++) {
            element.value += text.charAt(i);
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NuSenseApp();
});

// Global functions for HTML onclick attributes
function closeModal(modalId) {
    if (window.app && window.app.closeModal) {
    window.app.closeModal(modalId);
    }
}

function initializeSimulation() {
    if (window.app && window.app.initializeTrainingSimulation) {
    window.app.initializeTrainingSimulation();
    }
}

function startTrainingQuiz() {
    if (window.app && window.app.startTrainingQuiz) {
        window.app.startTrainingQuiz();
    }
}
