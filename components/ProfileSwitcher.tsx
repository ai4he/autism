import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { Users } from 'lucide-react';
import { Profile } from '@/types';
import { getActiveProfile, initializeDefaultProfile } from '@/lib/profiles';
import dynamic from 'next/dynamic';

const ProfileManager = dynamic(() => import('./ProfileManager'), { ssr: false });

export default function ProfileSwitcher() {
  const { t } = useTranslation('common');
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveProfile();
  }, []);

  const loadActiveProfile = async () => {
    try {
      const profile = await initializeDefaultProfile();
      setActiveProfile(profile);
    } catch (error) {
      console.error('Error loading active profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = async () => {
    await loadActiveProfile();
  };

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  return (
    <>
      <button
        onClick={() => setShowManager(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        aria-label="Manage profiles"
      >
        {activeProfile ? (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: activeProfile.color }}
          >
            {activeProfile.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {activeProfile?.name || 'Profile'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {activeProfile ? t(`profile.type_${activeProfile.type}`) : 'Click to manage'}
          </p>
        </div>
      </button>

      {showManager && (
        <ProfileManager
          onClose={() => setShowManager(false)}
          onProfileChange={handleProfileChange}
        />
      )}
    </>
  );
}
