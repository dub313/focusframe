import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PinPad } from '../components/ui/PinPad';
import { BatteryGauge } from '../components/battery/BatteryGauge';
import { useStorage } from '../hooks/useStorage';
import { KEYS } from '../lib/keys';
import {
  createFamily,
  familyExists,
  pushParentTask,
  updateParentTask,
  removeParentTask,
  onParentTasks,
  onChildProgress,
  pushReward,
  updateReward,
  removeReward,
  onRewards,
  onRedemptions,
  approveRedemption,
  denyRedemption,
  onRewardRequests,
  acceptRewardRequest,
  declineRewardRequest,
} from '../lib/firebase';
import { REWARD_PRESETS, CATEGORY_LABEL, CATEGORY_COLOR, CATEGORY_XP_RANGE } from '../lib/rewards';
import type {
  AppSettings,
  ParentTask,
  ChildProgress,
  SharedReward,
  Redemption,
  RewardRequest,
  RewardCategory,
} from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  timerWorkMinutes: 25,
  timerBreakMinutes: 5,
  notificationsEnabled: false,
  hapticEnabled: true,
  seasonMode: 'auto',
};

type TaskType = 'quick_win' | 'standard' | 'multi_level';
type Tab = 'status' | 'tasks' | 'rewards' | 'requests';

