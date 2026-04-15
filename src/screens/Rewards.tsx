import { useEffect, useState, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useVault } from '../hooks/useVault';
import { useFamily } from '../hooks/useFamily';
import {
  onRewards,
  onRedemptions,
  onRewardRequests,
  pushRedemption,
  pushRewardRequest,
} from '../lib/firebase';
import {
  computeEffectiveCost,
  CATEGORY_LABEL,
  CATEGORY_COLOR,
} from '../lib/rewards';
import type { SharedReward, Redemption, RewardRequest, RewardCategory } from '../types';

export default function RewardsScreen() {
  const { vault, vaultTotal, spendBurn, redeemVault } = useVault();
  const { familyCode, connected } = useFamily();

  const [rewards, setRewards] = useState<SharedReward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [requests, setRequests] = useState<RewardRequest[]>([]);

  // Confirmation for redemption
  const [confirmingReward, setConfirmingReward] = useState<SharedReward | null>(null);
  // Request form
  const [showRequest, setShowRequest] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestDesc, setRequestDesc] = useState('');

  // Track redemption IDs we've already applied locally so an approved-twice
  // flip (or a tab that sees the whole backlog on mount) doesn't double-deduct.
  const appliedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!familyCode || !connected) return;
    const unsubs = [
      onRewards(familyCode, (rs) => setRewards(rs.filter((r) => r.active))),
      onRedemptions(familyCode, setRedemptions),
      onRewardRequests(familyCode, setRequests),
    ];
    return () => unsubs.forEach((u) => u());
  }, [familyCode, connected]);

  // When a redemption flips to approved, actually deduct the XP locally.
  // We match by id and only apply each once.
  useEffect(() => {
    for (const r of redemptions) {
      if (r.status === 'approved' && !appliedRef.current.has(r.id)) {
        appliedRef.current.add(r.id);
        if (r.burnPaid > 0) spendBurn(r.burnPaid);
        if (r.vaultPaid > 0) redeemVault(r.vaultPaid);
      }
    }
  }, [redemptions, spendBurn, redeemVault]);

  // === Not connected fallback ===
  if (!connected || !familyCode) {
    return (
      <div className="px-5 pt-6 pb-4 animate-slide-up">
        <h1 className="text-xl font-bold mb-4">Rewards</h1>
        <Card>
          <p className="text-sm text-[#555570]">
            Link to your family from Settings to unlock the rewards catalog.
          </p>
        </Card>
      </div>
    );
  }

  const grouped: Record<RewardCategory, SharedReward[]> = {
    minor: rewards.filter((r) => r.category === 'minor'),
    medium: rewards.filter((r) => r.category === 'medium'),
    major: rewards.filter((r) => r.category === 'major'),
  };

  function handleStartRedeem(reward: SharedReward) {
    setConfirmingReward(reward);
  }

  async function confirmRedeem() {
    if (!confirmingReward || !familyCode) return;
    const breakdown = computeEffectiveCost(confirmingReward.xpCost, vault.burnBalance, vault.deposits);
    if (!breakdown.affordable) return;

    const redemption: Redemption = {
      id: crypto.randomUUID(),
      rewardId: confirmingReward.id,
      rewardName: confirmingReward.name,
      xpCost: confirmingReward.xpCost,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      burnPaid: breakdown.burnPaid,
      vaultPaid: breakdown.vaultPaid,
    };
    await pushRedemption(familyCode, redemption);
    setConfirmingReward(null);
  }

  async function submitRequest() {
    if (!requestName.trim() || !familyCode) return;
    const request: RewardRequest = {
      id: crypto.randomUUID(),
      name: requestName.trim(),
      description: requestDesc.trim() || undefined,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    await pushRewardRequest(familyCode, request);
    setRequestName('');
    setRequestDesc('');
    setShowRequest(false);
  }

  const myPendingRedemptions = redemptions.filter((r) => r.status === 'pending');
  const myHistoricRedemptions = redemptions.filter((r) => r.status !== 'pending');
  const myPendingRequests = requests.filter((r) => r.status === 'pending');
  const myDeclinedRequests = requests.filter((r) => r.status === 'declined');

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-2">Rewards</h1>

      {/* Wallet header */}
      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[#555570]">Vault</span>
            <p className="font-mono font-bold text-[#22d3ee]">{vaultTotal} XP</p>
          </div>
          <div>
            <span className="text-[#555570]">Burn</span>
            <p className="font-mono font-bold text-[#f97316]">{vault.burnBalance} XP</p>
          </div>
        </div>
        <p className="text-[10px] text-[#555570] mt-2">
          Vault deposits unlock discounts: diamond ×5, gold ×2.5, silver ×1.5. Bank longer = buy more.
        </p>
      </Card>

      {/* Reward catalog */}
      {(['minor', 'medium', 'major'] as RewardCategory[]).map((cat) => {
        const list = grouped[cat];
        if (list.length === 0) return null;
        return (
          <div key={cat} className="mb-5">
            <h2 className="text-sm font-semibold mb-2" style={{ color: CATEGORY_COLOR[cat] }}>
              {CATEGORY_LABEL[cat]}
            </h2>
            <div className="space-y-2">
              {list.map((r) => {
                const breakdown = computeEffectiveCost(r.xpCost, vault.burnBalance, vault.deposits);
                const affordable = breakdown.affordable;
                const progressPct = Math.min(100, Math.round(((vaultTotal + vault.burnBalance) / r.xpCost) * 100));
                return (
                  <Card key={r.id} className={`${!affordable ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{r.name}</p>
                        {r.description && <p className="text-xs text-[#8888a0]">{r.description}</p>}
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-mono text-sm text-[#f59e0b]">{r.xpCost} XP</p>
                        {breakdown.savings > 0 && (
                          <p className="text-[10px] text-[#10b981]">pays {breakdown.actualXPSpent}</p>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-[#1a1a24] rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${progressPct}%`,
                          background: affordable ? CATEGORY_COLOR[cat] : '#555570',
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!affordable}
                      onClick={() => handleStartRedeem(r)}
                    >
                      {affordable ? 'Redeem' : `Need ${r.xpCost - (vaultTotal + vault.burnBalance)} more XP`}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {rewards.length === 0 && (
        <Card className="mb-4 text-center">
          <p className="text-sm text-[#555570]">
            No rewards in the catalog yet. Ask your parent to set them up in their portal.
          </p>
        </Card>
      )}

      {/* Request a custom reward */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#8888a0]">Want something else?</h2>
            <p className="text-[10px] text-[#555570]">Propose a custom reward to Dad.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowRequest(true)}>Request</Button>
        </div>
      </Card>

      {/* My pending redemptions */}
      {myPendingRedemptions.length > 0 && (
        <Card className="mb-4">
          <h2 className="text-sm font-semibold text-[#8888a0] mb-2">Waiting for approval</h2>
          {myPendingRedemptions.map((r) => (
            <div key={r.id} className="text-xs py-1">
              <span className="text-white">{r.rewardName}</span>
              <span className="text-[#555570]"> · {new Date(r.requestedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Historic redemptions */}
      {myHistoricRedemptions.length > 0 && (
        <Card className="mb-4">
          <h2 className="text-sm font-semibold text-[#8888a0] mb-2">Recent redemptions</h2>
          {myHistoricRedemptions.slice(0, 10).map((r) => (
            <div key={r.id} className="text-xs py-1 flex items-center gap-2">
              <Badge color={r.status === 'approved' ? '#10b981' : '#f43f5e'}>{r.status}</Badge>
              <span className="text-white">{r.rewardName}</span>
              {r.denyReason && <span className="text-[#555570] italic"> · {r.denyReason}</span>}
            </div>
          ))}
        </Card>
      )}

      {/* My requests */}
      {(myPendingRequests.length > 0 || myDeclinedRequests.length > 0) && (
        <Card className="mb-4">
          <h2 className="text-sm font-semibold text-[#8888a0] mb-2">My requests</h2>
          {myPendingRequests.map((r) => (
            <div key={r.id} className="text-xs py-1">
              <Badge color="#f59e0b">pending</Badge> <span className="text-white ml-1">{r.name}</span>
            </div>
          ))}
          {myDeclinedRequests.slice(0, 5).map((r) => (
            <div key={r.id} className="text-xs py-1">
              <Badge color="#f43f5e">declined</Badge>
              <span className="text-white ml-1">{r.name}</span>
              {r.declineReason && <p className="text-[#555570] italic ml-1 mt-0.5">"{r.declineReason}"</p>}
            </div>
          ))}
        </Card>
      )}

      {/* === Confirm redemption modal === */}
      {confirmingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <Card className="mx-6 max-w-sm animate-bounce-in">
            <h2 className="text-lg font-bold mb-2">Redeem "{confirmingReward.name}"?</h2>
            {(() => {
              const b = computeEffectiveCost(confirmingReward.xpCost, vault.burnBalance, vault.deposits);
              return (
                <>
                  <p className="text-sm text-[#8888a0] mb-1">Listed: {confirmingReward.xpCost} XP</p>
                  <p className="text-sm text-[#10b981] mb-1">You pay: {b.actualXPSpent} XP</p>
                  {b.burnPaid > 0 && <p className="text-[10px] text-[#f97316]">· {b.burnPaid} from burn</p>}
                  {b.vaultPaid > 0 && <p className="text-[10px] text-[#22d3ee]">· {b.vaultPaid} from vault (discount applied)</p>}
                  {b.savings > 0 && <p className="text-[10px] text-[#10b981]">Saved {b.savings} XP via tier discount</p>}
                </>
              );
            })()}
            <p className="text-xs text-[#555570] mt-3">
              Dad has to approve this before XP gets deducted. You'll see it in "Waiting for approval".
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmingReward(null)}>Cancel</Button>
              <Button className="flex-1" onClick={confirmRedeem}>Send to Dad</Button>
            </div>
          </Card>
        </div>
      )}

      {/* === Request modal === */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md mx-4 mb-4 bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 animate-slide-up">
            <h2 className="text-lg font-bold mb-4">Request a reward</h2>
            <input
              type="text"
              placeholder="What do you want?"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              autoFocus
              className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
                placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none mb-3"
            />
            <input
              type="text"
              placeholder="Why / details (optional)"
              value={requestDesc}
              onChange={(e) => setRequestDesc(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
                placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none mb-4 text-sm"
            />
            <p className="text-[10px] text-[#555570] mb-3">
              Dad sees this and decides. If he accepts, he sets the XP cost and it appears here.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowRequest(false); setRequestName(''); setRequestDesc(''); }}>Cancel</Button>
              <Button className="flex-1" disabled={!requestName.trim()} onClick={submitRequest}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
