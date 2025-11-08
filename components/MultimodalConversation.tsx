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
  Video,
  VideoOff,
  Camera,
  Eye,
} from 'lucide-react';
import { MultimodalConversation, ConversationMessage, VideoAnalysis } from '@/lib/multimodal-conversation';
import { BehaviorEntry } from '@/types';

interface MultimodalConversationProps {
  apiKey: string;
  enableVideo?: boolean;
  onBehaviorExtracted: (behavior: Partial<BehaviorEntry>) => void;
  onClose: () => void;
}

export default function MultimodalConversationComponent({
  apiKey,
  enableVideo = false,
  onBehaviorExtracted,
  onClose,
}: MultimodalConversationProps) {
  const { t, i18n } = useTranslation('common');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [videoAnalyses, setVideoAnalyses] = useState<VideoAnalysis[]>([]);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(true);

  const conversationRef = useRef<MultimodalConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize conversation
    conversationRef.current = new MultimodalConversation({
      apiKey,
      language: i18n.language as 'en' | 'es',
      enableVideo,
      videoFacingMode: cameraFacing,
      onTranscript: (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: text, timestamp: Date.now(), type: 'audio' },
          ]);
        }
      },
      onResponse: (text) => {
        setCurrentResponse(text);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: text, timestamp: Date.now(), type: 'text' },
        ]);
        setIsProcessing(false);

        // Speak the response
        speakText(text);
      },
      onBehaviorExtracted: (behavior) => {
        onBehaviorExtracted(behavior);
      },
      onVideoAnalysis: (analysis) => {
        setVideoAnalyses((prev) => [...prev.slice(-4), analysis]);
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
  }, [apiKey, i18n.language, enableVideo, cameraFacing, onBehaviorExtracted]);

  useEffect(() => {
    // Update video element when stream changes
    if (videoRef.current && conversationRef.current && isRecording) {
      const stream = conversationRef.current.getVideoStream();
      if (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }
  }, [isRecording]);

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
    } catch (error: any) {
      setError(error.message || 'Failed to start recording. Please check permissions.');
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
      { role: 'user', content: textInput, timestamp: Date.now(), type: 'text' },
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

  const handleSwitchCamera = () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);

    // Need to restart recording with new camera
    if (isRecording) {
      handleStopRecording();
      // Will restart with new camera setting
    }
  };

  const latestVideoAnalysis = videoAnalyses[videoAnalyses.length - 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRecording ? 'bg-red-100 dark:bg-red-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
              {enableVideo ? (
                <Video className={`w-6 h-6 ${isRecording ? 'text-red-600' : 'text-purple-600'}`} />
              ) : (
                <MessageSquare className={`w-6 h-6 ${isRecording ? 'text-red-600' : 'text-purple-600'}`} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {enableVideo
                  ? i18n.language === 'es'
                    ? 'Conversación Multimodal (Voz + Video)'
                    : 'Multimodal Conversation (Voice + Video)'
                  : i18n.language === 'es'
                  ? 'Conversación por Voz'
                  : 'Voice Conversation'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isRecording
                  ? i18n.language === 'es'
                    ? 'Grabando... habla y muestra el comportamiento'
                    : 'Recording... speak and show behavior'
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Video Panel (if enabled) */}
          {enableVideo && (
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  {i18n.language === 'es' ? 'Vista en Vivo' : 'Live View'}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowVideoAnalysis(!showVideoAnalysis)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    title={i18n.language === 'es' ? 'Mostrar/Ocultar Análisis' : 'Show/Hide Analysis'}
                  >
                    <Eye className={`w-4 h-4 ${showVideoAnalysis ? 'text-primary-600' : 'text-gray-400'}`} />
                  </button>
                  {isRecording && (
                    <button
                      onClick={handleSwitchCamera}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title={i18n.language === 'es' ? 'Cambiar Cámara' : 'Switch Camera'}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Video Display */}
              <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted
                />
                {!isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-center text-white">
                      <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>{i18n.language === 'es' ? 'Cámara no activa' : 'Camera not active'}</p>
                    </div>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    REC
                  </div>
                )}
              </div>

              {/* Video Analysis */}
              {showVideoAnalysis && latestVideoAnalysis && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-400">
                    {i18n.language === 'es' ? 'Análisis en Tiempo Real' : 'Real-time Analysis'}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {latestVideoAnalysis.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {latestVideoAnalysis.behaviors.length > 0 && (
                      <div>
                        <span className="font-medium">{i18n.language === 'es' ? 'Conductas:' : 'Behaviors:'}</span>
                        <div className="text-gray-600 dark:text-gray-400">
                          {latestVideoAnalysis.behaviors.join(', ')}
                        </div>
                      </div>
                    )}
                    {latestVideoAnalysis.emotions.length > 0 && (
                      <div>
                        <span className="font-medium">{i18n.language === 'es' ? 'Emociones:' : 'Emotions:'}</span>
                        <div className="text-gray-600 dark:text-gray-400">
                          {latestVideoAnalysis.emotions.join(', ')}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">{i18n.language === 'es' ? 'Intensidad:' : 'Intensity:'}</span>
                      <div className="text-gray-600 dark:text-gray-400">
                        {latestVideoAnalysis.intensity}/5
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages Panel */}
          <div className={`${enableVideo ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.filter(m => m.role !== 'system').length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>
                    {i18n.language === 'es'
                      ? 'Inicia una conversación para registrar el comportamiento'
                      : 'Start a conversation to record the behavior'}
                  </p>
                </div>
              )}

              {messages.filter(m => m.role !== 'system').map((message, index) => (
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
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                      {message.type && (
                        <span className="text-xs opacity-60">
                          {message.type === 'audio' ? '🎤' : message.type === 'video' ? '🎥' : '💬'}
                        </span>
                      )}
                    </div>
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

            {/* Text Input */}
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
                  ? enableVideo
                    ? 'Grabación activa (voz y video) - Habla y muestra el comportamiento'
                    : 'Grabación activa - Habla naturalmente'
                  : enableVideo
                  ? 'Recording active (voice and video) - Speak and show behavior'
                  : 'Recording active - Speak naturally'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
