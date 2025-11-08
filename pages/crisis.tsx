import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { db, STORES } from '@/lib/db';
import { CrisisProtocol, EmergencyContact } from '@/types';
import { Plus, AlertTriangle, Eye, EyeOff, Edit2, Trash2, Sparkles } from 'lucide-react';
import { generateCrisisProtocol, initializeGemini } from '@/lib/gemini';

export default function Crisis() {
  const { t } = useTranslation('common');
  const [protocols, setProtocols] = useState<CrisisProtocol[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    triggerConditions: [''],
    preventionStrategies: [''],
    interventionSteps: [''],
    safetyMeasures: [''],
    deEscalationTechniques: [''],
    postCrisisFollowUp: [''],
    emergencyContacts: [] as EmergencyContact[],
    isActive: true,
  });

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      const data = await db.getAll<CrisisProtocol>(STORES.CRISIS_PROTOCOLS);
      setProtocols(data);
    } catch (error) {
      console.error('Error loading crisis protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!geminiApiKey) {
      alert('Please enter your Gemini API key');
      return;
    }
    if (!formData.name) {
      alert('Please enter a protocol name/behavior type first');
      return;
    }

    setGeneratingAI(true);
    try {
      initializeGemini(geminiApiKey);
      const generated = await generateCrisisProtocol(formData.name, 3);

      setFormData((prev) => ({
        ...prev,
        preventionStrategies: generated.preventionStrategies,
        interventionSteps: generated.interventionSteps,
        deEscalationTechniques: generated.deEscalationTechniques,
      }));
    } catch (error) {
      console.error('Error generating protocol:', error);
      alert('Error generating protocol with AI');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const protocol: CrisisProtocol = {
        id: `crisis-${Date.now()}`,
        name: formData.name,
        triggerConditions: formData.triggerConditions.filter((t) => t.trim()),
        preventionStrategies: formData.preventionStrategies.filter((s) => s.trim()),
        interventionSteps: formData.interventionSteps.filter((s) => s.trim()),
        safetyMeasures: formData.safetyMeasures.filter((s) => s.trim()),
        deEscalationTechniques: formData.deEscalationTechniques.filter((t) => t.trim()),
        postCrisisFollowUp: formData.postCrisisFollowUp.filter((f) => f.trim()),
        emergencyContacts: formData.emergencyContacts,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.add(STORES.CRISIS_PROTOCOLS, protocol);
      await loadProtocols();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving protocol:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      triggerConditions: [''],
      preventionStrategies: [''],
      interventionSteps: [''],
      safetyMeasures: [''],
      deEscalationTechniques: [''],
      postCrisisFollowUp: [''],
      emergencyContacts: [],
      isActive: true,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this crisis protocol?')) {
      try {
        await db.delete(STORES.CRISIS_PROTOCOLS, id);
        await loadProtocols();
      } catch (error) {
        console.error('Error deleting protocol:', error);
      }
    }
  };

  const toggleActive = async (protocol: CrisisProtocol) => {
    try {
      const updated = { ...protocol, isActive: !protocol.isActive };
      await db.update(STORES.CRISIS_PROTOCOLS, updated);
      await loadProtocols();
    } catch (error) {
      console.error('Error updating protocol:', error);
    }
  };

  const addArrayItem = (field: keyof typeof formData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ''],
    }));
  };

  const updateArrayItem = (
    field: keyof typeof formData,
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            {t('common.loading')}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('crisis.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create and manage behavior crisis protocols
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('crisis.new')}
          </button>
        </div>

        {/* Add Protocol Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">{t('crisis.new')}</h2>

            {/* AI Generation */}
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">AI Protocol Generator</h3>
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter Gemini API key"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {generatingAI ? 'Generating...' : 'Generate Protocol with AI'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('crisis.protocol_name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Aggressive Behavior Protocol"
                />
              </div>

              {/* Dynamic Array Fields */}
              {[
                { field: 'triggerConditions', label: t('crisis.trigger_conditions') },
                { field: 'preventionStrategies', label: t('crisis.prevention_strategies') },
                { field: 'interventionSteps', label: t('crisis.intervention_steps') },
                { field: 'safetyMeasures', label: t('crisis.safety_measures') },
                { field: 'deEscalationTechniques', label: t('crisis.de_escalation') },
                { field: 'postCrisisFollowUp', label: t('crisis.post_crisis') },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                  </label>
                  {(formData[field as keyof typeof formData] as string[]).map(
                    (item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            updateArrayItem(
                              field as keyof typeof formData,
                              index,
                              e.target.value
                            )
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder={`${label} ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayItem(field as keyof typeof formData, index)
                          }
                          className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => addArrayItem(field as keyof typeof formData)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add {label}
                  </button>
                </div>
              ))}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Protocols List */}
        {protocols.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No crisis protocols created yet
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('crisis.new')} →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {protocols.map((protocol) => (
              <div
                key={protocol.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 flex-1">
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          protocol.isActive
                            ? 'text-orange-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          {protocol.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {protocol.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(protocol)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        {protocol.isActive ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setExpandedProtocol(
                            expandedProtocol === protocol.id ? null : protocol.id
                          )
                        }
                        className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50"
                      >
                        {expandedProtocol === protocol.id ? 'Hide' : 'View'} Details
                      </button>
                      <button
                        onClick={() => handleDelete(protocol.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {expandedProtocol === protocol.id && (
                    <div className="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                      {[
                        { title: t('crisis.trigger_conditions'), items: protocol.triggerConditions },
                        { title: t('crisis.prevention_strategies'), items: protocol.preventionStrategies },
                        { title: t('crisis.intervention_steps'), items: protocol.interventionSteps },
                        { title: t('crisis.safety_measures'), items: protocol.safetyMeasures },
                        { title: t('crisis.de_escalation'), items: protocol.deEscalationTechniques },
                        { title: t('crisis.post_crisis'), items: protocol.postCrisisFollowUp },
                      ].map(({ title, items }) =>
                        items.length > 0 ? (
                          <div key={title}>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {title}
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                              {items.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
