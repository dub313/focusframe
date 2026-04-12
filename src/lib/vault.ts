import type { VaultDeposit, RewardTier } from '../types';

export function createDeposit(amount: number): VaultDeposit {
  return {
    id: crypto.randomUUID(),
    amount,
    depositedAt: new Date().toISOString(),
    daysHeld: 0,
    currentValue: amount,
  };
}

export function getDepositTier(daysHeld: number): RewardTier {
  if (daysHeld >= 30) return 'diamond';
  if (daysHeld >= 7) return 'gold';
  if (daysHeld >= 3) return 'silver';
  return 'bronze';
}

export function getTierMultiplier(tier: RewardTier): number {
  switch (tier) {
    case 'diamond': return 5;
    case 'gold': return 2.5;
    case 'silver': return 1.5;
    case 'bronze': return 1;
  }
}

export function getVaultTotal(deposits: VaultDeposit[]): number {
  return deposits.reduce((sum, d) => sum + d.currentValue, 0);
}

export function projectValue(amount: number, days: number): number {
  return Math.round(amount * Math.pow(1.05, days));
}

export const TIER_COLORS: Record<RewardTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#f59e0b',
  diamond: '#22d3ee',
};

export const TIER_LABELS: Record<RewardTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
};

export function createDefaultVault() {
  return {
    deposits: [] as VaultDeposit[],
    totalDeposited: 0,
    burnBalance: 0,
  };
}
