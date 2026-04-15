import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { KEYS } from '../lib/keys';
import { createFreshState, getToday } from '../lib/day';
import type { DailyState, Task, MoodEntry, TrainingInfo } from '../types';

const DEFAULT_STATE = createFreshState(getToday());

export function useDailyState() {
  const { data: state, loading, set, refresh } = useStorage<DailyState>(KEYS.STATE, DEFAULT_STATE);

  const setEnergy = useCallback((energy: number) => {
    set((prev) => ({ ...prev, energy }));
  }, [set]);

  const setTraining = useCallback((training: TrainingInfo) => {
    set((prev) => ({ ...prev, training }));
  }, [set]);

  const setMood = useCallback((mood: MoodEntry) => {
    set((prev) => ({ ...prev, mood }));
  }, [set]);

  const completeBoot = useCallback((energy: number, training: TrainingInfo, mood: MoodEntry, batteryMax: number, sleepHours: number) => {
    set((prev) => ({
      ...prev,
      bootDone: true,
      energy,
      sleepHours,
      training,
      mood,
      batteryMax,
    }));
  }, [set]);

  const setTasks = useCallback((tasks: Task[]) => {
    set((prev) => ({ ...prev, tasks }));
  }, [set]);

  const addXP = useCallback((amount: number) => {
    set((prev) => ({ ...prev, xpEarnedToday: prev.xpEarnedToday + amount }));
  }, [set]);

  const useBattery = useCallback((cost: number) => {
    set((prev) => ({ ...prev, batteryUsed: prev.batteryUsed + cost }));
  }, [set]);

  const addRecovery = useCallback((bars: number) => {
    set((prev) => ({
      ...prev,
      batteryUsed: Math.max(0, prev.batteryUsed - bars),
      recoveryUsed: prev.recoveryUsed + 1,
    }));
  }, [set]);

  const activateSurge = useCallback(() => {
    set((prev) => ({ ...prev, surgeActive: true }));
  }, [set]);

  const incrementSurge = useCallback(() => {
    set((prev) => ({ ...prev, surgeTaskCount: prev.surgeTaskCount + 1 }));
  }, [set]);

  const setTopThreeComplete = useCallback(() => {
    set((prev) => ({ ...prev, topThreeComplete: true }));
  }, [set]);

  return {
    state,
    loading,
    refresh,
    setEnergy,
    setTraining,
    setMood,
    completeBoot,
    setTasks,
    addXP,
    useBattery,
    addRecovery,
    activateSurge,
    incrementSurge,
    setTopThreeComplete,
    setState: set,
  };
}
