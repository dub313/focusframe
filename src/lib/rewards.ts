import type { VaultDeposit, RewardTier, SharedReward, RewardCategory } from '../types';
import { getDepositTier, getTierMultiplier } from './vault';

// XP anchors by category (tunable guidance shown in the Add Reward modal)
export const CATEGORY_XP_RANGE: Record<RewardCategory, { min: number; max: number; label: string }> = {
  minor: { min: 0, max: 500, label: 'small stuff' },
  medium: { min: 500, max: 2000, label: 'weekly wins' },
  major: { min: 2000, max: 5000, label: 'big-ticket goals' },
};

// Derive the category from the XP cost. Rewards auto-bucket by price:
// <500 → minor, 500–1999 → medium, 2000+ → major.
export function categoryForCost(xpCost: number): RewardCategory {
  if (xpCost >= 2000) return 'major';
  if (xpCost >= 500) return 'medium';
  return 'minor';
}

export const CATEGORY_LABEL: Record<RewardCategory, string> = {
  minor: 'Minor',
  medium: 'Medium',
  major: 'Major',
};

export const CATEGORY_COLOR: Record<RewardCategory, string> = {
  minor: '#22d3ee',
  medium: '#f59e0b',
  major: '#a78bfa',
};

// Preset seed data — a one-tap starter catalog for first-time portal setup
export const REWARD_PRESETS: Omit<SharedReward, 'id' | 'createdAt'>[] = [
  // Minor (100-200 XP)
  { name: 'Slim Jim', description: 'Snack run reward', category: 'minor', xpCost: 120, active: true },
  { name: '2 hours video game time', description: 'Extra gaming slot', category: 'minor', xpCost: 180, active: true },
  { name: 'Pick tonight\'s dinner', description: 'Your call on dinner', category: 'minor', xpCost: 150, active: true },
  { name: 'Stay up 30 min late', description: 'One late night', category: 'minor', xpCost: 160, active: true },
  // Medium (500-1000 XP)
  { name: '$10 cash or gift card', description: 'Straight cash', category: 'medium', xpCost: 700, active: true },
  { name: 'Movie night (your pick)', description: 'Full movie night, your choice', category: 'medium', xpCost: 600, active: true },
  { name: 'Skip a chore', description: 'One-time chore pass', category: 'medium', xpCost: 500, active: true },
  { name: '3 hours extra screen time', description: 'Weekend bonus block', category: 'medium', xpCost: 800, active: true },
  // Major (2000+ XP)
  { name: '$25 cash', description: 'Bigger payout', category: 'major', xpCost: 2000, active: true },
  { name: 'New gear / gloves', description: 'Gear upgrade (up to $50)', category: 'major', xpCost: 2500, active: true },
  { name: 'Ticket to a game', description: 'Live sports ticket', category: 'major', xpCost: 3000, active: true },
  { name: 'Big-ticket item ($50)', description: 'Something you\'ve been saving for', category: 'major', xpCost: 4000, active: true },
];

// === Effective cost math (tier discount via vault) ===

export interface DepositUsage {
  id: string;
  xpWithdrawn: number;        // actual XP removed from this deposit
  tier: RewardTier;
  tierMultiplier: number;     // purchasing power per 1 XP (bronze 1, silver 1.5, gold 2.5, diamond 5)
}

export interface CostBreakdown {
  listedCost: number;
  actualXPSpent: number;      // burnPaid + vaultPaid (raw XP leaving accounts)
  burnPaid: number;
  vaultPaid: number;
  depositsUsed: DepositUsage[];
  affordable: boolean;
  savings: number;            // listedCost - actualXPSpent (how much the discount saved)
}

function daysHeld(depositedAt: string): number {
  const then = new Date(depositedAt).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

// Compute how a redemption at `listedCost` would be paid given current burn + vault state.
// Strategy: consume highest-tier deposits first (maximum discount → minimum XP actually spent),
// then fall back to burn balance. Kid is always best-served by the tier-discount system.
export function computeEffectiveCost(
  listedCost: number,
  burnBalance: number,
  vaultDeposits: VaultDeposit[],
): CostBreakdown {
  let remaining = listedCost;
  const depositsUsed: DepositUsage[] = [];
  let vaultPaid = 0;

  const sorted = [...vaultDeposits]
    .map((d) => ({ deposit: d, tier: getDepositTier(daysHeld(d.depositedAt)) }))
    .sort((a, b) => getTierMultiplier(b.tier) - getTierMultiplier(a.tier));

  for (const { deposit, tier } of sorted) {
    if (remaining <= 0) break;
    if (deposit.currentValue <= 0) continue;
    const mult = getTierMultiplier(tier);
    const purchasingPower = deposit.currentValue * mult;

    if (purchasingPower >= remaining) {
      // Partial withdrawal — round up to whole XP so we don't underpay
      const xpNeeded = Math.ceil(remaining / mult);
      depositsUsed.push({ id: deposit.id, xpWithdrawn: xpNeeded, tier, tierMultiplier: mult });
      vaultPaid += xpNeeded;
      remaining = 0;
    } else {
      // Use entire deposit
      depositsUsed.push({
        id: deposit.id,
        xpWithdrawn: deposit.currentValue,
        tier,
        tierMultiplier: mult,
      });
      vaultPaid += deposit.currentValue;
      remaining -= purchasingPower;
    }
  }

  let burnPaid = 0;
  if (remaining > 0) {
    burnPaid = Math.min(burnBalance, remaining);
    remaining -= burnPaid;
  }

  const affordable = remaining <= 0.001;
  const actualXPSpent = Math.round(burnPaid + vaultPaid);

  return {
    listedCost,
    actualXPSpent,
    burnPaid: Math.round(burnPaid),
    vaultPaid: Math.round(vaultPaid),
    depositsUsed,
    affordable,
    savings: Math.max(0, listedCost - actualXPSpent),
  };
}

// Quick check whether a reward is affordable without computing full breakdown
export function canAfford(
  listedCost: number,
  burnBalance: number,
  vaultDeposits: VaultDeposit[],
): boolean {
  return computeEffectiveCost(listedCost, burnBalance, vaultDeposits).affordable;
}
