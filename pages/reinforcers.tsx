import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { db, STORES } from '@/lib/db';
import { Reinforcer, ReinforcerType } from '@/types';
import { Plus, Gift, Candy, Star, Heart, Trash2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function Reinforcers() {
  const { t } = useTranslation('common');
  const [reinforcers, setReinforcers] = useState<Reinforcer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    type: ReinforcerType.EDIBLE,
    effectiveness: 3,
    avoidRepetitionDays: 7,
    notes: '',
  });

  useEffect(() => {
    loadReinforcers();
  }, []);

  const loadReinforcers = async () => {
    try {
      const data = await db.getAll<Reinforcer>(STORES.REINFORCERS);
      setReinforcers(data);
    } catch (error) {
      console.error('Error loading reinforcers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const reinforcer: Reinforcer = {
        id: `reinforcer-${Date.now()}`,
        name: formData.name,
        type: formData.type,
        usageCount: 0,
        effectiveness: formData.effectiveness,
        avoidRepetitionDays: formData.avoidRepetitionDays,
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.add(STORES.REINFORCERS, reinforcer);
      await loadReinforcers();
      setShowForm(false);
      setFormData({
        name: '',
        type: ReinforcerType.EDIBLE,
        effectiveness: 3,
        avoidRepetitionDays: 7,
        notes: '',
      });
    } catch (error) {
      console.error('Error adding reinforcer:', error);
    }
  };

  const handleUse = async (reinforcer: Reinforcer) => {
    try {
      const updated: Reinforcer = {
        ...reinforcer,
        lastUsed: new Date().toISOString(),
        usageCount: reinforcer.usageCount + 1,
        updatedAt: new Date().toISOString(),
      };
      await db.update(STORES.REINFORCERS, updated);
      await loadReinforcers();
    } catch (error) {
      console.error('Error updating reinforcer:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this reinforcer?')) {
      try {
        await db.delete(STORES.REINFORCERS, id);
        await loadReinforcers();
      } catch (error) {
        console.error('Error deleting reinforcer:', error);
      }
    }
  };

  const canUseReinforcer = (reinforcer: Reinforcer): boolean => {
    if (!reinforcer.lastUsed || !reinforcer.avoidRepetitionDays) return true;
    const daysSinceLastUse = differenceInDays(
      new Date(),
      new Date(reinforcer.lastUsed)
    );
    return daysSinceLastUse >= reinforcer.avoidRepetitionDays;
  };

  const getTypeIcon = (type: ReinforcerType) => {
    switch (type) {
      case ReinforcerType.EDIBLE:
        return <Candy className="w-5 h-5" />;
      case ReinforcerType.TANGIBLE:
        return <Gift className="w-5 h-5" />;
      case ReinforcerType.ACTIVITY:
        return <Star className="w-5 h-5" />;
      case ReinforcerType.SOCIAL:
        return <Heart className="w-5 h-5" />;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('reinforcer.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage reinforcers and track usage to avoid satiation
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('reinforcer.new')}
          </button>
        </div>

        {/* Add Reinforcer Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">{t('reinforcer.new')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('reinforcer.name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., M&Ms, Toy car, iPad time"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('reinforcer.type')} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as ReinforcerType,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={ReinforcerType.EDIBLE}>
                      {t('reinforcer.type_edible')}
                    </option>
                    <option value={ReinforcerType.TANGIBLE}>
                      {t('reinforcer.type_tangible')}
                    </option>
                    <option value={ReinforcerType.ACTIVITY}>
                      {t('reinforcer.type_activity')}
                    </option>
                    <option value={ReinforcerType.SOCIAL}>
                      {t('reinforcer.type_social')}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('reinforcer.effectiveness')} (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.effectiveness}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effectiveness: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('reinforcer.avoid_repetition')} ({t('reinforcer.days')})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.avoidRepetitionDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        avoidRepetitionDays: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('reinforcer.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any special instructions or notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reinforcers Grid */}
        {reinforcers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No reinforcers added yet
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('reinforcer.new')} →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reinforcers.map((reinforcer) => {
              const canUse = canUseReinforcer(reinforcer);
              return (
                <div
                  key={reinforcer.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
                    canUse ? '' : 'opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                        {getTypeIcon(reinforcer.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {reinforcer.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {t(`reinforcer.type_${reinforcer.type}`)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(reinforcer.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('reinforcer.effectiveness')}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= reinforcer.effectiveness
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('reinforcer.frequency')}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {reinforcer.usageCount} times
                      </span>
                    </div>

                    {reinforcer.lastUsed && (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('reinforcer.last_used')}:{' '}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {new Date(reinforcer.lastUsed).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {!canUse && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        ⚠️ Wait{' '}
                        {reinforcer.avoidRepetitionDays! -
                          differenceInDays(
                            new Date(),
                            new Date(reinforcer.lastUsed!)
                          )}{' '}
                        more days
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleUse(reinforcer)}
                    disabled={!canUse}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use This Reinforcer
                  </button>
                </div>
              );
            })}
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
