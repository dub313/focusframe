import type { TaskType, TrainingType } from '../types';

const ENERGY_COST: Record<TaskType, number> = {
  quick_win: 1,
  standard: 2,
  multi_level: 1, // per step
  multi_day: 2,   // per milestone
  continuous: 1,
};

export function getEnergyCost(type: TaskType): number {
  return ENERGY_COST[type];
}

// Sleep multiplier: anchors are 8h=1.0, 6h=0.9, 4h=0.6, <4h=0.4 floor.
// Athletic teens recover hard — 8+ hours restores full capacity.
export function getSleepMultiplier(hours: number | undefined): number {
  if (hours == null) return 1; // no data → assume rested
  if (hours >= 8) return 1;
  if (hours >= 6) return 0.9 + (hours - 6) * 0.05;   // 6→0.90, 7→0.95, 8→1.00
  if (hours >= 4) return 0.6 + (hours - 4) * 0.15;   // 4→0.60, 5→0.75, 6→0.90
  return 0.4;
}

// Battery capacity tuned for a fit 15yo athlete. Base `energy*2 + 2` gives
// 4–12 bars before training reserve, then sleep scales the whole thing.
// Floor of 2 so even the worst day leaves room for quick wins.
export function calculateBatteryMax(
  energy: number,
  training: TrainingType,
  sleepHours?: number,
): number {
  const reserve = training === 'both' ? 3 : training === 'rest' ? 0 : 2;
  const rawMax = energy * 2 + 2;
  const afterTraining = rawMax - reserve;
  const scaled = afterTraining * getSleepMultiplier(sleepHours);
  return Math.max(2, Math.round(scaled));
}

export function getBatteryRemaining(max: number, used: number): number {
  return Math.max(0, max - used);
}

export function getBatteryPercent(max: number, used: number): number {
  if (max <= 0) return 0;
  return Math.round((getBatteryRemaining(max, used) / max) * 100);
}

export function getBatteryColor(percent: number): string {
  if (percent > 60) return '#10b981'; // emerald
  if (percent > 30) return '#f59e0b'; // amber
  return '#f43f5e'; // rose
}

export type RecoveryAction = 'exercise' | 'breathing' | 'rest' | 'fun';

const RECOVERY_BARS: Record<RecoveryAction, number> = {
  exercise: 2,
  breathing: 1,
  rest: 1,
  fun: 1,
};

export function getRecoveryBars(action: RecoveryAction): number {
  return RECOVERY_BARS[action];
}

export const MAX_RECOVERY_PER_DAY = 3;

export function getWorkloadStatus(
  totalCost: number,
  available: number
): 'green' | 'yellow' | 'red' {
  if (totalCost <= available) return 'green';
  if (totalCost <= available + 2) return 'yellow';
  return 'red';
}
