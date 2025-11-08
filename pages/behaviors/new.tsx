import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { db, STORES } from '@/lib/db';
import { BehaviorEntry, SeverityLevel, BehaviorFunction } from '@/types';
import { ArrowLeft, Save, Sparkles, Mic, Video } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { generateInterventionStrategies, initializeGemini } from '@/lib/gemini';

const MultimodalConversation = dynamic(
  () => import('@/components/MultimodalConversation'),
  { ssr: false }
);

export default function NewBehavior() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiStrategies, setAiStrategies] = useState<string[]>([]);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    antecedent: '',
    behavior: '',
    consequence: '',
    severity: SeverityLevel.MODERATE,
    function: BehaviorFunction.ESCAPE,
    duration: '',
    intensity: '',
    location: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'severity' ? parseInt(value) : value,
    }));
  };

  const handleAnalyzeAI = async () => {
    if (!geminiApiKey) {
      alert('Please enter your Gemini API key in Settings first');
      return;
    }

    if (!formData.antecedent || !formData.behavior || !formData.consequence) {
      alert('Please fill in antecedent, behavior, and consequence first');
      return;
    }

    setAnalyzingAI(true);
    try {
      initializeGemini(geminiApiKey);

      const behavior: Partial<BehaviorEntry> = {
        antecedent: formData.antecedent,
        behavior: formData.behavior,
        consequence: formData.consequence,
        severity: formData.severity,
        function: formData.function,
      };

      const strategies = await generateInterventionStrategies(
        behavior as BehaviorEntry,
        formData.notes
      );
      setAiStrategies(strategies);
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      alert(t('ai.error'));
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleBehaviorExtracted = (behavior: Partial<BehaviorEntry>) => {
    // Fill form with extracted data from conversation
    setFormData((prev) => ({
      ...prev,
      date: behavior.date || prev.date,
      time: behavior.time || prev.time,
      antecedent: behavior.antecedent || prev.antecedent,
      behavior: behavior.behavior || prev.behavior,
      consequence: behavior.consequence || prev.consequence,
      severity: behavior.severity || prev.severity,
      function: behavior.function || prev.function,
      duration: behavior.duration?.toString() || prev.duration,
      intensity: behavior.intensity?.toString() || prev.intensity,
      location: behavior.location || prev.location,
      notes: behavior.notes || prev.notes,
    }));

    // Close the modal
    setShowVoiceModal(false);
    setShowVideoModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const entry: BehaviorEntry = {
        id: `behavior-${Date.now()}`,
        date: formData.date,
        time: formData.time,
        antecedent: formData.antecedent,
        behavior: formData.behavior,
        consequence: formData.consequence,
        severity: formData.severity,
        function: formData.function,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        intensity: formData.intensity ? parseInt(formData.intensity) : undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.add(STORES.BEHAVIORS, entry);
      router.push('/behaviors');
    } catch (error) {
      console.error('Error saving behavior:', error);
      alert('Error saving behavior. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/behaviors"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Behaviors
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('behavior.new')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Record a new behavior incident using ABC data collection
          </p>
        </div>

        {/* Multimodal Input Options */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {t('language.switch') === 'Switch Language' ? 'AI-Powered Input Methods' : 'Métodos de Entrada con IA'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('language.switch') === 'Switch Language'
              ? 'Use natural conversation or video streaming to record behavior incidents faster and more accurately.'
              : 'Usa conversación natural o video en streaming para registrar incidentes de conducta más rápido y con mayor precisión.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Mic className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('language.switch') === 'Switch Language' ? 'Voice Conversation' : 'Conversación por Voz'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('language.switch') === 'Switch Language'
                    ? 'Talk naturally with AI assistant'
                    : 'Habla naturalmente con asistente IA'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('language.switch') === 'Switch Language' ? 'Voice + Video Analysis' : 'Análisis de Voz + Video'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('language.switch') === 'Switch Language'
                    ? 'Real-time behavior video analysis'
                    : 'Análisis de video en tiempo real'}
                </p>
              </div>
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-400">
              <strong>{t('language.switch') === 'Switch Language' ? 'Note:' : 'Nota:'}</strong>{' '}
              {t('language.switch') === 'Switch Language'
                ? 'You\'ll need to enter your Gemini API key when you start. Data is processed in real-time and auto-fills the form below.'
                : 'Necesitarás ingresar tu API key de Gemini al iniciar. Los datos se procesan en tiempo real y llenan el formulario automáticamente.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">When</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.date')} *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.time')} *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ABC Data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">ABC Data</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.antecedent')} *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {t('behavior.antecedent_desc')}
                </p>
                <textarea
                  name="antecedent"
                  value={formData.antecedent}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Asked to complete homework assignment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.behavior')} *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {t('behavior.behavior_desc')}
                </p>
                <textarea
                  name="behavior"
                  value={formData.behavior}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Threw materials on floor, yelled 'No!'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.consequence')} *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {t('behavior.consequence_desc')}
                </p>
                <textarea
                  name="consequence"
                  value={formData.consequence}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Given break, materials removed"
                />
              </div>
            </div>
          </div>

          {/* Behavior Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Behavior Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.severity')} *
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={SeverityLevel.MILD}>{t('behavior.severity_1')}</option>
                  <option value={SeverityLevel.MODERATE}>{t('behavior.severity_2')}</option>
                  <option value={SeverityLevel.SIGNIFICANT}>{t('behavior.severity_3')}</option>
                  <option value={SeverityLevel.SEVERE}>{t('behavior.severity_4')}</option>
                  <option value={SeverityLevel.CRITICAL}>{t('behavior.severity_5')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.function')} *
                </label>
                <select
                  name="function"
                  value={formData.function}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value={BehaviorFunction.ESCAPE}>
                    {t('behavior.function_escape')}
                  </option>
                  <option value={BehaviorFunction.ATTENTION}>
                    {t('behavior.function_attention')}
                  </option>
                  <option value={BehaviorFunction.TANGIBLE}>
                    {t('behavior.function_tangible')}
                  </option>
                  <option value={BehaviorFunction.SENSORY}>
                    {t('behavior.function_sensory')}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.duration')}
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.intensity')} (1-10)
                </label>
                <input
                  type="number"
                  name="intensity"
                  value={formData.intensity}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('behavior.location')}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Classroom, Home, Community"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t('behavior.notes')}
            </h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Additional observations, context, or relevant information..."
            />
          </div>

          {/* AI Analysis Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">AI-Powered Analysis</h2>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gemini API Key (optional)
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your Google Gemini API key"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google AI Studio</a>
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeAI}
              disabled={analyzingAI}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {analyzingAI ? t('ai.analyzing') : t('ai.analyze')}
            </button>

            {aiStrategies.length > 0 && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">{t('ai.strategies')}</h3>
                <ul className="space-y-2">
                  {aiStrategies.map((strategy, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      • {strategy}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : t('behavior.save')}
            </button>
            <Link
              href="/behaviors"
              className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              {t('behavior.cancel')}
            </Link>
          </div>
        </form>

        {/* Multimodal Conversation Modals */}
        {showVoiceModal && geminiApiKey && (
          <MultimodalConversation
            apiKey={geminiApiKey}
            enableVideo={false}
            onBehaviorExtracted={handleBehaviorExtracted}
            onClose={() => setShowVoiceModal(false)}
          />
        )}

        {showVideoModal && geminiApiKey && (
          <MultimodalConversation
            apiKey={geminiApiKey}
            enableVideo={true}
            onBehaviorExtracted={handleBehaviorExtracted}
            onClose={() => setShowVideoModal(false)}
          />
        )}

        {/* API Key Prompt Modal */}
        {(showVoiceModal || showVideoModal) && !geminiApiKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t('language.switch') === 'Switch Language' ? 'Enter Gemini API Key' : 'Ingrese API Key de Gemini'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('language.switch') === 'Switch Language'
                  ? 'You need a Gemini API key to use multimodal features. Get one for free from Google AI Studio.'
                  : 'Necesitas una API key de Gemini para usar las funciones multimodales. Obtén una gratis desde Google AI Studio.'}
              </p>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (geminiApiKey.trim()) {
                      // API key entered, modal will now show conversation
                    }
                  }}
                  disabled={!geminiApiKey.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('language.switch') === 'Switch Language' ? 'Continue' : 'Continuar'}
                </button>
                <button
                  onClick={() => {
                    setShowVoiceModal(false);
                    setShowVideoModal(false);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('language.switch') === 'Switch Language' ? 'Cancel' : 'Cancelar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {t('language.switch') === 'Switch Language' ? 'Get API key from Google AI Studio →' : 'Obtener API key desde Google AI Studio →'}
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
