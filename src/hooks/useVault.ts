import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { KEYS } from '../lib/keys';
import { createDeposit, createDefaultVault, getVaultTotal } from '../lib/vault';
import type { VaultState } from '../types';

const DEFAULT_VAULT = createDefaultVault();

export function useVault() {
  const { data: vault, loading, set, refresh } = useStorage<VaultState>(KEYS.VAULT, DEFAULT_VAULT);

  const bankXP = useCallback((amount: number) => {
    set((prev) => ({
      ...prev,
      deposits: [...prev.deposits, createDeposit(amount)],
      totalDeposited: prev.totalDeposited + amount,
    }));
  }, [set]);

  const burnXP = useCallback((amount: number) => {
    set((prev) => ({
      ...prev,
      burnBalance: prev.burnBalance + amount,
    }));
  }, [set]);

  const spendBurn = useCallback((amount: number) => {
    set((prev) => ({
      ...prev,
      burnBalance: Math.max(0, prev.burnBalance - amount),
    }));
  }, [set]);

  const redeemVault = useCallback((amount: number) => {
    // Withdraw from oldest deposits first
    set((prev) => {
      let remaining = amount;
      const newDeposits = [];
      for (const d of prev.deposits) {
        if (remaining <= 0) {
          newDeposits.push(d);
          continue;
        }
        if (d.currentValue <= remaining) {
          remaining -= d.currentValue;
        } else {
          newDeposits.push({ ...d, currentValue: d.currentValue - remaining });
          remaining = 0;
        }
      }
      return { ...prev, deposits: newDeposits };
    });
  }, [set]);

  const vaultTotal = getVaultTotal(vault.deposits);

  return { vault, vaultTotal, loading, set, refresh, bankXP, burnXP, spendBurn, redeemVault };
}
