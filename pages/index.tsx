import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import Onboarding from '@/components/Onboarding';
import { db, STORES } from '@/lib/db';
import { BehaviorEntry, Reinforcer } from '@/types';
import { calculateBehaviorAnalytics } from '@/lib/analytics';
import {
  Activity,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Gift,
  Calendar,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

const ContextualChat = dynamic(() => import('@/components/ContextualChat'), { ssr: false });

const ONBOARDING_KEY = 'aba-tracker-onboarding-completed';

export default function Dashboard() {
  const { t } = useTranslation('common');
  const [behaviors, setBehaviors] = useState<BehaviorEntry[]>([]);
  const [reinforcers, setReinforcers] = useState<Reinforcer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    loadData();

    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const loadData = async () => {
    try {
      const [behaviorData, reinforcerData] = await Promise.all([
        db.getAll<BehaviorEntry>(STORES.BEHAVIORS),
        db.getAll<Reinforcer>(STORES.REINFORCERS),
      ]);
      setBehaviors(behaviorData);
      setReinforcers(reinforcerData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analytics = calculateBehaviorAnalytics(behaviors);
  const recentBehaviors = [...behaviors]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const todayBehaviors = behaviors.filter(
    (b) => b.date === new Date().toISOString().split('T')[0]
  );

  const weekBehaviors = behaviors.filter((b) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(b.date) >= weekAgo;
  });

  const handleCompleteOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleSkipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOpenChat = () => {
    if (!geminiApiKey) {
      const key = prompt(
        t('language.switch') === 'Switch Language'
          ? 'Enter your Gemini API key to start the AI assistant:'
          : 'Ingresa tu API key de Gemini para iniciar el asistente de IA:'
      );
      if (key) {
        setGeminiApiKey(key);
        setShowChat(true);
      }
    } else {
      setShowChat(true);
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
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="mb-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of behavior tracking and insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Activity}
            title={t('nav.behaviors')}
            value={todayBehaviors.length.toString()}
            subtitle="Today"
            trend={
              todayBehaviors.length < weekBehaviors.length / 7
                ? 'down'
                : todayBehaviors.length > weekBehaviors.length / 7
                ? 'up'
                : 'neutral'
            }
          />
          <StatCard
            icon={Calendar}
            title="This Week"
            value={weekBehaviors.length.toString()}
            subtitle="Total incidents"
          />
          <StatCard
            icon={AlertCircle}
            title="Avg Severity"
            value={analytics.averageSeverity.toFixed(1)}
            subtitle="1-5 scale"
            trend={analytics.averageSeverity > 3 ? 'up' : 'down'}
          />
          <StatCard
            icon={Gift}
            title={t('nav.reinforcers')}
            value={reinforcers.length.toString()}
            subtitle="Available"
          />
        </div>

        {/* Recent Milestones */}
        {analytics.milestones.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-medium border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp className="w-6 h-6 text-success-600" />
              {t('analytics.milestones')}
            </h2>
            <div className="space-y-4">
              {analytics.milestones.slice(0, 3).map((milestone) => (
                <div
                  key={milestone.id}
                  className={`p-5 rounded-xl border-l-4 ${
                    milestone.type === 'improvement'
                      ? 'bg-success-50 dark:bg-success-900/20 border-success-500'
                      : 'bg-warning-50 dark:bg-warning-900/20 border-warning-500'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {milestone.description}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 font-medium">
                    {new Date(milestone.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Behaviors */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-medium border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Behaviors</h2>
            <Link
              href="/behaviors"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors flex items-center gap-1"
            >
              View All →
            </Link>
          </div>
          {recentBehaviors.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                No behaviors recorded yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Start tracking by creating your first behavior entry
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBehaviors.map((behavior) => (
                <div
                  key={behavior.id}
                  className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {behavior.behavior}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">
                        {behavior.antecedent}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                        behavior.severity >= 4
                          ? 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400'
                          : behavior.severity >= 3
                          ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                          : 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                      }`}
                    >
                      {t(`behavior.severity_${behavior.severity}`)}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <span>{new Date(behavior.date).toLocaleDateString()}</span>
                    <span>{behavior.time}</span>
                    <span className="capitalize">{behavior.function}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            href="/behaviors/new"
            className="group p-6 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl shadow-medium hover:shadow-strong transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5" />
              <h3 className="font-bold text-lg">{t('behavior.new')}</h3>
            </div>
            <p className="text-sm text-primary-100 leading-relaxed">
              Record a new behavior incident
            </p>
          </Link>
          <button
            onClick={handleOpenChat}
            className="group p-6 bg-gradient-to-br from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white rounded-xl shadow-medium hover:shadow-strong transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-bold text-lg">
                {t('language.switch') === 'Switch Language'
                  ? 'AI Assistant'
                  : 'Asistente de IA'}
              </h3>
            </div>
            <p className="text-sm text-accent-100 leading-relaxed">
              {t('language.switch') === 'Switch Language'
                ? 'Ask questions about your child'
                : 'Haz preguntas sobre tu hijo/a'}
            </p>
          </button>
          <Link
            href="/analytics"
            className="group p-6 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl shadow-medium hover:shadow-strong transition-all border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-success-600" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('nav.analytics')}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              View trends and insights
            </p>
          </Link>
          <Link
            href="/crisis"
            className="group p-6 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl shadow-medium hover:shadow-strong transition-all border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-danger-600" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('crisis.title')}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Manage crisis protocols
            </p>
          </Link>
        </div>

        {/* Help/Tutorial Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleShowOnboarding}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20 border-2 border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-400 rounded-xl hover:border-accent-400 dark:hover:border-accent-600 transition-all shadow-soft hover:shadow-medium"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-semibold">
              {t('language.switch') === 'Switch Language'
                ? 'View Tutorial & ABA Guide'
                : 'Ver Tutorial y Guía de ABA'}
            </span>
          </button>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <Onboarding
          onComplete={handleCompleteOnboarding}
          onSkip={handleSkipOnboarding}
        />
      )}

      {/* Contextual Chat Modal */}
      {showChat && (
        <ContextualChat
          apiKey={geminiApiKey}
          behaviors={behaviors}
          onClose={() => setShowChat(false)}
        />
      )}
    </Layout>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-medium hover:shadow-strong border border-gray-200 dark:border-gray-700 p-6 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        {trend && trend !== 'neutral' && (
          <div className={`p-2 rounded-lg ${
            trend === 'down'
              ? 'bg-success-100 dark:bg-success-900/30'
              : 'bg-danger-100 dark:bg-danger-900/30'
          }`}>
            {trend === 'down' ? (
              <TrendingDown className="w-5 h-5 text-success-600 dark:text-success-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-danger-600 dark:text-danger-400" />
            )}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {value}
        </p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
