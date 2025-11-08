import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
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
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { t } = useTranslation('common');
  const [behaviors, setBehaviors] = useState<BehaviorEntry[]>([]);
  const [reinforcers, setReinforcers] = useState<Reinforcer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              {t('analytics.milestones')}
            </h2>
            <div className="space-y-3">
              {analytics.milestones.slice(0, 3).map((milestone) => (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    milestone.type === 'improvement'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {milestone.description}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(milestone.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Behaviors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Behaviors</h2>
            <Link
              href="/behaviors"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {recentBehaviors.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No behaviors recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentBehaviors.map((behavior) => (
                <div
                  key={behavior.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {behavior.behavior}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {behavior.antecedent}
                      </p>
                    </div>
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
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/behaviors/new"
            className="p-6 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow transition-colors"
          >
            <h3 className="font-semibold mb-2">{t('behavior.new')}</h3>
            <p className="text-sm text-primary-100">
              Record a new behavior incident
            </p>
          </Link>
          <Link
            href="/analytics"
            className="p-6 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow transition-colors border border-gray-200 dark:border-gray-700"
          >
            <h3 className="font-semibold mb-2">{t('nav.analytics')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View trends and insights
            </p>
          </Link>
          <Link
            href="/crisis"
            className="p-6 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow transition-colors border border-gray-200 dark:border-gray-700"
          >
            <h3 className="font-semibold mb-2">{t('crisis.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage crisis protocols
            </p>
          </Link>
        </div>
      </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>
        {trend && trend !== 'neutral' && (
          <div>
            {trend === 'down' ? (
              <TrendingDown className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingUp className="w-5 h-5 text-red-600" />
            )}
          </div>
        )}
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
