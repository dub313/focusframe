import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { KEYS } from '../lib/keys';
import { createDefaultProfile } from '../lib/day';
import type { Profile } from '../types';

const DEFAULT_PROFILE = createDefaultProfile();

export function useProfile() {
  const { data: profile, loading, set, refresh } = useStorage<Profile>(KEYS.PROFILE, DEFAULT_PROFILE);

  const addXP = useCallback((amount: number) => {
    set((prev) => ({ ...prev, totalXP: Math.max(0, prev.totalXP + amount) }));
  }, [set]);

  const incrementTasksCompleted = useCallback(() => {
    set((prev) => ({ ...prev, totalTasksCompleted: prev.totalTasksCompleted + 1 }));
  }, [set]);

  const addFocusMinutes = useCallback((minutes: number) => {
    set((prev) => ({ ...prev, totalFocusMinutes: prev.totalFocusMinutes + minutes }));
  }, [set]);

  const unlockFeature = useCallback((feature: string) => {
    set((prev) => {
      if (prev.unlockedFeatures.includes(feature)) return prev;
      return { ...prev, unlockedFeatures: [...prev.unlockedFeatures, feature] };
    });
  }, [set]);

  return { profile, loading, set, refresh, addXP, incrementTasksCompleted, addFocusMinutes, unlockFeature };
}
