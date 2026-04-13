import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PinPad } from '../components/ui/PinPad';
import { useStorage } from '../hooks/useStorage';
import { KEYS } from '../lib/keys';
import {
  createFamily,
  familyExists,
  pushParentTask,
  removeParentTask,
  onParentTasks,
  onChildProgress,
  type ParentTask,
  type ChildProgress,
} from '../lib/firebase';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  timerWorkMinutes: 25,
  timerBreakMinutes: 5,
  notificationsEnabled: false,
  hapticEnabled: true,
  seasonMode: 'auto',
};

type TaskType = 'quick_win' | 'standard' | 'multi_level';

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

  // Add task form
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('standard');
  const [taskSteps, setTaskSteps] = useState<string[]>(['']);

  // Load saved family code
  useEffect(() => {
    const stored = localStorage.getItem('focusframe:familyCode');
    if (stored) {
      setSavedCode(stored);
      setFamilyCode(stored);
    }
  }, []);

  // Subscribe to data when connected
  useEffect(() => {
    if (!connected || !savedCode) return;

    const unsub1 = onParentTasks(savedCode, setTasks);
    const unsub2 = onChildProgress(savedCode, setProgress);

    return () => { unsub1(); unsub2(); };
  }, [connected, savedCode]);

  function handlePinSubmit(pin: string) {
    if (!hasPIN) {
      // Setting PIN for first time
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
        // Join existing family
        setSavedCode(code);
        localStorage.setItem('focusframe:familyCode', code);
        setConnected(true);
      } else {
        // New family — create it
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

  async function handleAddTask() {
    if (!taskName.trim()) return;

    const task: ParentTask = {
      id: crypto.randomUUID(),
      name: taskName.trim(),
      type: taskType,
      assignedAt: new Date().toISOString(),
      completed: false,
      steps: taskType === 'multi_level' ? taskSteps.filter((s) => s.trim()) : undefined,
    };

    await pushParentTask(savedCode, task);
    setTaskName('');
    setTaskType('standard');
    setTaskSteps(['']);
    setShowAddTask(false);
  }

  async function handleRemoveTask(taskId: string) {
    await removeParentTask(savedCode, taskId);
  }

  // PIN screen
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

  // Family code screen
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
              <Button size="sm" className="mt-2" onClick={handleCreateFamily}>
                Create Family
              </Button>
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

  // Connected — main parent dashboard
  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Parent Portal</h1>
          <Badge color="#10b981">{savedCode}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAuthenticated(false)}>Lock</Button>
      </div>

      {/* Child's Progress — NO private data */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Progress</h2>
        {progress ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[#555570]">Streak</span>
              <p className="font-mono font-bold text-[#22d3ee]">{progress.currentStreak} days</p>
            </div>
            <div>
              <span className="text-[#555570]">Total XP</span>
              <p className="font-mono font-bold text-[#f59e0b]">{progress.totalXP}</p>
            </div>
            <div>
              <span className="text-[#555570]">Today's Tasks</span>
              <p className="font-mono font-bold">{progress.todayTasksDone}/{progress.todayTasksTotal}</p>
            </div>
            <div>
              <span className="text-[#555570]">Today's XP</span>
              <p className="font-mono font-bold">{progress.todayXP}</p>
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
              <span className="text-[#555570]">Days Active</span>
              <p className="font-mono font-bold">{progress.daysActive}</p>
            </div>
            <div>
              <span className="text-[#555570]">Vault</span>
              <p className="font-mono font-bold text-[#f59e0b]">{progress.vaultBalance}</p>
            </div>
            {progress.surgeActive && (
              <div className="col-span-2">
                <Badge color="#f97316">Surge Mode Active</Badge>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#555570]">No data yet. Your child needs to connect and complete their first boot.</p>
        )}
        <p className="text-[10px] text-[#555570] mt-3">
          {progress?.lastUpdated ? `Updated ${new Date(progress.lastUpdated).toLocaleTimeString()}` : ''}
        </p>
      </Card>

      {/* Assigned Tasks */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#8888a0]">Assigned Tasks</h2>
          <Button size="sm" onClick={() => setShowAddTask(true)}>+ Assign</Button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-[#555570] text-center py-4">
            No tasks assigned. Tap + Assign to send tasks to your child's app.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-2">
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center
                  ${task.completed ? 'bg-[#10b981] border-[#10b981]' : 'border-[#2a2a3a]'}`}>
                  {task.completed && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.completed ? 'line-through text-[#555570]' : ''}`}>{task.name}</p>
                  <p className="text-[10px] text-[#555570]">{task.type.replace('_', ' ')}</p>
                </div>
                <button
                  className="text-[10px] text-[#555570] hover:text-[#f43f5e]"
                  onClick={() => handleRemoveTask(task.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md mx-4 mb-4 bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 animate-slide-up">
            <h2 className="text-lg font-bold mb-4">Assign a Task</h2>

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
                <button
                  className="text-xs text-[#22d3ee]"
                  onClick={() => setTaskSteps([...taskSteps, ''])}
                >
                  + Add step
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!taskName.trim()} onClick={handleAddTask}>Assign</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
