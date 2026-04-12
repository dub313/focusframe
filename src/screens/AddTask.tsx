import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useDailyState } from '../hooks/useDailyState';
import { getBaseXP } from '../lib/xp';
import { getEnergyCost } from '../lib/battery';
import type { TaskType, Task, SubTask } from '../types';

const TASK_TYPES: { type: TaskType; icon: string; label: string; desc: string; color: string }[] = [
  { type: 'quick_win', icon: '⚡', label: 'Quick Win', desc: 'Under 5 min', color: '#22d3ee' },
  { type: 'standard', icon: '📋', label: 'Standard', desc: 'Normal task', color: '#a78bfa' },
  { type: 'multi_level', icon: '🧱', label: 'Multi-Level', desc: 'Has steps', color: '#f97316' },
  { type: 'multi_day', icon: '📅', label: 'Multi-Day', desc: 'Spans days', color: '#3b82f6' },
  { type: 'continuous', icon: '🔄', label: 'Continuous', desc: 'Recurring', color: '#10b981' },
];

export default function AddTask() {
  const navigate = useNavigate();
  const { state, setState } = useDailyState();

  const [step, setStep] = useState<'type' | 'details'>('type');
  const [taskType, setTaskType] = useState<TaskType>('standard');
  const [name, setName] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  const [targetDate, setTargetDate] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekly'>('daily');

  const topThreeCount = state.tasks.filter((t) => t.isTopThree && !t.completed).length;
  const canBeTopThree = topThreeCount < 3 && taskType !== 'quick_win';

  function addSubtaskField() {
    setSubtasks([...subtasks, '']);
  }

  function updateSubtask(index: number, value: string) {
    const updated = [...subtasks];
    updated[index] = value;
    setSubtasks(updated);
  }

  function removeSubtask(index: number) {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  }

  function handleCreate() {
    if (!name.trim()) return;

    const subs: SubTask[] | undefined = taskType === 'multi_level'
      ? subtasks.filter((s) => s.trim()).map((s) => ({
          id: crypto.randomUUID(),
          name: s.trim(),
          completed: false,
        }))
      : undefined;

    const milestones: SubTask[] | undefined = taskType === 'multi_day'
      ? [{ id: crypto.randomUUID(), name: 'Daily check-in', completed: false }]
      : undefined;

    const task: Task = {
      id: crypto.randomUUID(),
      type: taskType,
      name: name.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      energyCost: getEnergyCost(taskType),
      baseXP: getBaseXP(taskType),
      isTopThree: canBeTopThree,
      subtasks: subs,
      milestones,
      targetDate: taskType === 'multi_day' ? targetDate : undefined,
      frequency: taskType === 'continuous' ? frequency : undefined,
      continuousHistory: taskType === 'continuous' ? {} : undefined,
    };

    setState((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    navigate('/');
  }

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Add Task</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Cancel</Button>
      </div>

      {step === 'type' && (
        <div className="space-y-3 animate-slide-up">
          <p className="text-sm text-[#8888a0] mb-4">What kind of task?</p>
          {TASK_TYPES.map((tt) => (
            <Card
              key={tt.type}
              className={`flex items-center gap-4 cursor-pointer transition-all
                ${taskType === tt.type ? 'border-[#22d3ee] bg-[#22d3ee]/5' : 'active:scale-[0.98]'}`}
              onClick={() => setTaskType(tt.type)}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${tt.color}15` }}
              >
                {tt.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">{tt.label}</p>
                <p className="text-xs text-[#555570]">{tt.desc} · {getEnergyCost(tt.type)} bar · {getBaseXP(tt.type)} XP</p>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2"
                style={{
                  borderColor: taskType === tt.type ? '#22d3ee' : '#2a2a3a',
                  background: taskType === tt.type ? '#22d3ee' : 'transparent',
                }}
              />
            </Card>
          ))}
          <Button size="lg" className="w-full mt-4" onClick={() => setStep('details')}>
            Next
          </Button>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-4 animate-slide-up">
          <input
            type="text"
            placeholder="What needs to get done?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-4 text-lg text-white placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none transition-colors"
          />

          {/* Multi-level: subtasks */}
          {taskType === 'multi_level' && (
            <div className="space-y-2">
              <p className="text-sm text-[#8888a0]">Steps</p>
              {subtasks.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Step ${i + 1}`}
                    value={s}
                    onChange={(e) => updateSubtask(i, e.target.value)}
                    className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white placeholder:text-[#555570] focus:border-[#f97316] focus:outline-none"
                  />
                  {subtasks.length > 1 && (
                    <button
                      className="text-[#555570] hover:text-[#f43f5e] px-2"
                      onClick={() => removeSubtask(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addSubtaskField}>+ Add step</Button>
            </div>
          )}

          {/* Multi-day: target date */}
          {taskType === 'multi_day' && (
            <div>
              <p className="text-sm text-[#8888a0] mb-2">Target date</p>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white focus:border-[#3b82f6] focus:outline-none"
              />
            </div>
          )}

          {/* Continuous: frequency */}
          {taskType === 'continuous' && (
            <div>
              <p className="text-sm text-[#8888a0] mb-2">Frequency</p>
              <div className="flex gap-2">
                {(['daily', 'weekdays', 'weekly'] as const).map((f) => (
                  <button
                    key={f}
                    className={`flex-1 py-2 rounded-lg border text-sm transition-all
                      ${frequency === f
                        ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                        : 'border-[#2a2a3a] text-[#8888a0]'}`}
                    onClick={() => setFrequency(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top 3 indicator */}
          {canBeTopThree && (
            <p className="text-xs text-[#22d3ee]">
              ✨ This will be added to your Top 3
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('type')}>Back</Button>
            <Button className="flex-1" onClick={handleCreate} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
