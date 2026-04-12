import type { DailyState, DailySummary, Profile, VaultState, TrainingInfo, MoodEntry } from '../types';

export function getToday(): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date());
}

export function isDayTransition(storedDate: string | undefined): boolean {
  if (!storedDate) return true;
  return storedDate !== getToday();
}

export function createFreshState(date: string): DailyState {
  return {
    date,
    bootDone: false,
    energy: 3,
    training: { type: 'rest' } as TrainingInfo,
    mood: { timestamp: new Date().toISOString(), level: 3 } as MoodEntry,
    tasks: [],
    batteryMax: 3,
    batteryUsed: 0,
    recoveryUsed: 0,
    surgeActive: false,
    surgeTaskCount: 0,
    xpEarnedToday: 0,
    topThreeComplete: false,
  };
}

export function createDefaultProfile(): Profile {
  return {
    totalXP: 0,
    currentStreak: 0,
    firstUseDate: getToday(),
    daysActive: 0,
    totalTasksCompleted: 0,
    totalFocusMinutes: 0,
    personalRecords: {
      bestStreak: 0,
      bestSurgeDay: 0,
      mostTasksInDay: 0,
      longestFocusMinutes: 0,
      highestDailyXP: 0,
      longestVaultHold: 0,
    },
    unlockedFeatures: ['boot', 'dashboard', 'quick_win', 'standard', 'battery'],
  };
}

export function summarizeDay(state: DailyState): DailySummary {
  const completed = state.tasks.filter((t) => t.completed).length;
  return {
    date: state.date,
    tasksCompleted: completed,
    tasksTotal: state.tasks.length,
    mood: state.mood.level,
    energy: state.energy,
    training: state.training.type,
    surgeActivated: state.surgeActive,
    surgeTaskCount: state.surgeTaskCount,
    xpEarned: state.xpEarnedToday,
    focusMinutes: 0,
    streakDay: 0, // filled in by rollover
  };
}

export function rolloverState(
  oldState: DailyState,
  profile: Profile,
  vault: VaultState,
  history: DailySummary[]
): { newState: DailyState; updatedProfile: Profile; updatedVault: VaultState; updatedHistory: DailySummary[] } {
  const today = getToday();

  // Archive yesterday
  const summary = summarizeDay(oldState);
  const topThreeDone = oldState.tasks.filter((t) => t.isTopThree && t.completed).length >= 3;
  summary.streakDay = profile.currentStreak;

  // Streak calculation
  let newStreak = profile.currentStreak;
  if (topThreeDone) {
    newStreak += 1;
  } else {
    newStreak = 0;
  }

  // Update personal records
  const records = { ...profile.personalRecords };
  if (newStreak > records.bestStreak) {
    records.bestStreak = newStreak;
    records.bestStreakDate = oldState.date;
  }
  if (oldState.surgeTaskCount > records.bestSurgeDay) {
    records.bestSurgeDay = oldState.surgeTaskCount;
    records.bestSurgeDayDate = oldState.date;
  }
  const tasksCompleted = oldState.tasks.filter((t) => t.completed).length;
  if (tasksCompleted > records.mostTasksInDay) {
    records.mostTasksInDay = tasksCompleted;
    records.mostTasksDate = oldState.date;
  }
  if (oldState.xpEarnedToday > records.highestDailyXP) {
    records.highestDailyXP = oldState.xpEarnedToday;
    records.highestDailyXPDate = oldState.date;
  }

  // Vault compound growth (5% daily on each deposit)
  const updatedDeposits = vault.deposits.map((d) => ({
    ...d,
    daysHeld: d.daysHeld + 1,
    currentValue: Math.round(d.currentValue * 1.05),
  }));

  // Check longest vault hold
  const maxHold = Math.max(0, ...updatedDeposits.map((d) => d.daysHeld));
  if (maxHold > records.longestVaultHold) {
    records.longestVaultHold = maxHold;
  }

  // Carry over multi-day and continuous tasks
  const carryoverTasks = oldState.tasks
    .filter((t) => (t.type === 'multi_day' && !t.completed) || t.type === 'continuous')
    .map((t) => {
      if (t.type === 'continuous') {
        return { ...t, completed: false };
      }
      return { ...t };
    });

  const updatedProfile: Profile = {
    ...profile,
    currentStreak: newStreak,
    lastStreakDate: oldState.date,
    daysActive: profile.daysActive + 1,
    personalRecords: records,
  };

  return {
    newState: {
      ...createFreshState(today),
      tasks: carryoverTasks,
    },
    updatedProfile,
    updatedVault: {
      ...vault,
      deposits: updatedDeposits,
    },
    updatedHistory: [...history, summary],
  };
}