export default function ParentPortal() {
  const { data: settings, set: setSettings } = useStorage<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);

  // Auth
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);
  const hasPIN = !!settings.parentPIN;

  // Family code
  const [familyCode, setFamilyCode] = useState('');
  const [connected, setConnected] = useState(false);
  const [savedCode, setSavedCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isNewFamily, setIsNewFamily] = useState(false);

  // Data
  const [tasks, setTasks] = useState<ParentTask[]>([]);
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [rewards, setRewards] = useState<SharedReward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [requests, setRequests] = useState<RewardRequest[]>([]);

  // UI
  const [tab, setTab] = useState<Tab>('status');

  // Add/edit task form
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('standard');
  const [taskSteps, setTaskSteps] = useState<string[]>(['']);
  const [taskUrgent, setTaskUrgent] = useState(false);
  const [taskMessage, setTaskMessage] = useState('');

  // Reward form
  const [showAddReward, setShowAddReward] = useState<RewardCategory | null>(null);
  const [rewardName, setRewardName] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardCost, setRewardCost] = useState('');

  // Deny/decline reason inputs
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Accept request form
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptCost, setAcceptCost] = useState('');
  const [acceptCategory, setAcceptCategory] = useState<RewardCategory>('medium');

  // Load saved family code
  useEffect(() => {
    const stored = localStorage.getItem('focusframe:familyCode');
    if (stored) {
      setSavedCode(stored);
      setFamilyCode(stored);
    }
  }, []);

  // Subscribe to all family data when connected
  useEffect(() => {
    if (!connected || !savedCode) return;
    const unsubs = [
      onParentTasks(savedCode, setTasks),
      onChildProgress(savedCode, setProgress),
      onRewards(savedCode, setRewards),
      onRedemptions(savedCode, setRedemptions),
      onRewardRequests(savedCode, setRequests),
    ];
    return () => unsubs.forEach((u) => u());
  }, [connected, savedCode]);

  function handlePinSubmit(pin: string) {
    if (!hasPIN) {
      setSettings((prev) => ({ ...prev, parentPIN: pin }));
      setAuthenticated(true);
    } else if (pin === settings.parentPIN) {
      setAuthenticated(true);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 600);
    }
  }

  async function handleConnect() {
    const code = familyCode.toUpperCase().trim();
    if (!code) return;
    try {
      const exists = await familyExists(code);
      if (exists) {
        setSavedCode(code);
        localStorage.setItem('focusframe:familyCode', code);
        setConnected(true);
      } else {
        setIsNewFamily(true);
      }
    } catch {
      setCodeError('Connection failed. Check your internet.');
    }
  }

  async function handleCreateFamily() {
    const code = familyCode.toUpperCase().trim();
    try {
      await createFamily(code, 'Parent');
      setSavedCode(code);
      localStorage.setItem('focusframe:familyCode', code);
      setConnected(true);
      setIsNewFamily(false);
    } catch {
      setCodeError('Failed to create family. Try again.');
    }
  }

  // Reset task form helper
  function resetTaskForm() {
    setTaskName('');
    setTaskType('standard');
    setTaskSteps(['']);
    setTaskUrgent(false);
    setTaskMessage('');
    setEditingTaskId(null);
    setShowAddTask(false);
  }

  async function handleSaveTask() {
    if (!taskName.trim()) return;

    if (editingTaskId) {
      await updateParentTask(savedCode, editingTaskId, {
        name: taskName.trim(),
        type: taskType,
        steps: taskType === 'multi_level' ? taskSteps.filter((s) => s.trim()) : undefined,
        urgent: taskUrgent || undefined,
        completionMessage: taskMessage.trim() || undefined,
      });
    } else {
      const task: ParentTask = {
        id: crypto.randomUUID(),
        name: taskName.trim(),
        type: taskType,
        assignedAt: new Date().toISOString(),
        completed: false,
        steps: taskType === 'multi_level' ? taskSteps.filter((s) => s.trim()) : undefined,
        urgent: taskUrgent || undefined,
        completionMessage: taskMessage.trim() || undefined,
      };
      await pushParentTask(savedCode, task);
    }
    resetTaskForm();
  }

  function startEditTask(t: ParentTask) {
    setEditingTaskId(t.id);
    setTaskName(t.name);
    setTaskType(t.type);
    setTaskSteps(t.steps ?? ['']);
    setTaskUrgent(!!t.urgent);
    setTaskMessage(t.completionMessage ?? '');
    setShowAddTask(true);
  }

  async function handleRemoveTask(taskId: string) {
    await removeParentTask(savedCode, taskId);
  }

  // Reward CRUD
  async function handleAddReward() {
    if (!rewardName.trim() || !rewardCost || !showAddReward) return;
    const reward: SharedReward = {
      id: crypto.randomUUID(),
      name: rewardName.trim(),
      description: rewardDesc.trim() || undefined,
      category: showAddReward,
      xpCost: parseInt(rewardCost) || 100,
      active: true,
      createdAt: new Date().toISOString(),
    };
    await pushReward(savedCode, reward);
    setRewardName('');
    setRewardDesc('');
    setRewardCost('');
    setShowAddReward(null);
  }

  async function seedPresets() {
    for (const p of REWARD_PRESETS) {
      const reward: SharedReward = {
        ...p,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      await pushReward(savedCode, reward);
    }
  }

  async function toggleReward(r: SharedReward) {
    await updateReward(savedCode, r.id, { active: !r.active });
  }

  // Redemption approval
  async function handleApprove(id: string) {
    await approveRedemption(savedCode, id);
  }

  async function handleDeny(id: string) {
    if (!denyReason.trim()) return;
    await denyRedemption(savedCode, id, denyReason.trim());
    setDenyingId(null);
    setDenyReason('');
  }

  // Reward request handling
  async function handleAcceptRequest(id: string) {
    const cost = parseInt(acceptCost);
    if (!cost || cost <= 0) return;
    await acceptRewardRequest(savedCode, id, cost, acceptCategory);
    // Also create the reward in the catalog
    const req = requests.find((r) => r.id === id);
    if (req) {
      const reward: SharedReward = {
        id: crypto.randomUUID(),
        name: req.name,
        description: req.description,
        category: acceptCategory,
        xpCost: cost,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await pushReward(savedCode, reward);
    }
    setAcceptingId(null);
    setAcceptCost('');
    setAcceptCategory('medium');
  }

  async function handleDeclineRequest(id: string) {
    if (!declineReason.trim()) return;
    await declineRewardRequest(savedCode, id, declineReason.trim());
    setDecliningId(null);
    setDeclineReason('');
  }

  // === PIN screen ===
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 animate-fade-in">
        <h1 className="text-xl font-bold mb-2">Parent Portal</h1>
        <p className="text-sm text-[#8888a0] mb-8">
          {hasPIN ? 'Enter your PIN' : 'Set a 4-digit PIN'}
        </p>
        <PinPad onSubmit={handlePinSubmit} error={pinError} />
      </div>
    );
  }

  // === Family code screen ===
  if (!connected) {
    return (
      <div className="px-5 pt-6 pb-4 animate-slide-up">
        <h1 className="text-xl font-bold mb-2">Parent Portal</h1>
        <p className="text-sm text-[#8888a0] mb-6">
          Connect to your child's app with a family code.
        </p>
        <Card className="mb-4">
          <p className="text-sm text-[#8888a0] mb-3">
            Enter a code you'll both use. Pick something you'll remember.
          </p>
          <input
            type="text"
            placeholder="e.g. MASON-2026"
            value={familyCode}
            onChange={(e) => { setFamilyCode(e.target.value.toUpperCase()); setCodeError(''); setIsNewFamily(false); }}
            className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-lg text-center text-white font-mono
              placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none uppercase tracking-widest"
          />
          {codeError && <p className="text-xs text-[#f43f5e] mt-2">{codeError}</p>}
          {isNewFamily && (
            <div className="mt-4 p-3 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 animate-fade-in">
              <p className="text-sm text-[#f59e0b] font-medium">New family code</p>
              <p className="text-xs text-[#8888a0] mt-1">
                "{familyCode.toUpperCase().trim()}" doesn't exist yet. Create it?
              </p>
              <Button size="sm" className="mt-2" onClick={handleCreateFamily}>Create Family</Button>
            </div>
          )}
          {!isNewFamily && (
            <Button size="lg" className="w-full mt-4" disabled={!familyCode.trim()} onClick={handleConnect}>
              Connect
            </Button>
          )}
        </Card>
        <p className="text-xs text-[#555570] text-center">
          Your child enters the same code in their app's Settings to link up.
        </p>
      </div>
    );
  }

  // === Connected — main portal ===
  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending');
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Parent Portal</h1>
          <Badge color="#10b981">{savedCode}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAuthenticated(false)}>Lock</Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-[#111118] border border-[#2a2a3a] rounded-xl p-1">
        {(['status', 'tasks', 'rewards', 'requests'] as Tab[]).map((t) => {
          const count =
            t === 'rewards' ? pendingRedemptions.length :
            t === 'requests' ? pendingRequests.length :
            0;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all relative
                ${tab === t ? 'bg-[#22d3ee]/10 text-[#22d3ee]' : 'text-[#8888a0]'}`}
            >
              {t}
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#f43f5e] text-white text-[9px] font-mono rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* === STATUS TAB === */}
      {tab === 'status' && (
        <div className="animate-fade-in">
          {progress ? (
            <>
              <Card className="mb-4">
                <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Right now</h2>
                {/* Boot status */}
                <div className="mb-3">
                  {progress.bootedAt ? (
                    <p className="text-xs text-[#10b981]">
                      ✓ Booted at {new Date(progress.bootedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  ) : (
                    <p className="text-xs text-[#f59e0b]">⚠ Not booted today yet</p>
                  )}
                </div>
                {/* Battery + sleep */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#8888a0] text-sm">Battery</span>
                  <BatteryGauge max={progress.batteryMax} used={progress.batteryUsed} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#555570]">Sleep last night</span>
                    <p className="font-mono font-bold">
                      {progress.sleepHours != null ? `${progress.sleepHours} hrs` : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#555570]">Energy</span>
                    <p className="font-mono font-bold">{progress.todayEnergy}/5</p>
                  </div>
                  <div>
                    <span className="text-[#555570]">Training</span>
                    <p className="font-mono font-bold capitalize">{progress.todayTraining}</p>
                  </div>
                  <div>
                    <span className="text-[#555570]">Recovery used</span>
                    <p className="font-mono font-bold">{progress.recoveryUsed}/3</p>
                  </div>
                </div>
              </Card>

              <Card className="mb-4">
                <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Today</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#555570]">Top 3</span>
                    <p className="font-mono font-bold text-[#22d3ee]">
                      {progress.topThreeDone}/{progress.topThreeTotal || 3}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#555570]">All tasks</span>
                    <p className="font-mono font-bold">{progress.todayTasksDone}/{progress.todayTasksTotal}</p>
                  </div>
                  <div>
                    <span className="text-[#555570]">XP today</span>
                    <p className="font-mono font-bold text-[#f59e0b]">{progress.todayXP}</p>
                  </div>
                  <div>
                    <span className="text-[#555570]">Streak</span>
                    <p className="font-mono font-bold text-[#22d3ee]">{progress.currentStreak} days</p>
                  </div>
                </div>
                {progress.surgeActive && (
                  <div className="mt-3">
                    <Badge color="#f97316">⚡ Surge Mode Active</Badge>
                  </div>
                )}
                {progress.batteryMax - progress.batteryUsed === 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-[#f43f5e]/10 border border-[#f43f5e]/30">
                    <p className="text-xs text-[#f43f5e]">⚠ Battery empty — quick wins only.</p>
                  </div>
                )}
              </Card>

              <Card className="mb-4">
                <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Wallet</h2>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-[#555570]">Total XP</span>
                    <p className="font-mono font-bold text-[#f59e0b]">{progress.totalXP}</p>
                  </div>
                  <div>
                    <span className="text-[#555570]">Vault</span>
                    <p className="font-mono font-bold text-[#22d3ee]">{progress.vaultBalance}</p>
                  </div>
                  <div>
                    <span className="text-[#555570]">Burn</span>
                    <p className="font-mono font-bold text-[#f97316]">{progress.burnBalance}</p>
                  </div>
                </div>
              </Card>

              <p className="text-[10px] text-[#555570] text-center">
                Updated {new Date(progress.lastUpdated).toLocaleTimeString()}
              </p>
            </>
          ) : (
            <Card>
              <p className="text-sm text-[#555570] text-center">
                No data yet. Your child needs to link the family code in their Settings and boot their day.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* === TASKS TAB === */}
      {tab === 'tasks' && (
        <div className="animate-fade-in">
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#8888a0]">Assigned Tasks</h2>
              <Button size="sm" onClick={() => { resetTaskForm(); setShowAddTask(true); }}>+ Assign</Button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-[#555570] text-center py-4">
                No tasks assigned. Tap + Assign to send tasks to your child's app.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 py-2 border-b border-[#1a1a24] last:border-0">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5
                      ${task.completed ? 'bg-[#10b981] border-[#10b981]' : 'border-[#2a2a3a]'}`}>
                      {task.completed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm ${task.completed ? 'line-through text-[#555570]' : ''}`}>{task.name}</p>
                        {task.urgent && <Badge color="#f43f5e">urgent</Badge>}
                        {task.completionMessage && <span className="text-[10px] text-[#f59e0b]">💬</span>}
                      </div>
                      <p className="text-[10px] text-[#555570]">
                        {task.type.replace('_', ' ')}
                        {task.completed && task.completedAt && ` · done ${new Date(task.completedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!task.completed && (
                        <button
                          className="text-[10px] text-[#22d3ee] hover:underline px-1"
                          onClick={() => startEditTask(task)}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        className="text-[10px] text-[#555570] hover:text-[#f43f5e] px-1"
                        onClick={() => handleRemoveTask(task.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* === REWARDS TAB === */}
      {tab === 'rewards' && (
        <div className="animate-fade-in">
          {/* Pending redemptions queue */}
          {pendingRedemptions.length > 0 && (
            <Card className="mb-4 border-[#f59e0b]/40">
              <h2 className="text-sm font-semibold text-[#f59e0b] mb-3">
                Pending redemptions ({pendingRedemptions.length})
              </h2>
              <div className="space-y-3">
                {pendingRedemptions.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-[#1a1a24]">
                    <p className="text-sm font-medium">{r.rewardName}</p>
                    <p className="text-[10px] text-[#555570]">
                      {r.xpCost} XP listed · pays {r.burnPaid + r.vaultPaid} actual
                      {r.vaultPaid > 0 && ` (${r.vaultPaid} from vault)`}
                    </p>
                    <p className="text-[10px] text-[#555570] mb-2">
                      Requested {new Date(r.requestedAt).toLocaleString()}
                    </p>
                    {denyingId === r.id ? (
                      <div className="flex gap-2 animate-fade-in">
                        <input
                          type="text"
                          placeholder="Reason..."
                          value={denyReason}
                          onChange={(e) => setDenyReason(e.target.value)}
                          autoFocus
                          className="flex-1 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-2 py-1 text-xs text-white placeholder:text-[#555570]"
                        />
                        <Button size="sm" onClick={() => handleDeny(r.id)}>Send</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setDenyingId(null); setDenyReason(''); }}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(r.id)}>Approve</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDenyingId(r.id)}>Deny</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* First-run presets */}
          {rewards.length === 0 && (
            <Card className="mb-4 text-center">
              <p className="text-sm text-[#8888a0] mb-3">No rewards yet.</p>
              <Button size="sm" onClick={seedPresets}>Load preset rewards</Button>
              <p className="text-[10px] text-[#555570] mt-2">
                Loads Minor / Medium / Major defaults. You can edit them after.
              </p>
            </Card>
          )}

          {/* Reward catalog by category */}
          {(['minor', 'medium', 'major'] as RewardCategory[]).map((cat) => {
            const catRewards = rewards.filter((r) => r.category === cat);
            const range = CATEGORY_XP_RANGE[cat];
            return (
              <Card key={cat} className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: CATEGORY_COLOR[cat] }}>
                      {CATEGORY_LABEL[cat]}
                    </h3>
                    <p className="text-[10px] text-[#555570]">
                      {range.min}–{range.max} XP · {range.label}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddReward(cat)}>+ Add</Button>
                </div>

                {catRewards.length === 0 && (
                  <p className="text-xs text-[#555570] py-2">No rewards in this category.</p>
                )}
                {catRewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#1a1a24] last:border-0">
                    <div className={`flex-1 min-w-0 ${!r.active ? 'opacity-40' : ''}`}>
                      <p className="text-sm">{r.name}</p>
                      <p className="text-[10px] text-[#555570]">
                        {r.description ? `${r.description} · ` : ''}{r.xpCost} XP
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-[10px] text-[#8888a0] hover:text-[#22d3ee]"
                        onClick={() => toggleReward(r)}
                      >
                        {r.active ? 'Hide' : 'Show'}
                      </button>
                      <button
                        className="text-[10px] text-[#555570] hover:text-[#f43f5e]"
                        onClick={() => removeReward(savedCode, r.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {/* === REQUESTS TAB === */}
      {tab === 'requests' && (
        <div className="animate-fade-in">
          {pendingRequests.length === 0 ? (
            <Card>
              <p className="text-sm text-[#555570] text-center py-4">
                No pending requests. Your child can propose custom rewards from their Rewards screen.
              </p>
            </Card>
          ) : (
            <Card className="mb-4">
              <h2 className="text-sm font-semibold text-[#8888a0] mb-3">
                Pending requests ({pendingRequests.length})
              </h2>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-3 rounded-lg bg-[#1a1a24]">
                    <p className="text-sm font-medium">{req.name}</p>
                    {req.description && <p className="text-xs text-[#8888a0]">{req.description}</p>}
                    <p className="text-[10px] text-[#555570] mb-2">
                      Requested {new Date(req.requestedAt).toLocaleString()}
                    </p>
                    {acceptingId === req.id ? (
                      <div className="space-y-2 animate-fade-in">
                        <input
                          type="number"
                          placeholder="XP cost"
                          value={acceptCost}
                          onChange={(e) => setAcceptCost(e.target.value)}
                          autoFocus
                          className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555570]"
                        />
                        <div className="flex gap-1">
                          {(['minor', 'medium', 'major'] as RewardCategory[]).map((c) => (
                            <button
                              key={c}
                              onClick={() => setAcceptCategory(c)}
                              className={`flex-1 py-1 rounded text-[10px] uppercase transition-all
                                ${acceptCategory === c ? 'bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]' : 'border border-[#2a2a3a] text-[#8888a0]'}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAcceptRequest(req.id)}>Add to catalog</Button>
                          <Button variant="ghost" size="sm" onClick={() => { setAcceptingId(null); setAcceptCost(''); }}>Cancel</Button>
                        </div>
                      </div>
                    ) : decliningId === req.id ? (
                      <div className="flex gap-2 animate-fade-in">
                        <input
                          type="text"
                          placeholder="Reason..."
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          autoFocus
                          className="flex-1 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-2 py-1 text-xs text-white placeholder:text-[#555570]"
                        />
                        <Button size="sm" onClick={() => handleDeclineRequest(req.id)}>Send</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setDecliningId(null); setDeclineReason(''); }}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setAcceptingId(req.id)}>Accept</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDecliningId(req.id)}>Decline</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* === Add/Edit Task Modal === */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md mx-4 mb-4 bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 animate-slide-up">
            <h2 className="text-lg font-bold mb-4">{editingTaskId ? 'Edit Task' : 'Assign a Task'}</h2>
            <input
              type="text"
              placeholder="Task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              autoFocus
              className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
                placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none mb-3"
            />
            <div className="flex gap-2 mb-3">
              {([['quick_win', '⚡ Quick'], ['standard', '📋 Standard'], ['multi_level', '🧱 Steps']] as const).map(([val, label]) => (
                <button
                  key={val}
                  className={`flex-1 py-2 rounded-lg border text-xs transition-all
                    ${taskType === val
                      ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]'
                      : 'border-[#2a2a3a] text-[#8888a0]'}`}
                  onClick={() => setTaskType(val)}
                >
                  {label}
                </button>
              ))}
            </div>
            {taskType === 'multi_level' && (
              <div className="space-y-2 mb-3">
                {taskSteps.map((step, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Step ${i + 1}`}
                    value={step}
                    onChange={(e) => {
                      const updated = [...taskSteps];
                      updated[i] = e.target.value;
                      setTaskSteps(updated);
                    }}
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#555570]"
                  />
                ))}
                <button className="text-xs text-[#22d3ee]" onClick={() => setTaskSteps([...taskSteps, ''])}>
                  + Add step
                </button>
              </div>
            )}

            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={taskUrgent}
                onChange={(e) => setTaskUrgent(e.target.checked)}
                className="accent-[#f43f5e]"
              />
              <span className="text-sm">Urgent (auto-pins to his Top 3)</span>
            </label>

            <input
              type="text"
              placeholder="Message when he finishes (optional)"
              value={taskMessage}
              onChange={(e) => setTaskMessage(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
                placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none mb-4 text-sm"
            />

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={resetTaskForm}>Cancel</Button>
              <Button className="flex-1" disabled={!taskName.trim()} onClick={handleSaveTask}>
                {editingTaskId ? 'Save' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === Add Reward Modal === */}
      {showAddReward && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md mx-4 mb-4 bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 animate-slide-up">
            <h2 className="text-lg font-bold mb-1">Add {CATEGORY_LABEL[showAddReward]} Reward</h2>
            <p className="text-[10px] text-[#555570] mb-4">
              {CATEGORY_XP_RANGE[showAddReward].min}–{CATEGORY_XP_RANGE[showAddReward].max} XP · {CATEGORY_XP_RANGE[showAddReward].label}
            </p>
            <input
              type="text"
              placeholder="Reward name"
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              autoFocus
              className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
                placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none mb-3"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={rewardDesc}
              onChange={(e) => setRewardDesc(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
                placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none mb-3 text-sm"
            />
            <input
              type="number"
              placeholder="XP cost"
              value={rewardCost}
              onChange={(e) => setRewardCost(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white
                placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none mb-4 font-mono"
            />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowAddReward(null); setRewardName(''); setRewardDesc(''); setRewardCost(''); }}>Cancel</Button>
              <Button className="flex-1" disabled={!rewardName.trim() || !rewardCost} onClick={handleAddReward}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
