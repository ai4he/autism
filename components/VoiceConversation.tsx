import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  X,
  MessageSquare,
  Loader,
} from 'lucide-react';
import { VoiceConversation, ConversationMessage } from '@/lib/voice-conversation';
import { BehaviorEntry } from '@/types';

interface VoiceConversationProps {
  apiKey: string;
  onBehaviorExtracted: (behavior: Partial<BehaviorEntry>) => void;
  onClose: () => void;
}

export default function VoiceConversationComponent({
  apiKey,
  onBehaviorExtracted,
  onClose,
}: VoiceConversationProps) {
  const { t, i18n } = useTranslation('common');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const conversationRef = useRef<VoiceConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize conversation
    conversationRef.current = new VoiceConversation({
      apiKey,
      language: i18n.language as 'en' | 'es',
      onTranscript: (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: text, timestamp: Date.now() },
          ]);
        }
      },
      onResponse: (text) => {
        setCurrentResponse(text);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: text, timestamp: Date.now() },
        ]);
        setIsProcessing(false);

        // Speak the response
        speakText(text);
      },
      onBehaviorExtracted: (behavior) => {
        onBehaviorExtracted(behavior);
      },
      onError: (error) => {
        setError(error.message);
        setIsProcessing(false);
      },
    });

    return () => {
      conversationRef.current?.destroy();
      stopSpeaking();
    };
  }, [apiKey, i18n.language, onBehaviorExtracted]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      await conversationRef.current?.startConversation();
      setIsRecording(true);
      setIsProcessing(false);
    } catch (error) {
      setError('Failed to start recording. Please check microphone permissions.');
      setIsProcessing(false);
    }
  };

  const handleStopRecording = () => {
    conversationRef.current?.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      conversationRef.current?.resumeRecording();
      setIsPaused(false);
    } else {
      conversationRef.current?.pauseRecording();
      setIsPaused(true);
    }
  };

  const handleInterrupt = () => {
    stopSpeaking();
    conversationRef.current?.interrupt();
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: textInput, timestamp: Date.now() },
    ]);

    await conversationRef.current?.sendTextMessage(textInput);
    setTextInput('');
  };

  const handleToggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (currentResponse) {
      speakText(currentResponse);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRecording ? 'bg-red-100 dark:bg-red-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
              <MessageSquare className={`w-6 h-6 ${isRecording ? 'text-red-600' : 'text-purple-600'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('language.switch') === 'Switch Language' ? 'Voice Conversation' : 'Conversación por Voz'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRecording
                  ? i18n.language === 'es'
                    ? 'Grabando... habla naturalmente'
                    : 'Recording... speak naturally'
                  : i18n.language === 'es'
                  ? 'Inicia la grabación para comenzar'
                  : 'Start recording to begin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>
                {i18n.language === 'es'
                  ? 'Inicia una conversación para registrar el comportamiento'
                  : 'Start a conversation to record the behavior'}
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {transcript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-lg p-4 bg-primary-400 text-white opacity-70">
                <p className="text-sm italic">{transcript}</p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {i18n.language === 'es' ? 'Procesando...' : 'Processing...'}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-2">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Text Input (always available) */}
        <div className="px-6 pb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              placeholder={
                i18n.language === 'es'
                  ? 'Escribe un mensaje...'
                  : 'Type a message...'
              }
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={handleSendText}
              disabled={!textInput.trim() || isProcessing}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {i18n.language === 'es' ? 'Enviar' : 'Send'}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          <div className="flex justify-center items-center gap-4">
            {/* Recording Control */}
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic className="w-5 h-5" />
                {i18n.language === 'es' ? 'Iniciar Grabación' : 'Start Recording'}
              </button>
            ) : (
              <>
                <button
                  onClick={handlePauseResume}
                  className="p-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </button>

                <button
                  onClick={handleInterrupt}
                  disabled={!isSpeaking}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {i18n.language === 'es' ? 'Interrumpir' : 'Interrupt'}
                </button>

                <button
                  onClick={handleStopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <MicOff className="w-5 h-5" />
                  {i18n.language === 'es' ? 'Detener' : 'Stop'}
                </button>
              </>
            )}

            {/* Speaker Control */}
            <button
              onClick={handleToggleSpeaking}
              disabled={!currentResponse}
              className={`p-3 rounded-lg transition-colors ${
                isSpeaking
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isSpeaking ? 'Mute' : 'Speak'}
            >
              {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {isRecording && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {i18n.language === 'es'
                  ? 'Grabación activa - Habla naturalmente'
                  : 'Recording active - Speak naturally'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
