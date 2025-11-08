import { GoogleGenerativeAI } from '@google/generative-ai';
import { BehaviorEntry, BehaviorAnalytics } from '@/types';
import { calculateBehaviorAnalytics } from './analytics';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ContextualChatConfig {
  apiKey: string;
  language: 'en' | 'es';
  behaviors: BehaviorEntry[];
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

export class ContextualChat {
  private genAI: GoogleGenerativeAI;
  private config: ContextualChatConfig;
  private chatHistory: ChatMessage[] = [];
  private analytics: BehaviorAnalytics | null = null;

  constructor(config: ContextualChatConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);

    // Calculate analytics from behavior data
    if (config.behaviors.length > 0) {
      this.analytics = calculateBehaviorAnalytics(config.behaviors);
    }
  }

  /**
   * Generate context summary from child's behavior data
   */
  private generateContextSummary(): string {
    const { behaviors } = this.config;

    if (behaviors.length === 0) {
      return this.config.language === 'es'
        ? 'No hay datos de comportamiento registrados aún.'
        : 'No behavior data has been recorded yet.';
    }

    const recentBehaviors = behaviors.slice(0, 20); // Last 20 entries
    const analytics = this.analytics!;

    const summary = this.config.language === 'es'
      ? `Contexto del niño:
- Total de registros de comportamiento: ${analytics.totalEntries}
- Severidad promedio: ${analytics.averageSeverity.toFixed(2)} de 5
- Función de comportamiento más común: ${analytics.mostCommonFunction}
- Distribución de severidad:
  * Leve: ${analytics.severityDistribution[1] || 0}
  * Moderada: ${analytics.severityDistribution[2] || 0}
  * Significativa: ${analytics.severityDistribution[3] || 0}
  * Severa: ${analytics.severityDistribution[4] || 0}
  * Crítica: ${analytics.severityDistribution[5] || 0}

Comportamientos recientes (últimos 20):
${recentBehaviors.map((b, i) => `${i + 1}. ${b.date} ${b.time} - ${b.behavior}
   Antecedente: ${b.antecedent}
   Consecuencia: ${b.consequence}
   Severidad: ${b.severity}/5
   Función: ${b.function}
   ${b.duration ? `Duración: ${b.duration} min` : ''}
   ${b.notes ? `Notas: ${b.notes}` : ''}`).join('\n\n')}`
      : `Child's Context:
- Total behavior entries: ${analytics.totalEntries}
- Average severity: ${analytics.averageSeverity.toFixed(2)} out of 5
- Most common behavior function: ${analytics.mostCommonFunction}
- Severity distribution:
  * Mild: ${analytics.severityDistribution[1] || 0}
  * Moderate: ${analytics.severityDistribution[2] || 0}
  * Significant: ${analytics.severityDistribution[3] || 0}
  * Severe: ${analytics.severityDistribution[4] || 0}
  * Critical: ${analytics.severityDistribution[5] || 0}

Recent behaviors (last 20):
${recentBehaviors.map((b, i) => `${i + 1}. ${b.date} ${b.time} - ${b.behavior}
   Antecedent: ${b.antecedent}
   Consequence: ${b.consequence}
   Severity: ${b.severity}/5
   Function: ${b.function}
   ${b.duration ? `Duration: ${b.duration} min` : ''}
   ${b.notes ? `Notes: ${b.notes}` : ''}`).join('\n\n')}`;

    return summary;
  }

  /**
   * Generate system prompt for the AI
   */
  private getSystemPrompt(): string {
    const contextSummary = this.generateContextSummary();

    if (this.config.language === 'es') {
      return `Eres un asistente experto en ABA (Análisis Aplicado del Comportamiento) que ayuda a padres de niños con necesidades especiales. Tu rol es proporcionar orientación personalizada, empática y basada en evidencia.

${contextSummary}

Directrices:
1. Siempre contextualiza tus respuestas basándote en los datos específicos del niño
2. Usa lenguaje claro, comprensible y empático apropiado para padres
3. Proporciona consejos prácticos y accionables
4. Destaca patrones en los datos cuando sea relevante
5. Sugiere estrategias de intervención basadas en las funciones del comportamiento
6. Sé alentador y positivo mientras eres honesto sobre los desafíos
7. Reconoce el progreso cuando sea evidente en los datos
8. Si no hay suficientes datos para dar una respuesta definitiva, sé honesto al respecto
9. Prioriza la seguridad y el bienestar del niño y la familia
10. Recomienda consultar con profesionales de ABA cuando sea apropiado

Recuerda: Estás hablando con un padre que está trabajando arduamente para apoyar a su hijo. Sé compasivo, alentador y útil.`;
    } else {
      return `You are an expert ABA (Applied Behavior Analysis) assistant helping parents of children with special needs. Your role is to provide personalized, empathetic, and evidence-based guidance.

${contextSummary}

Guidelines:
1. Always contextualize your responses based on the child's specific data
2. Use clear, understandable, and empathetic language appropriate for parents
3. Provide practical, actionable advice
4. Highlight patterns in the data when relevant
5. Suggest intervention strategies based on behavior functions
6. Be encouraging and positive while being honest about challenges
7. Acknowledge progress when evident in the data
8. If there isn't enough data to give a definitive answer, be honest about it
9. Prioritize the safety and well-being of the child and family
10. Recommend consulting with ABA professionals when appropriate

Remember: You're talking to a parent who is working hard to support their child. Be compassionate, encouraging, and helpful.`;
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(userMessage: string): Promise<string> {
    try {
      // Add user message to history
      const userChatMessage: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      };
      this.chatHistory.push(userChatMessage);
      this.config.onMessage?.(userChatMessage);

      // Build conversation history for Gemini
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: this.getSystemPrompt(),
      });

      const chat = model.startChat({
        history: this.chatHistory.slice(0, -1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response.text();

      // Add assistant response to history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      this.chatHistory.push(assistantMessage);
      this.config.onMessage?.(assistantMessage);

      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.config.onError?.(err);
      throw err;
    }
  }

  /**
   * Get chat history
   */
  getHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Clear chat history
   */
  clearHistory(): void {
    this.chatHistory = [];
  }

  /**
   * Update behavior data and recalculate analytics
   */
  updateBehaviors(behaviors: BehaviorEntry[]): void {
    this.config.behaviors = behaviors;
    if (behaviors.length > 0) {
      this.analytics = calculateBehaviorAnalytics(behaviors);
    } else {
      this.analytics = null;
    }
  }
}
