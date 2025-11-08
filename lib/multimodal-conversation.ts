// Real-time multimodal conversation with Gemini (voice + video streaming)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BehaviorEntry, SeverityLevel, BehaviorFunction } from '@/types';

export interface MultimodalConversationConfig {
  apiKey: string;
  language: 'en' | 'es';
  enableVideo?: boolean;
  videoFacingMode?: 'user' | 'environment';
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onBehaviorExtracted?: (behavior: Partial<BehaviorEntry>) => void;
  onVideoAnalysis?: (analysis: VideoAnalysis) => void;
  onError?: (error: Error) => void;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'audio' | 'video';
}

export interface VideoAnalysis {
  behaviors: string[];
  emotions: string[];
  movements: string[];
  intensity: number;
  description: string;
  timestamp: number;
}

export class MultimodalConversation {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private audioRecorder: MediaRecorder | null = null;
  private videoRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private videoStream: MediaStream | null = null;
  private audioStream: MediaStream | null = null;
  private isRecording = false;
  private config: MultimodalConversationConfig;
  private conversationHistory: ConversationMessage[] = [];
  private audioChunks: Blob[] = [];
  private videoChunks: Blob[] = [];
  private videoFrameInterval: any = null;
  private lastVideoAnalysis: number = 0;
  private videoAnalysisDelay = 2000; // Analyze video every 2 seconds

  constructor(config: MultimodalConversationConfig) {
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
      const constraints: MediaStreamConstraints = {
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      };

      // Add video if enabled
      if (this.config.enableVideo) {
        constraints.video = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: this.config.videoFacingMode || 'environment',
        };
      }

      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Separate audio and video tracks
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      // Create audio stream
      if (audioTracks.length > 0) {
        this.audioStream = new MediaStream(audioTracks);
        this.initializeAudioRecording();
      }

      // Create video stream if available
      if (videoTracks.length > 0 && this.config.enableVideo) {
        this.videoStream = new MediaStream(videoTracks);
        this.initializeVideoRecording();
        this.startVideoAnalysis();
      }

      this.isRecording = true;

