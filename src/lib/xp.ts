import type { TaskType } from '../types';

const BASE_XP: Record<TaskType, number> = {
  quick_win: 15,
  standard: 30,
  multi_level: 20, // per step, +50 completion bonus
  multi_day: 25,   // per milestone, +75 completion bonus
  continuous: 20,
};

export function getBaseXP(type: TaskType): number {
  return BASE_XP[type];
}

export function getMultiLevelBonusXP(): number {
  return 50;
}

export function getMultiDayBonusXP(): number {
  return 75;
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 5;
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export function getSurgeMultiplier(surgeTaskIndex: number): number {
  // surgeTaskIndex: 1 = first surge task (4th overall), 2 = second, etc.
  if (surgeTaskIndex <= 0) return 1;
  if (surgeTaskIndex === 1) return 1.5;
  if (surgeTaskIndex === 2) return 2;
  if (surgeTaskIndex === 3) return 3;
  return 4; // 4+ capped
}

export function calculateXP(
  baseXP: number,
  streak: number,
  surgeTaskIndex: number
): number {
  const streakMult = getStreakMultiplier(streak);
  const surgeMult = getSurgeMultiplier(surgeTaskIndex);
  return Math.round(baseXP * streakMult * surgeMult);
}

export const TRAINING_XP: Record<string, number> = {
  boxing: 100,
  baseball_practice: 75,
  baseball_game: 100,
  both: 150,
};

export const BOOT_XP = 5;
export const MOOD_CHECKIN_XP = 5;
export const POMODORO_XP = 20;
export const ROUTINE_COMPLETE_XP = 25;
export const BREATHING_XP = 10;

export const RECOVERY_XP: Record<string, number> = {
  exercise: 25,
  breathing: 10,
  rest: 10,
  fun: 5,
};
