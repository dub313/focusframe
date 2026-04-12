import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PinPad } from '../components/ui/PinPad';
import { useProfile } from '../hooks/useProfile';
import { useStorage } from '../hooks/useStorage';
import { KEYS } from '../lib/keys';
import type { AppSettings, Reward, RewardTier } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  timerWorkMinutes: 25,
  timerBreakMinutes: 5,
  notificationsEnabled: false,
  hapticEnabled: true,
  seasonMode: 'auto',
};

const TIER_INFO: { tier: RewardTier; label: string; color: string; holdDays: string }[] = [
  { tier: 'bronze', label: 'Bronze', color: '#cd7f32', holdDays: 'Available now' },
  { tier: 'silver', label: 'Silver', color: '#c0c0c0', holdDays: '3+ days held' },
  { tier: 'gold', label: 'Gold', color: '#f59e0b', holdDays: '7+ days held' },
  { tier: 'diamond', label: 'Diamond', color: '#22d3ee', holdDays: '30+ days held' },
];

export default function ParentConfig() {
  const { profile } = useProfile();
  const { data: settings, set: setSettings } = useStorage<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  const { data: rewards, set: setRewards } = useStorage<Reward[]>(KEYS.REWARDS, []);

  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [settingPin, setSettingPin] = useState(!settings.parentPIN);
  const [newPinStep, setNewPinStep] = useState<'enter' | 'confirm'>('enter');
  const [newPin, setNewPin] = useState('');

  // Adding reward
  const [addingTier, setAddingTier] = useState<RewardTier | null>(null);
  const [rewardName, setRewardName] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardCost, setRewardCost] = useState('');

  function handlePinSubmit(pin: string) {
    if (settingPin) {
      if (newPinStep === 'enter') {
        setNewPin(pin);
        setNewPinStep('confirm');
      } else {
        if (pin === newPin) {
          setSettings((prev) => ({ ...prev, parentPIN: pin }));
          setAuthenticated(true);
          setSettingPin(false);
        } else {
          setPinError(true);
          setNewPinStep('enter');
          setNewPin('');
          setTimeout(() => setPinError(false), 600);
        }
      }
    } else {
      if (pin === settings.parentPIN) {
        setAuthenticated(true);
      } else {
        setPinError(true);
        setTimeout(() => setPinError(false), 600);
      }
    }
  }

  function addReward() {
    if (!addingTier || !rewardName.trim() || !rewardCost) return;
    const reward: Reward = {
      id: crypto.randomUUID(),
      name: rewardName.trim(),
      description: rewardDesc.trim(),
      tier: addingTier,
      xpCost: parseInt(rewardCost) || 100,
      active: true,
    };
    setRewards((prev) => [...prev, reward]);
    setRewardName('');
    setRewardDesc('');
    setRewardCost('');
    setAddingTier(null);
  }

  function removeReward(id: string) {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  }

  // PIN screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 animate-fade-in">
        <h1 className="text-xl font-bold mb-2">Parent Config</h1>
        <p className="text-sm text-[#8888a0] mb-8">
          {settingPin
            ? (newPinStep === 'enter' ? 'Set a 4-digit PIN' : 'Confirm your PIN')
            : 'Enter PIN'}
        </p>
        <PinPad onSubmit={handlePinSubmit} error={pinError} />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Parent Config</h1>
        <Button variant="ghost" size="sm" onClick={() => setAuthenticated(false)}>Lock</Button>
      </div>

      {/* Kid's Dashboard (view-only) */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Overview</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[#555570]">Streak</span>
            <p className="font-mono font-bold text-[#22d3ee]">{profile.currentStreak} days</p>
          </div>
          <div>
            <span className="text-[#555570]">Total XP</span>
            <p className="font-mono font-bold text-[#f59e0b]">{profile.totalXP}</p>
          </div>
          <div>
            <span className="text-[#555570]">Tasks Done</span>
            <p className="font-mono font-bold">{profile.totalTasksCompleted}</p>
          </div>
          <div>
            <span className="text-[#555570]">Days Active</span>
            <p className="font-mono font-bold">{profile.daysActive}</p>
          </div>
        </div>
      </Card>

      {/* Rewards Management */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Rewards</h2>
        <p className="text-xs text-[#555570] mb-4">
          Define real-world rewards for each Vault tier. He banks XP, waits, and redeems.
        </p>

        {TIER_INFO.map((ti) => {
          const tierRewards = rewards.filter((r) => r.tier === ti.tier);
          return (
            <div key={ti.tier} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: ti.color }}
                />
                <span className="text-sm font-medium" style={{ color: ti.color }}>
                  {ti.label}
                </span>
                <span className="text-[10px] text-[#555570]">({ti.holdDays})</span>
              </div>
              {tierRewards.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1.5 pl-5">
                  <div>
                    <p className="text-sm">{r.name}</p>
                    <p className="text-[10px] text-[#555570]">{r.description} · {r.xpCost} XP</p>
                  </div>
                  <button
                    className="text-[#555570] hover:text-[#f43f5e] text-xs px-2"
                    onClick={() => removeReward(r.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {addingTier === ti.tier ? (
                <div className="pl-5 space-y-2 mt-2 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Reward name"
                    value={rewardName}
                    onChange={(e) => setRewardName(e.target.value)}
                    className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555570]"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={rewardDesc}
                    onChange={(e) => setRewardDesc(e.target.value)}
                    className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555570]"
                  />
                  <input
                    type="number"
                    placeholder="XP cost"
                    value={rewardCost}
                    onChange={(e) => setRewardCost(e.target.value)}
                    className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555570]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addReward}>Add</Button>
                    <Button variant="ghost" size="sm" onClick={() => setAddingTier(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  className="text-xs text-[#22d3ee] pl-5 mt-1"
                  onClick={() => setAddingTier(ti.tier)}
                >
                  + Add reward
                </button>
              )}
            </div>
          );
        })}
      </Card>

      {/* Schedule Overrides */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Season Mode</h2>
        <div className="flex gap-2">
          {(['auto', 'school', 'summer', 'competition'] as const).map((mode) => (
            <button
              key={mode}
              className={`flex-1 py-2 rounded-lg border text-xs transition-all
                ${settings.seasonMode === mode
                  ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]'
                  : 'border-[#2a2a3a] text-[#8888a0]'}`}
              onClick={() => setSettings((prev) => ({ ...prev, seasonMode: mode }))}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[#555570] mt-2">
          Competition mode: lighter cognitive loads, recovery prioritized.
        </p>
      </Card>

      {/* Change PIN */}
      <Card>
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Security</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSettingPin(true);
            setNewPinStep('enter');
            setAuthenticated(false);
          }}
        >
          Change PIN
        </Button>
      </Card>
    </div>
  );
}
