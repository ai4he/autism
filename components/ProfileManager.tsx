import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { Profile, ProfileType } from '@/types';
import {
  getAllProfiles,
  createProfile,
  updateProfile,
  deactivateProfile,
  switchProfile,
  getActiveProfileId,
  exportAllData,
  importAllData,
} from '@/lib/profiles';
import { X, Plus, Users, Download, Upload, Check, Trash2 } from 'lucide-react';

interface ProfileManagerProps {
  onClose: () => void;
  onProfileChange?: () => void;
}

export default function ProfileManager({ onClose, onProfileChange }: ProfileManagerProps) {
  const { t } = useTranslation('common');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<ProfileType>(ProfileType.THERAPIST);
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const allProfiles = await getAllProfiles();
    setProfiles(allProfiles.filter(p => p.isActive));
    setActiveProfileId(getActiveProfileId());
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) {
      alert(t('profile.name_required'));
      return;
    }

    setLoading(true);
    try {
      await createProfile(newProfileName.trim(), newProfileType, newProfileEmail.trim() || undefined);
      setNewProfileName('');
      setNewProfileEmail('');
      setShowAddForm(false);
      await loadProfiles();
      if (onProfileChange) onProfileChange();
    } catch (error) {
      console.error('Error creating profile:', error);
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProfile = async (profileId: string) => {
    try {
      await switchProfile(profileId);
      setActiveProfileId(profileId);
      if (onProfileChange) onProfileChange();
      onClose();
    } catch (error) {
      console.error('Error switching profile:', error);
      alert(t('common.error'));
    }
  };

  const handleDeactivateProfile = async (profileId: string) => {
    if (profiles.length <= 1) {
      alert(t('profile.cannot_delete_last'));
      return;
    }

    if (confirm(t('profile.confirm_delete'))) {
      try {
        await deactivateProfile(profileId);

        // If we deleted the active profile, switch to another one
        if (profileId === activeProfileId) {
          const remaining = profiles.filter(p => p.id !== profileId);
          if (remaining.length > 0) {
            await switchProfile(remaining[0].id);
            setActiveProfileId(remaining[0].id);
          }
        }

        await loadProfiles();
        if (onProfileChange) onProfileChange();
      } catch (error) {
        console.error('Error deactivating profile:', error);
        alert(t('common.error'));
      }
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aba-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert(t('common.error'));
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (confirm(t('profile.confirm_import'))) {
        await importAllData(data);
        await loadProfiles();
        if (onProfileChange) onProfileChange();
        alert(t('profile.import_success'));
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert(t('profile.import_error'));
    }
  };

  const getProfileTypeLabel = (type: ProfileType): string => {
    return t(`profile.type_${type}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('profile.manage_accounts')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('profile.manage_accounts_desc')}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile List */}
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  profile.id === activeProfileId
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
                onClick={() => handleSwitchProfile(profile.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: profile.color }}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {profile.name}
                        </h3>
                        {profile.id === activeProfileId && (
                          <span className="flex items-center gap-1 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            {t('profile.active')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getProfileTypeLabel(profile.type)}
                      </p>
                      {profile.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {profile.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeactivateProfile(profile.id);
                    }}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Profile Form */}
          {showAddForm ? (
            <div className="p-4 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-xl bg-primary-50/50 dark:bg-primary-900/10">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {t('profile.add_new')}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.name')}
                  </label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder={t('profile.name_placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.type')}
                  </label>
                  <select
                    value={newProfileType}
                    onChange={(e) => setNewProfileType(e.target.value as ProfileType)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={ProfileType.PARENT}>{t('profile.type_parent')}</option>
                    <option value={ProfileType.THERAPIST}>{t('profile.type_therapist')}</option>
                    <option value={ProfileType.CAREGIVER}>{t('profile.type_caregiver')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.email')} ({t('common.optional')})
                  </label>
                  <input
                    type="email"
                    value={newProfileEmail}
                    onChange={(e) => setNewProfileEmail(e.target.value)}
                    placeholder={t('profile.email_placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddProfile}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : t('common.save')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewProfileName('');
                      setNewProfileEmail('');
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">{t('profile.add_account')}</span>
            </button>
          )}

          {/* Data Management */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              {t('profile.data_management')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportData}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">{t('profile.export_backup')}</span>
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">{t('profile.import_backup')}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              {t('profile.backup_warning')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
