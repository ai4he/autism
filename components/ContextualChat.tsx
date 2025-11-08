import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import {
  MessageCircle,
  X,
  Send,
  Loader,
  Sparkles,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { ContextualChat } from '@/lib/contextual-chat';
import { BehaviorEntry } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ContextualChatProps {
  apiKey: string;
  behaviors: BehaviorEntry[];
  onClose: () => void;
}

export default function ContextualChatComponent({
  apiKey,
  behaviors,
  onClose,
}: ContextualChatProps) {
  const { t, i18n } = useTranslation('common');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ContextualChat | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSpanish = i18n.language === 'es';

  useEffect(() => {
    // Initialize chat
    const contextualChat = new ContextualChat({
      apiKey,
      language: i18n.language as 'en' | 'es',
      behaviors,
      onMessage: (message) => {
        setMessages((prev) => [...prev, message]);
      },
      onError: (error) => {
        setError(error.message);
      },
    });

    setChat(contextualChat);

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: isSpanish
        ? `¡Hola! Soy tu asistente de ABA personalizado. He analizado ${behaviors.length} registros de comportamiento de tu hijo/a y estoy aquí para responder tus preguntas y proporcionar orientación basada en esos datos específicos.\n\n¿En qué puedo ayudarte hoy?`
        : `Hello! I'm your personalized ABA assistant. I've analyzed ${behaviors.length} behavior records for your child and I'm here to answer your questions and provide guidance based on that specific data.\n\nHow can I help you today?`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);

    return () => {
      // Cleanup
    };
  }, [apiKey, i18n.language, behaviors, isSpanish]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chat || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);
    setIsLoading(true);

    try {
      await chat.sendMessage(userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(
        isSpanish
          ? 'Error al enviar el mensaje. Por favor, intenta de nuevo.'
          : 'Error sending message. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (
      confirm(
        isSpanish
          ? '¿Estás seguro de que quieres borrar el historial de chat?'
          : 'Are you sure you want to clear the chat history?'
      )
    ) {
      chat?.clearHistory();
      setMessages([]);
      setError(null);

      // Add new welcome message
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: isSpanish
          ? '¡Hola de nuevo! ¿En qué puedo ayudarte?'
          : 'Hello again! How can I help you?',
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = isSpanish
    ? [
        '¿Qué patrones de comportamiento has notado?',
        '¿Cuál es la función más común de los comportamientos?',
        '¿Qué estrategias de intervención recomiendas?',
        '¿Ha habido progreso en las últimas semanas?',
        '¿Qué antecedentes desencadenan más comportamientos?',
      ]
    : [
        'What behavior patterns have you noticed?',
        'What is the most common behavior function?',
        'What intervention strategies do you recommend?',
        'Has there been progress in recent weeks?',
        'What antecedents trigger the most behaviors?',
      ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isSpanish ? 'Asistente de ABA Personalizado' : 'Personalized ABA Assistant'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isSpanish
                  ? `${behaviors.length} registros analizados`
                  : `${behaviors.length} records analyzed`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isSpanish ? 'Borrar chat' : 'Clear chat'}
            >
              <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>{isSpanish ? 'Iniciando chat...' : 'Initializing chat...'}</p>
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
                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      {isSpanish ? 'Asistente ABA' : 'ABA Assistant'}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-purple-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isSpanish ? 'Pensando...' : 'Thinking...'}
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {isSpanish ? 'Preguntas sugeridas:' : 'Suggested questions:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-2">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isSpanish
                  ? 'Pregunta sobre los comportamientos de tu hijo/a...'
                  : 'Ask about your child\'s behaviors...'
              }
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">{isSpanish ? 'Enviar' : 'Send'}</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {isSpanish
              ? 'Las respuestas están basadas en los datos específicos de tu hijo/a'
              : 'Responses are based on your child\'s specific data'}
          </p>
        </div>
      </div>
    </div>
  );
}