      // Send initial prompt
      await this.sendInitialPrompt();

    } catch (error) {
      console.error('Error starting conversation:', error);
      this.config.onError?.(error as Error);
      throw error;
    }
  }

  private initializeAudioRecording() {
    if (!this.audioStream) return;

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.audioRecorder = new MediaRecorder(this.audioStream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    this.audioRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.audioRecorder.onstop = () => {
      this.processAudioRecording();
    };

    this.audioRecorder.start(1000); // Capture data every 1 second
  }

  private initializeVideoRecording() {
    if (!this.videoStream) return;

    this.videoRecorder = new MediaRecorder(this.videoStream, {
      mimeType: 'video/webm;codecs=vp9',
    });

    this.videoRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.videoChunks.push(event.data);
      }
    };

    this.videoRecorder.start(1000); // Capture data every 1 second
  }

  private startVideoAnalysis() {
    if (!this.videoStream) return;

    // Create a video element to capture frames
    const video = document.createElement('video');
    video.srcObject = this.videoStream;
    video.play();

    // Analyze video frames periodically
    this.videoFrameInterval = setInterval(async () => {
      const now = Date.now();
      if (now - this.lastVideoAnalysis < this.videoAnalysisDelay) return;

      this.lastVideoAnalysis = now;
      await this.analyzeVideoFrame(video);
    }, this.videoAnalysisDelay);
  }

  private async analyzeVideoFrame(video: HTMLVideoElement) {
    try {
      // Capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Image = imageData.split(',')[1];

      // Send to Gemini for analysis
      await this.analyzeVideoWithGemini(base64Image);
    } catch (error) {
      console.error('Error analyzing video frame:', error);
    }
  }

  private async analyzeVideoWithGemini(base64Image: string) {
    if (!this.model) return;

    try {
      const prompt = this.config.language === 'es'
        ? `Analiza este frame de video de un comportamiento de un niño/persona. Identifica:
1. Comportamientos observables (movimientos, acciones)
2. Expresiones emocionales o faciales
3. Nivel de intensidad (1-5)
4. Cualquier patrón de comportamiento significativo

Responde en formato JSON:
{
  "behaviors": ["comportamiento1", "comportamiento2"],
  "emotions": ["emoción1", "emoción2"],
  "movements": ["movimiento1"],
  "intensity": 1-5,
  "description": "descripción breve"
}`
        : `Analyze this video frame of a child/person's behavior. Identify:
1. Observable behaviors (movements, actions)
2. Emotional or facial expressions
3. Intensity level (1-5)
4. Any significant behavioral patterns

Respond in JSON format:
{
  "behaviors": ["behavior1", "behavior2"],
  "emotions": ["emotion1", "emotion2"],
  "movements": ["movement1"],
  "intensity": 1-5,
  "description": "brief description"
}`;

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        { text: prompt },
      ]);

      const response = await result.response;
      const text = response.text();

      // Try to parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis: VideoAnalysis = {
          ...JSON.parse(jsonMatch[0]),
          timestamp: Date.now(),
        };

        this.config.onVideoAnalysis?.(analysis);

        // Add to conversation context
        this.conversationHistory.push({
          role: 'system',
          content: `Video analysis: ${analysis.description}`,
          timestamp: Date.now(),
          type: 'video',
        });
      }
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
    }
  }

  private async sendInitialPrompt() {
    const prompts = {
      en: `You are an ABA (Applied Behavior Analysis) assistant helping to record behavior incidents.

${this.config.enableVideo ? 'You have access to video feed showing the person\'s behavior in real-time. Use visual cues from the video to supplement the conversation.' : ''}

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

${this.config.enableVideo ? 'Use the video analysis to help identify specific behaviors, intensity levels, and emotional states. Reference what you see in the video naturally.' : ''}

Be conversational, empathetic, and guide the user naturally. Ask follow-up questions to clarify.
The user can interrupt you at any time. Listen actively.

Start by greeting the user and asking about the behavior incident.`,

      es: `Eres un asistente de ABA (Análisis Aplicado de la Conducta) que ayuda a registrar incidentes de conducta.

${this.config.enableVideo ? 'Tienes acceso al video en tiempo real mostrando el comportamiento de la persona. Usa las señales visuales del video para complementar la conversación.' : ''}

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

${this.config.enableVideo ? 'Usa el análisis de video para ayudar a identificar comportamientos específicos, niveles de intensidad y estados emocionales. Referencia lo que ves en el video naturalmente.' : ''}

Sé conversacional, empático y guía al usuario naturalmente. Haz preguntas de seguimiento para aclarar.
El usuario puede interrumpirte en cualquier momento. Escucha activamente.

Comienza saludando al usuario y preguntando sobre el incidente de conducta.`
    };

    const systemPrompt = prompts[this.config.language];

    this.conversationHistory.push({
      role: 'system',
      content: systemPrompt,
      timestamp: Date.now(),
    });

    // Send initial greeting
    await this.generateResponse();
  }

  private async processAudioRecording() {
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
      const videoContext = this.conversationHistory
        .filter((m) => m.type === 'video')
        .slice(-3)
        .map((m) => m.content)
        .join('\n');

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: base64Audio,
          },
        },
        {
          text: `Previous conversation:
${this.conversationHistory
  .filter((m) => m.role !== 'system')
  .map((m) => `${m.role}: ${m.content}`)
  .join('\n')}

${videoContext ? `Recent video observations:\n${videoContext}\n` : ''}

Continue the conversation naturally based on the user's audio input. Extract any behavior incident information shared.${videoContext ? ' Reference the video observations when relevant.' : ''}`,
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
        type: 'text',
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
      type: 'text',
    });

    await this.generateResponse();
  }

  private async generateResponse() {
    if (!this.model) return;

    try {
      const videoContext = this.conversationHistory
        .filter((m) => m.type === 'video')
        .slice(-3)
        .map((m) => m.content)
        .join('\n');

      const result = await this.model.generateContent([
        {
          text: `Conversation history:
${this.conversationHistory
  .filter((m) => m.role !== 'system' && m.type !== 'video')
  .map((m) => `${m.role}: ${m.content}`)
  .join('\n')}

${videoContext ? `Recent video observations:\n${videoContext}\n` : ''}

Respond naturally and continue gathering behavior incident information.${videoContext ? ' Reference the video observations when relevant.' : ''}`,
        },
      ]);

      const response = await result.response;
      const responseText = response.text();

      this.conversationHistory.push({
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        type: 'text',
      });

      this.config.onResponse?.(responseText);

      // Try to extract structured behavior data
      await this.extractBehaviorData();

    } catch (error) {
      console.error('Error generating response:', error);
      this.config.onError?.(error as Error);
    }
  }

  private async extractBehaviorData() {
    if (!this.model || this.conversationHistory.filter((m) => m.type !== 'video').length < 4) return;

    try {
      const videoAnalyses = this.conversationHistory
        .filter((m) => m.type === 'video')
        .slice(-5);

      const extractionResult = await this.model.generateContent([
        {
          text: `Based on this conversation and video analysis, extract behavior incident data in JSON format:

Conversation:
${this.conversationHistory
  .filter((m) => m.type !== 'video')
  .map((m) => `${m.role}: ${m.content}`)
  .join('\n')}

${videoAnalyses.length > 0 ? `\nVideo Analysis:\n${videoAnalyses.map((m) => m.content).join('\n')}` : ''}

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
  "notes": "string or null (include video observations)"
}

Use video analysis to supplement the behavior description and notes.
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
    }
  }

  stopRecording() {
    if (this.audioRecorder && this.isRecording) {
      this.audioRecorder.stop();
    }

    if (this.videoRecorder && this.isRecording) {
      this.videoRecorder.stop();
    }

    if (this.videoFrameInterval) {
      clearInterval(this.videoFrameInterval);
    }

    this.isRecording = false;

    // Stop all tracks
    this.audioStream?.getTracks().forEach(track => track.stop());
    this.videoStream?.getTracks().forEach(track => track.stop());
  }

  pauseRecording() {
    this.audioRecorder?.pause();
    this.videoRecorder?.pause();
  }

  resumeRecording() {
    this.audioRecorder?.resume();
    this.videoRecorder?.resume();
  }

  interrupt() {
    this.pauseRecording();

    this.conversationHistory.push({
      role: 'user',
      content: '[INTERRUPTED]',
      timestamp: Date.now(),
      type: 'text',
    });

    this.resumeRecording();
  }

  getVideoStream(): MediaStream | null {
    return this.videoStream;
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
