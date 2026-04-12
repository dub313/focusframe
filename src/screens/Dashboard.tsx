import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BatteryGauge } from '../components/battery/BatteryGauge';
import { XPBurst } from '../components/animations/XPBurst';
import { TaskComplete } from '../components/animations/TaskComplete';
import { ConfettiRain } from '../components/animations/ConfettiRain';
import { BankBurnChoice } from '../components/vault/BankBurnChoice';
import { useDailyState } from '../hooks/useDailyState';
import { useProfile } from '../hooks/useProfile';
import { useVault } from '../hooks/useVault';
import { getStreakMultiplier } from '../lib/streaks';
import { getEnergyCost } from '../lib/battery';
import { calculateXP, getBaseXP, RECOVERY_XP } from '../lib/xp';
import { getRecoveryBars, MAX_RECOVERY_PER_DAY, type RecoveryAction } from '../lib/battery';
import type { Task, TaskType } from '../types';

const TASK_ICONS: Record<TaskType, string> = {
  quick_win: '⚡',
  standard: '📋',
  multi_level: '🧱',
  multi_day: '📅',
  continuous: '🔄',
};

const TASK_COLORS: Record<TaskType, string> = {
  quick_win: '#22d3ee',
  standard: '#a78bfa',
  multi_level: '#f97316',
  multi_day: '#3b82f6',
  continuous: '#10b981',
};

