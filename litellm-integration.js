/**
 * LiteLLM Integration for NuSense AIgent - SAFE VERSION
 * Provides fallback functionality when LiteLLM is not available
 */

class LiteLLMClient {
    constructor(config = {}) {
        this.apiKey = config.apiKey || 'demo-key';
        this.baseUrl = config.baseUrl || 'http://localhost:4000';
        this.model = config.model || 'gpt-3.5-turbo';
        this.fallbackEnabled = true;
        this.cache = new Map();
        this.isAvailable = false;
        
        console.log('✅ LiteLLM Client initialized in safe mode');
    }

    async testConnection() {
        this.isAvailable = false;
        console.log('LiteLLM connection: ❌ Using fallback mode');
        return false;
    }

    async generateResponse(context, emotion = 'neutral', topic = 'general') {
        return this.generateFallbackResponse(context, emotion, topic);
    }

    generateFallbackResponse(context, emotion, topic) {
        const emotionPrefixes = {
            'angry': 'Entiendo tu frustración. ',
            'confused': 'Te ayudo a aclarar esto. ',
            'happy': 'Me alegra poder ayudarte. ',
            'neutral': 'Hola, '
        };

        const topicResponses = {
            'payment': 'Con respecto a tu consulta de pagos, te ayudo a resolverla.',
            'card': 'Sobre tu tarjeta Nu, puedo asistirte con la información necesaria.',
            'transfer': 'Para transferencias, tenemos varias opciones disponibles.',
            'general': 'He revisado tu consulta y te proporciono la información correspondiente.'
        };

        const prefix = emotionPrefixes[emotion] || emotionPrefixes['neutral'];
        const response = topicResponses[topic] || topicResponses['general'];
        
        return `${prefix}${response}\n\n¿Hay algo específico en lo que pueda ayudarte adicional?`;
    }
}