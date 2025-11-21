// Profile management utilities
import { db, STORES } from './db';
import { Profile, ProfileType } from '@/types';

const ACTIVE_PROFILE_KEY = 'aba-active-profile';

// Generate random color for profile avatar
export const generateProfileColor = (): string => {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#8B5CF6', // purple
    '#F59E0B', // amber
    '#EF4444', // red
    '#06B6D4', // cyan
    '#EC4899', // pink
    '#6366F1', // indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Get active profile from localStorage
export const getActiveProfileId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
};

// Set active profile in localStorage
export const setActiveProfileId = (profileId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
};

// Get active profile object
export const getActiveProfile = async (): Promise<Profile | null> => {
  const profileId = getActiveProfileId();
  if (!profileId) return null;

  const profile = await db.get<Profile>(STORES.PROFILES, profileId);
  return profile || null;
};

// Create a new profile
export const createProfile = async (
  name: string,
  type: ProfileType,
  email?: string
): Promise<Profile> => {
  const profile: Profile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    email,
    color: generateProfileColor(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.add(STORES.PROFILES, profile);
  return profile;
};

// Get all profiles
export const getAllProfiles = async (): Promise<Profile[]> => {
  return await db.getAll<Profile>(STORES.PROFILES);
};

// Get active profiles only
export const getActiveProfiles = async (): Promise<Profile[]> => {
  const allProfiles = await getAllProfiles();
  return allProfiles.filter(p => p.isActive);
};

// Update profile
export const updateProfile = async (profile: Profile): Promise<void> => {
  profile.updatedAt = new Date().toISOString();
  await db.update(STORES.PROFILES, profile);
};

// Deactivate profile (soft delete)
export const deactivateProfile = async (profileId: string): Promise<void> => {
  const profile = await db.get<Profile>(STORES.PROFILES, profileId);
  if (profile) {
    profile.isActive = false;
    await updateProfile(profile);
  }
};

// Switch active profile
export const switchProfile = async (profileId: string): Promise<void> => {
  const profile = await db.get<Profile>(STORES.PROFILES, profileId);
  if (profile && profile.isActive) {
    setActiveProfileId(profileId);
  } else {
    throw new Error('Profile not found or inactive');
  }
};

// Initialize default profile if none exists
export const initializeDefaultProfile = async (): Promise<Profile> => {
  const profiles = await getAllProfiles();

  if (profiles.length === 0) {
    // Create default parent profile
    const defaultProfile = await createProfile('Parent', ProfileType.PARENT);
    setActiveProfileId(defaultProfile.id);
    return defaultProfile;
  }

  // Ensure an active profile is set
  const activeId = getActiveProfileId();
  if (!activeId || !profiles.find(p => p.id === activeId)) {
    const firstActive = profiles.find(p => p.isActive);
    if (firstActive) {
      setActiveProfileId(firstActive.id);
      return firstActive;
    } else {
      // No active profiles, create one
      const newProfile = await createProfile('Parent', ProfileType.PARENT);
      setActiveProfileId(newProfile.id);
      return newProfile;
    }
  }

  const activeProfile = profiles.find(p => p.id === activeId);
  return activeProfile || profiles[0];
};

// Export all data for backup
export const exportAllData = async () => {
  const [behaviors, reinforcers, crisisProtocols, profiles] = await Promise.all([
    db.getAll(STORES.BEHAVIORS),
    db.getAll(STORES.REINFORCERS),
    db.getAll(STORES.CRISIS_PROTOCOLS),
    db.getAll(STORES.PROFILES),
  ]);

  return {
    version: 2,
    exportDate: new Date().toISOString(),
    data: {
      behaviors,
      reinforcers,
      crisisProtocols,
      profiles,
    },
  };
};

// Import data from backup
export const importAllData = async (backupData: any): Promise<void> => {
  if (!backupData.data) {
    throw new Error('Invalid backup format');
  }

  const { behaviors, reinforcers, crisisProtocols, profiles } = backupData.data;

  // Import profiles first
  if (profiles && Array.isArray(profiles)) {
    for (const profile of profiles) {
      try {
        await db.add(STORES.PROFILES, profile);
      } catch (error) {
        // Profile might already exist, try updating
        await db.update(STORES.PROFILES, profile);
      }
    }
  }

  // Import behaviors
  if (behaviors && Array.isArray(behaviors)) {
    for (const behavior of behaviors) {
      try {
        await db.add(STORES.BEHAVIORS, behavior);
      } catch (error) {
        await db.update(STORES.BEHAVIORS, behavior);
      }
    }
  }

  // Import reinforcers
  if (reinforcers && Array.isArray(reinforcers)) {
    for (const reinforcer of reinforcers) {
      try {
        await db.add(STORES.REINFORCERS, reinforcer);
      } catch (error) {
        await db.update(STORES.REINFORCERS, reinforcer);
      }
    }
  }

  // Import crisis protocols
  if (crisisProtocols && Array.isArray(crisisProtocols)) {
    for (const protocol of crisisProtocols) {
      try {
        await db.add(STORES.CRISIS_PROTOCOLS, protocol);
      } catch (error) {
        await db.update(STORES.CRISIS_PROTOCOLS, protocol);
      }
    }
  }
};
