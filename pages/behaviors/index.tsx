import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { db, STORES } from '@/lib/db';
import { BehaviorEntry, SeverityLevel, BehaviorFunction } from '@/types';
import { Plus, Search, Filter, Download, Trash2, FileUp } from 'lucide-react';
import Link from 'next/link';
import { exportToCSV } from '@/lib/analytics';

const PDFImport = dynamic(() => import('@/components/PDFImport'), { ssr: false });

export default function Behaviors() {
  const { t } = useTranslation('common');
  const [behaviors, setBehaviors] = useState<BehaviorEntry[]>([]);
  const [filteredBehaviors, setFilteredBehaviors] = useState<BehaviorEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showPDFImport, setShowPDFImport] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    loadBehaviors();
  }, []);

  useEffect(() => {
    filterBehaviors();
  }, [behaviors, searchTerm, severityFilter]);

  const loadBehaviors = async () => {
    try {
      const data = await db.getAll<BehaviorEntry>(STORES.BEHAVIORS);
      const sorted = data.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      });
      setBehaviors(sorted);
    } catch (error) {
      console.error('Error loading behaviors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBehaviors = () => {
    let filtered = behaviors;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.behavior.toLowerCase().includes(term) ||
          b.antecedent.toLowerCase().includes(term) ||
          b.consequence.toLowerCase().includes(term)
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((b) => b.severity === severityFilter);
    }

    setFilteredBehaviors(filtered);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this behavior entry?')) {
      try {
        await db.delete(STORES.BEHAVIORS, id);
        await loadBehaviors();
      } catch (error) {
        console.error('Error deleting behavior:', error);
      }
    }
  };

  const handleExport = () => {
    const csv = exportToCSV(filteredBehaviors);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behaviors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImportPDF = () => {
    if (!geminiApiKey) {
      const key = prompt(
        t('language.switch') === 'Switch Language'
          ? 'Enter your Gemini API key to import PDFs:'
          : 'Ingresa tu API key de Gemini para importar PDFs:'
      );
      if (key) {
        setGeminiApiKey(key);
        setShowPDFImport(true);
      }
    } else {
      setShowPDFImport(true);
    }
  };

  const handleBehaviorsExtracted = async (extractedBehaviors: Partial<BehaviorEntry>[]) => {
    try {
      // Save all extracted behaviors
      for (const behavior of extractedBehaviors) {
        const entry: BehaviorEntry = {
          id: `behavior-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: behavior.date || new Date().toISOString().split('T')[0],
          time: behavior.time || new Date().toTimeString().slice(0, 5),
          antecedent: behavior.antecedent || '',
          behavior: behavior.behavior || '',
          consequence: behavior.consequence || '',
          severity: behavior.severity || 2,
          function: behavior.function || BehaviorFunction.ESCAPE,
          duration: behavior.duration,
          intensity: behavior.intensity,
          location: behavior.location,
          notes: behavior.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.add(STORES.BEHAVIORS, entry);
      }

      // Reload behaviors
      await loadBehaviors();

      // Close modal
      setShowPDFImport(false);
    } catch (error) {
      console.error('Error saving imported behaviors:', error);
      alert('Error saving imported behaviors');
    }
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('behavior.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredBehaviors.length} {filteredBehaviors.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FileUp className="w-4 h-4" />
              <span className="hidden sm:inline">Import PDF</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </button>
            <Link
              href="/behaviors/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('behavior.new')}
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(
                    e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                  )
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value={SeverityLevel.MILD}>{t('behavior.severity_1')}</option>
                <option value={SeverityLevel.MODERATE}>{t('behavior.severity_2')}</option>
                <option value={SeverityLevel.SIGNIFICANT}>{t('behavior.severity_3')}</option>
                <option value={SeverityLevel.SEVERE}>{t('behavior.severity_4')}</option>
                <option value={SeverityLevel.CRITICAL}>{t('behavior.severity_5')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Behavior List */}
        <div className="space-y-3">
          {filteredBehaviors.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || severityFilter !== 'all'
                  ? 'No behaviors match your filters'
                  : 'No behaviors recorded yet'}
              </p>
              <Link
                href="/behaviors/new"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('behavior.new')} →
              </Link>
            </div>
          ) : (
            filteredBehaviors.map((behavior) => (
              <div
                key={behavior.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          behavior.severity >= 4
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : behavior.severity >= 3
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {t(`behavior.severity_${behavior.severity}`)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {t(`behavior.function_${behavior.function}`)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      {behavior.behavior}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                          {t('behavior.antecedent')}
                        </p>
                        <p className="text-gray-900 dark:text-gray-100">
                          {behavior.antecedent}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                          {t('behavior.consequence')}
                        </p>
                        <p className="text-gray-900 dark:text-gray-100">
                          {behavior.consequence}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                          Details
                        </p>
                        <p className="text-gray-900 dark:text-gray-100">
                          {new Date(behavior.date).toLocaleDateString()} at {behavior.time}
                        </p>
                        {behavior.duration && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Duration: {behavior.duration} min
                          </p>
                        )}
                      </div>
                    </div>

                    {behavior.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Notes:</span> {behavior.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(behavior.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    aria-label="Delete behavior"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PDF Import Modal */}
      {showPDFImport && (
        <PDFImport
          apiKey={geminiApiKey}
          onBehaviorsExtracted={handleBehaviorsExtracted}
          onClose={() => setShowPDFImport(false)}
        />
      )}
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
