// Real-time voice conversation with Gemini Multimodal Live API
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BehaviorEntry, SeverityLevel, BehaviorFunction } from '@/types';

export interface VoiceConversationConfig {
  apiKey: string;
  language: 'en' | 'es';
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onBehaviorExtracted?: (behavior: Partial<BehaviorEntry>) => void;
  onError?: (error: Error) => void;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class VoiceConversation {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording = false;
  private config: VoiceConversationConfig;
  private conversationHistory: ConversationMessage[] = [];
  private audioChunks: Blob[] = [];
  private streamingSession: any = null;

  constructor(config: VoiceConversationConfig) {
    this.config = config;
    if (config.apiKey) {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp'
      });
    }
  }

  async startConversation() {
    if (!this.genAI) {
      throw new Error('API key not configured');
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: 16000 });

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.processAudioChunk(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      // Start recording
      this.mediaRecorder.start(100); // Capture data every 100ms for real-time processing
      this.isRecording = true;

      // Send initial prompt in the configured language
      await this.sendInitialPrompt();

    } catch (error) {
      console.error('Error starting conversation:', error);
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  private async sendInitialPrompt() {
    const prompts = {
      en: `You are an ABA (Applied Behavior Analysis) assistant helping to record behavior incidents.

Your role is to have a natural conversation to gather the following information:
1. Date and time of the incident (if not current)
2. Antecedent: What happened immediately before the behavior?
3. Behavior: Describe the observed behavior objectively
4. Consequence: What happened immediately after the behavior?
5. Severity: Rate from 1 (mild) to 5 (critical)
6. Function: Is it escape, attention-seeking, tangible/access, or sensory?
7. Duration in minutes (optional)
8. Location where it occurred (optional)
9. Any additional notes

Be conversational, empathetic, and guide the user naturally. Ask follow-up questions to clarify.
The user can interrupt you at any time. Listen actively.

Start by greeting the user and asking about the behavior incident.`,

      es: `Eres un asistente de ABA (Análisis Aplicado de la Conducta) que ayuda a registrar incidentes de conducta.

Tu rol es tener una conversación natural para recopilar la siguiente información:
1. Fecha y hora del incidente (si no es actual)
2. Antecedente: ¿Qué sucedió inmediatamente antes de la conducta?
3. Conducta: Describe la conducta observada objetivamente
4. Consecuencia: ¿Qué sucedió inmediatamente después de la conducta?
5. Severidad: Califica del 1 (leve) al 5 (crítico)
6. Función: ¿Es escape, búsqueda de atención, tangible/acceso, o sensorial?
7. Duración en minutos (opcional)
8. Ubicación donde ocurrió (opcional)
9. Notas adicionales

Sé conversacional, empático y guía al usuario naturalmente. Haz preguntas de seguimiento para aclarar.
El usuario puede interrumpirte en cualquier momento. Escucha activamente.

Comienza saludando al usuario y preguntando sobre el incidente de conducta.`
    };

    const systemPrompt = prompts[this.config.language];

    this.conversationHistory.push({
      role: 'assistant',
      content: systemPrompt,
      timestamp: Date.now(),
    });
  }

  private async processAudioChunk(audioBlob: Blob) {
    // For real-time processing with Gemini
    // Note: This is a simplified version. The actual Gemini Multimodal Live API
    // uses WebSocket connections for streaming. This implementation uses
    // the standard API with audio chunks.

    try {
      // Convert blob to base64 for Gemini API
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Process with Gemini (simplified approach)
        // In production, you'd use the streaming WebSocket API
        if (this.config.onTranscript) {
          this.config.onTranscript('Processing audio...', false);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }

  private async processRecording() {
    if (this.audioChunks.length === 0) return;

    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        await this.sendAudioToGemini(base64Audio);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing recording:', error);
      this.config.onError?.(error as Error);
    }
  }

  private async sendAudioToGemini(base64Audio: string) {
    if (!this.model) return;

    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: base64Audio,
          },
        },
        {
          text: `Previous conversation:\n${this.conversationHistory
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n')}\n\nContinue the conversation naturally based on the user's audio input. Extract any behavior incident information shared.`,
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      });

      // Notify listeners
      this.config.onResponse?.(text);

      // Try to extract structured behavior data
      await this.extractBehaviorData();

    } catch (error) {
      console.error('Error sending audio to Gemini:', error);
      this.config.onError?.(error as Error);
    }
  }

  async sendTextMessage(text: string) {
    if (!this.model) return;

    this.conversationHistory.push({
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });

    try {
      const result = await this.model.generateContent([
        {
          text: `Conversation history:\n${this.conversationHistory
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n')}\n\nUser says: ${text}\n\nRespond naturally and continue gathering behavior incident information.`,
        },
      ]);

      const response = await result.response;
      const responseText = response.text();

      this.conversationHistory.push({
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      });

      this.config.onResponse?.(responseText);

      // Try to extract structured behavior data
      await this.extractBehaviorData();

    } catch (error) {
      console.error('Error sending text:', error);
      this.config.onError?.(error as Error);
    }
  }

  private async extractBehaviorData() {
    if (!this.model || this.conversationHistory.length < 4) return;

    try {
      const extractionResult = await this.model.generateContent([
        {
          text: `Based on this conversation, extract behavior incident data in JSON format:

Conversation:
${this.conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}

Extract and return ONLY a JSON object with these fields (use null for missing data):
{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "antecedent": "string or null",
  "behavior": "string or null",
  "consequence": "string or null",
  "severity": 1-5 or null,
  "function": "escape|attention|tangible|sensory or null",
  "duration": number or null,
  "location": "string or null",
  "notes": "string or null"
}

Return ONLY the JSON object, no other text.`,
        },
      ]);

      const extractionResponse = await extractionResult.response;
      const jsonText = extractionResponse.text();

      // Try to parse JSON
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const behaviorData = JSON.parse(jsonMatch[0]);

        // Convert to proper types
        const behavior: Partial<BehaviorEntry> = {
          date: behaviorData.date || new Date().toISOString().split('T')[0],
          time: behaviorData.time || new Date().toTimeString().slice(0, 5),
          antecedent: behaviorData.antecedent || '',
          behavior: behaviorData.behavior || '',
          consequence: behaviorData.consequence || '',
          severity: behaviorData.severity || SeverityLevel.MODERATE,
          function: behaviorData.function || BehaviorFunction.ESCAPE,
          duration: behaviorData.duration || undefined,
          location: behaviorData.location || undefined,
          notes: behaviorData.notes || undefined,
        };

        this.config.onBehaviorExtracted?.(behavior);
      }
    } catch (error) {
      console.error('Error extracting behavior data:', error);
      // Don't throw - this is a background operation
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop all tracks
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  pauseRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.resume();
    }
  }

  interrupt() {
    // Stop current playback/response
    this.pauseRecording();

    // User wants to interrupt - signal to Gemini
    this.conversationHistory.push({
      role: 'user',
      content: '[INTERRUPTED]',
      timestamp: Date.now(),
    });

    // Resume recording to capture new input
    this.resumeRecording();
  }

  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  destroy() {
    this.stopRecording();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
