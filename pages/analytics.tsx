import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { db, STORES } from '@/lib/db';
import { BehaviorEntry } from '@/types';
import {
  calculateBehaviorAnalytics,
  generateChartData,
} from '@/lib/analytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';
import { analyzeBehaviorPatterns, initializeGemini } from '@/lib/gemini';

const COLORS = {
  primary: '#0ea5e9',
  escape: '#ef4444',
  attention: '#f59e0b',
  tangible: '#8b5cf6',
  sensory: '#10b981',
  severity: ['#fef08a', '#fbbf24', '#f59e0b', '#dc2626', '#991b1b'],
};

export default function Analytics() {
  const { t } = useTranslation('common');
  const [behaviors, setBehaviors] = useState<BehaviorEntry[]>([]);
  const [timeRange, setTimeRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    loadBehaviors();
  }, []);

  const loadBehaviors = async () => {
    try {
      const data = await db.getAll<BehaviorEntry>(STORES.BEHAVIORS);
      setBehaviors(data);
    } catch (error) {
      console.error('Error loading behaviors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAI = async () => {
    if (!geminiApiKey) {
      alert('Please enter your Gemini API key');
      return;
    }

    if (behaviors.length < 5) {
      alert('Need at least 5 behavior entries for meaningful AI analysis');
      return;
    }

    setAnalyzingAI(true);
    try {
      initializeGemini(geminiApiKey);
      const recentBehaviors = behaviors.slice(-20); // Last 20 behaviors
      const analysis = await analyzeBehaviorPatterns(recentBehaviors);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      alert('Error analyzing behaviors with AI');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const analytics = calculateBehaviorAnalytics(behaviors);
  const chartData = generateChartData(behaviors, timeRange);

  // Prepare data for charts
  const severityData = Object.entries(analytics.severityDistribution).map(
    ([key, value]) => ({
      name: t(`behavior.severity_${key}`),
      value,
    })
  );

  const functionData = Object.entries(analytics.functionDistribution).map(
    ([key, value]) => ({
      name: t(`behavior.function_${key}`),
      value,
      color: (COLORS as any)[key] || COLORS.primary,
    })
  );

  const timeOfDayData = Object.entries(analytics.timeOfDayPatterns)
    .map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

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

  if (behaviors.length === 0) {
    return (
      <Layout>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No behavior data available for analysis
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Start recording behaviors to see analytics
          </p>
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
              {t('analytics.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Behavior patterns and insights
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">AI-Powered Behavior Analysis</h2>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter Gemini API key for AI analysis"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleAnalyzeAI}
              disabled={analyzingAI}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {analyzingAI ? 'Analyzing...' : 'Analyze Patterns with AI'}
            </button>

            {aiAnalysis && (
              <div className="mt-4 space-y-4">
                {/* Risk Level */}
                <div
                  className={`p-4 rounded-lg border-l-4 ${
                    aiAnalysis.riskLevel === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : aiAnalysis.riskLevel === 'medium'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  }`}
                >
                  <h3 className="font-semibold mb-1">Risk Level: {aiAnalysis.riskLevel.toUpperCase()}</h3>
                </div>

                {/* Predictions */}
                {aiAnalysis.predictions.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t('ai.predictions')}</h3>
                    <ul className="space-y-2">
                      {aiAnalysis.predictions.map((pred: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                          • {pred}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {aiAnalysis.recommendations.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t('ai.recommendations')}</h3>
                    <div className="space-y-3">
                      {aiAnalysis.recommendations.map((rec: any, i: number) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border-l-4 ${
                            rec.priority === 'high'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                              : rec.priority === 'medium'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                          }`}
                        >
                          <p className="font-medium text-sm">{rec.recommendation}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {rec.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patterns */}
                {aiAnalysis.patterns.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Detected Patterns</h3>
                    <ul className="space-y-2">
                      {aiAnalysis.patterns.map((pattern: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                          • {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        {analytics.milestones.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              {t('analytics.milestones')}
            </h2>
            <div className="space-y-3">
              {analytics.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border-l-4 flex items-start gap-3 ${
                    milestone.type === 'improvement'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                  }`}
                >
                  {milestone.type === 'improvement' ? (
                    <TrendingDown className="w-5 h-5 text-green-600 mt-1" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-orange-600 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {milestone.description}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(milestone.date).toLocaleDateString()} • Confidence:{' '}
                      {(milestone.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Behavior Frequency Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('analytics.frequency')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.primary}
                strokeWidth={2}
                name="Behavior Count"
              />
              <Line
                type="monotone"
                dataKey="avgSeverity"
                stroke="#ef4444"
                strokeWidth={2}
                name="Avg Severity"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t('analytics.severity_distribution')}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS.severity[index % COLORS.severity.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Function Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t('analytics.function_analysis')}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={functionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary}>
                  {functionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time of Day Patterns */}
          {timeOfDayData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('analytics.time_of_day')}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeOfDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Behaviors
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {analytics.totalEntries}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Average Severity
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {analytics.averageSeverity.toFixed(1)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Most Common Function
            </h3>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
              {t(`behavior.function_${analytics.mostCommonFunction}`)}
            </p>
          </div>
        </div>
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
