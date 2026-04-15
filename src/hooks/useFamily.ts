import { useState, useEffect, useCallback } from 'react';
import {
  onParentTasks,
  pushChildProgress,
  markParentTaskComplete,
  familyExists,
} from '../lib/firebase';
import type { DailyState, Profile, VaultState, ParentTask, ChildProgress } from '../types';
import { getVaultTotal } from '../lib/vault';

export function useFamily() {
  const [familyCode, setFamilyCode] = useState<string | null>(null);
  const [parentTasks, setParentTasks] = useState<ParentTask[]>([]);
  const [connected, setConnected] = useState(false);

  // Load saved family code
  useEffect(() => {
    const stored = localStorage.getItem('focusframe:childFamilyCode');
    if (stored) {
      setFamilyCode(stored);
      setConnected(true);
    }
  }, []);

  // Subscribe to parent tasks (include completed ones — Dashboard filters)
  useEffect(() => {
    if (!familyCode || !connected) return;
    const unsub = onParentTasks(familyCode, (tasks) => {
      setParentTasks(tasks);
    });
    return unsub;
  }, [familyCode, connected]);

  // Connect to family
  const connect = useCallback(async (code: string): Promise<boolean> => {
    const trimmed = code.toUpperCase().trim();
    const exists = await familyExists(trimmed);
    if (exists) {
      localStorage.setItem('focusframe:childFamilyCode', trimmed);
      setFamilyCode(trimmed);
      setConnected(true);
      return true;
    }
    return false;
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('focusframe:childFamilyCode');
    setFamilyCode(null);
    setConnected(false);
    setParentTasks([]);
  }, []);

  // Push full child state to Firebase. Fire-and-forget, silent on error.
  const syncProgress = useCallback(
    async (state: DailyState, profile: Profile, vault: VaultState) => {
      if (!familyCode || !connected) return;

      const topThreeAll = state.tasks.filter((t) => t.isTopThree);
      const topThreeDone = topThreeAll.filter((t) => t.completed).length;

      const progress: ChildProgress = {
        lastUpdated: new Date().toISOString(),
        bootedAt: state.bootDone ? state.mood?.timestamp : undefined,
        sleepHours: state.sleepHours,
        batteryMax: state.batteryMax,
        batteryUsed: state.batteryUsed,
        recoveryUsed: state.recoveryUsed,
        topThreeDone,
        topThreeTotal: topThreeAll.length,
        totalXP: profile.totalXP,
        currentStreak: profile.currentStreak,
        daysActive: profile.daysActive,
        totalTasksCompleted: profile.totalTasksCompleted,
        todayTasksDone: state.tasks.filter((t) => t.completed).length,
        todayTasksTotal: state.tasks.length,
        todayEnergy: state.energy,
        todayTraining: state.training.type,
        todayXP: state.xpEarnedToday,
        surgeActive: state.surgeActive,
        vaultBalance: getVaultTotal(vault.deposits),
        burnBalance: vault.burnBalance,
      };

      try {
        await pushChildProgress(familyCode, progress);
      } catch {
        // Silently fail — don't break the app if offline
      }
    },
    [familyCode, connected],
  );

  // Mark a parent-assigned task as complete (called from Dashboard on task complete)
  const completeParentTask = useCallback(
    async (taskId: string) => {
      if (!familyCode) return;
      try {
        await markParentTaskComplete(familyCode, taskId);
      } catch {
        // Silently fail
      }
    },
    [familyCode],
  );

  return {
    familyCode,
    connected,
    parentTasks,
    connect,
    disconnect,
    syncProgress,
    completeParentTask,
  };
}
