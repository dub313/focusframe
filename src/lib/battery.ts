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

export function calculateBatteryMax(energy: number, training: TrainingType): number {
  const reserve = training === 'both' ? 3 : training === 'rest' ? 0 : 2;
  return Math.max(1, energy - reserve);
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
