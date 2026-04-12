import { Card } from '../components/ui/Card';
import { useVault } from '../hooks/useVault';
import { getDepositTier, getTierMultiplier, TIER_COLORS, TIER_LABELS } from '../lib/vault';

export default function VaultScreen() {
  const { vault, vaultTotal } = useVault();

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-6">The Vault</h1>

      {/* Vault Balance */}
      <Card glow className="text-center mb-6 animate-vault-glow">
        <p className="text-[#8888a0] text-sm mb-1">Vault Balance</p>
        <p className="font-mono text-4xl font-bold text-[#f59e0b]">{vaultTotal}</p>
        <p className="text-xs text-[#555570] mt-1">Growing 5% daily</p>
      </Card>

      {/* Burn Balance */}
      <Card className="text-center mb-6">
        <p className="text-[#8888a0] text-sm mb-1">Burn Balance</p>
        <p className="font-mono text-2xl font-bold text-[#f43f5e]">{vault.burnBalance}</p>
        <p className="text-xs text-[#555570] mt-1">Spend anytime</p>
      </Card>

      {/* Tier Guide */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Reward Tiers</h2>
        <div className="space-y-3">
          {(['bronze', 'silver', 'gold', 'diamond'] as const).map((tier) => (
            <div key={tier} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: `${TIER_COLORS[tier]}20`, color: TIER_COLORS[tier] }}
              >
                {tier === 'diamond' ? '💎' : tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🟫'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: TIER_COLORS[tier] }}>{TIER_LABELS[tier]}</p>
                <p className="text-[10px] text-[#555570]">
                  {tier === 'bronze' ? 'Available now' : tier === 'silver' ? '3+ days held' : tier === 'gold' ? '7+ days held' : '30+ days held'}
                  {' · '}×{getTierMultiplier(tier)} value
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Deposits */}
      <Card>
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Deposits ({vault.deposits.length})</h2>
        {vault.deposits.length === 0 ? (
          <p className="text-center text-[#555570] py-4">Bank XP after completing tasks to start growing</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {vault.deposits.slice().reverse().slice(0, 10).map((d) => {
              const tier = getDepositTier(d.daysHeld);
              return (
                <div key={d.id} className="flex items-center justify-between py-1">
                  <div>
                    <span className="font-mono text-sm" style={{ color: TIER_COLORS[tier] }}>
                      {d.currentValue} XP
                    </span>
                    <span className="text-[10px] text-[#555570] ml-2">Day {d.daysHeld}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: TIER_COLORS[tier] }}>
                    {TIER_LABELS[tier]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