const RECOVERY_ACTIONS: { action: RecoveryAction; emoji: string; label: string; detail: string }[] = [
  { action: 'exercise', emoji: '🏃', label: 'Exercise', detail: '20+ min: +2 bars' },
  { action: 'breathing', emoji: '🧘', label: 'Breathe', detail: '+1 bar' },
  { action: 'rest', emoji: '😴', label: 'Rest', detail: '20+ min: +1 bar' },
  { action: 'fun', emoji: '🎮', label: 'Fun', detail: '30+ min: +1 bar' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { state, setState, useBattery, addXP: addDailyXP, addRecovery, activateSurge, incrementSurge, setTopThreeComplete } = useDailyState();
  const { profile, addXP: addProfileXP, incrementTasksCompleted } = useProfile();
  const { bankXP, burnXP } = useVault();

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [xpBurst, setXpBurst] = useState<{ amount: number; id: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSurgePrompt, setShowSurgePrompt] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [bankBurnXP, setBankBurnXP] = useState<number | null>(null);

  const topThree = state.tasks.filter((t) => t.isTopThree && !t.completed);
  const otherTasks = state.tasks.filter((t) => !t.isTopThree && !t.completed);
  const completedTasks = state.tasks.filter((t) => t.completed);
  const batteryRemaining = Math.max(0, state.batteryMax - state.batteryUsed);
  const isBurnout = batteryRemaining === 0;

  const completeTask = useCallback((task: Task) => {
    const cost = getEnergyCost(task.type);
    const surgeIndex = state.surgeActive ? state.surgeTaskCount + 1 : 0;
    const xp = calculateXP(getBaseXP(task.type), profile.currentStreak, surgeIndex);

    setCompletingTaskId(task.id);
    setTimeout(() => {
      setCompletingTaskId(null);
      setXpBurst({ amount: xp, id: crypto.randomUUID() });
      setBankBurnXP(xp);

      // Update task
      const updatedTasks = state.tasks.map((t) =>
        t.id === task.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      );
      setState((prev) => ({ ...prev, tasks: updatedTasks }));

      useBattery(cost);
      addDailyXP(xp);
      addProfileXP(xp);
      incrementTasksCompleted();

      if (state.surgeActive) {
        incrementSurge();
      }

      // Check top 3 completion
      const topThreeAfter = updatedTasks.filter((t) => t.isTopThree);
      const allTopDone = topThreeAfter.length > 0 && topThreeAfter.every((t) => t.completed);
      if (allTopDone && !state.topThreeComplete) {
        setTopThreeComplete();
        setShowConfetti(true);
        setTimeout(() => setShowSurgePrompt(true), 1500);
      }
    }, 500);
  }, [state, profile, setState, useBattery, addDailyXP, addProfileXP, incrementTasksCompleted, incrementSurge, setTopThreeComplete]);

  const handleRecovery = useCallback((action: RecoveryAction) => {
    if (state.recoveryUsed >= MAX_RECOVERY_PER_DAY) return;
    const bars = getRecoveryBars(action);
    const xp = RECOVERY_XP[action];
    addRecovery(bars);
    addDailyXP(xp);
    addProfileXP(xp);
    setXpBurst({ amount: xp, id: crypto.randomUUID() });
  }, [state.recoveryUsed, addRecovery, addDailyXP, addProfileXP]);

  const streakMult = getStreakMultiplier(profile.currentStreak);

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      {/* Animations */}
      {showConfetti && <ConfettiRain onDone={() => setShowConfetti(false)} />}
      {xpBurst && <XPBurst key={xpBurst.id} amount={xpBurst.amount} />}
      <BankBurnChoice
        open={bankBurnXP !== null}
        amount={bankBurnXP ?? 0}
        onBank={() => { bankXP(bankBurnXP!); setBankBurnXP(null); }}
        onBurn={() => { burnXP(bankBurnXP!); setBankBurnXP(null); }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">
            {profile.currentStreak > 0 ? `Day ${profile.currentStreak}` : new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </h1>
          {profile.currentStreak >= 3 && (
            <Badge color="#f59e0b">
              <span className="animate-fire">🔥</span> ×{streakMult}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <BatteryGauge max={state.batteryMax} used={state.batteryUsed} />
          <div className="text-right">
            <p className="font-mono text-lg font-bold text-[#f59e0b]">{profile.totalXP}</p>
            <p className="text-[10px] text-[#8888a0]">XP</p>
          </div>
        </div>
      </div>

      {/* Surge Mode Active */}
      {state.surgeActive && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-[#f97316]/20 to-[#f43f5e]/20 border border-[#f97316]/30">
          <p className="text-sm font-semibold text-[#f97316]">
            ⚡ SURGE MODE — Task {state.surgeTaskCount + 4} next
          </p>
          {state.surgeTaskCount >= 7 && (
            <p className="text-xs text-[#8888a0] mt-1">
              Massive day. Your brain earned rest too. 💪
            </p>
          )}
        </div>
      )}

      {/* Burnout Warning */}
      {isBurnout && (
        <Card className="mb-4 border-[#f43f5e]/30 bg-[#f43f5e]/5">
          <p className="text-sm text-[#f43f5e] font-medium">
            Empty battery. Quick wins and recharge only. This is the system working.
          </p>
        </Card>
      )}

      {/* Surge Prompt Modal */}
      {showSurgePrompt && !state.surgeActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <Card className="mx-6 text-center space-y-4 animate-bounce-in">
            <p className="text-4xl">🎉</p>
            <h2 className="text-xl font-bold">Top 3 Done!</h2>
            <p className="text-[#8888a0]">Massive. Go Surge?</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowSurgePrompt(false)}>
                I'm Good
              </Button>
              <Button className="flex-1 bg-[#f97316] hover:bg-[#ea580c]" onClick={() => {
                activateSurge();
                setShowSurgePrompt(false);
              }}>
                ⚡ Surge
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Top 3 Tasks */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3 uppercase tracking-wider">
          {state.topThreeComplete ? 'Completed' : 'Top 3'}
        </h2>
        {topThree.length === 0 && !state.topThreeComplete && (
          <Card className="text-center py-8">
            <p className="text-[#555570] mb-3">No tasks yet</p>
            <Button size="sm" onClick={() => navigate('/add-task')}>Add Task</Button>
          </Card>
        )}
        <div className="space-y-2">
          {topThree.map((task) => (
            <div key={task.id} className="relative">
              {completingTaskId === task.id && <TaskComplete />}
              <Card
                className={`flex items-center gap-3 cursor-pointer transition-all
                  ${completingTaskId === task.id ? 'opacity-50 scale-95' : 'active:scale-[0.98]'}`}
                onClick={() => !isBurnout || task.type === 'quick_win' ? completeTask(task) : null}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${TASK_COLORS[task.type]}20` }}
                >
                  {TASK_ICONS[task.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.name}</p>
                  <p className="text-xs text-[#555570]">
                    {getEnergyCost(task.type)} bar · {getBaseXP(task.type)} XP
                  </p>
                </div>
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: TASK_COLORS[task.type] }}
                />
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#8888a0] mb-3 uppercase tracking-wider">
            Done ({completedTasks.length})
          </h2>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <Card key={task.id} className="flex items-center gap-3 opacity-60">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${TASK_COLORS[task.type]}10` }}
                >
                  {TASK_ICONS[task.type]}
                </div>
                <p className="flex-1 font-medium line-through text-[#555570]">{task.name}</p>
                <span className="text-[#10b981]">✓</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Tasks (non-top-3) */}
      {otherTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#8888a0] mb-3 uppercase tracking-wider">Other</h2>
          <div className="space-y-2">
            {otherTasks.map((task) => (
              <Card
                key={task.id}
                className="flex items-center gap-3 cursor-pointer active:scale-[0.98]"
                onClick={() => completeTask(task)}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${TASK_COLORS[task.type]}20` }}
                >
                  {TASK_ICONS[task.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.name}</p>
                  <p className="text-xs text-[#555570]">
                    {getEnergyCost(task.type)} bar · {getBaseXP(task.type)} XP
                  </p>
                </div>
                <div
                  className="w-6 h-6 rounded-full border-2"
                  style={{ borderColor: TASK_COLORS[task.type] }}
                />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Actions */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-[#8888a0] mb-3 uppercase tracking-wider"
          onClick={() => setShowRecovery(!showRecovery)}
        >
          Recharge {showRecovery ? '▾' : '▸'}
          <span className="text-xs font-normal normal-case">({MAX_RECOVERY_PER_DAY - state.recoveryUsed} left)</span>
        </button>
        {showRecovery && (
          <div className="grid grid-cols-2 gap-2 animate-slide-up">
            {RECOVERY_ACTIONS.map((r) => (
              <Card
                key={r.action}
                className={`text-center py-3 cursor-pointer transition-all
                  ${state.recoveryUsed >= MAX_RECOVERY_PER_DAY ? 'opacity-40 pointer-events-none' : 'active:scale-[0.97]'}`}
                onClick={() => handleRecovery(r.action)}
              >
                <span className="text-2xl">{r.emoji}</span>
                <p className="text-xs font-medium mt-1">{r.label}</p>
                <p className="text-[10px] text-[#555570]">{r.detail}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Today's Stats */}
      <Card className="mb-4">
        <div className="flex justify-around text-center">
          <div>
            <p className="font-mono text-lg font-bold text-[#f59e0b]">{state.xpEarnedToday}</p>
            <p className="text-[10px] text-[#8888a0]">Today's XP</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-[#10b981]">{completedTasks.length}</p>
            <p className="text-[10px] text-[#8888a0]">Done</p>
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-[#22d3ee]">{profile.currentStreak}</p>
            <p className="text-[10px] text-[#8888a0]">Streak</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
