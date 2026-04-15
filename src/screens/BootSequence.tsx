import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useDailyState } from '../hooks/useDailyState';
import { useProfile } from '../hooks/useProfile';
import { useVault } from '../hooks/useVault';
import { useFamily } from '../hooks/useFamily';
import { calculateBatteryMax } from '../lib/battery';
import { BOOT_XP } from '../lib/xp';
import type { MoodLevel, TrainingType, TrainingInfo, MoodEntry } from '../types';

const ENERGY_LABELS = ['', 'Running on Empty', 'Low', 'Alright', 'Solid', 'Full Send'];
const ENERGY_COLORS = ['', '#f43f5e', '#f97316', '#f59e0b', '#10b981', '#22d3ee'];
const MOOD_EMOJIS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: '😤', label: 'Frustrated' },
  { level: 2, emoji: '😔', label: 'Low' },
  { level: 3, emoji: '😐', label: 'Meh' },
  { level: 4, emoji: '🙂', label: 'Good' },
  { level: 5, emoji: '🔥', label: 'Locked In' },
];
const TRAINING_OPTIONS: { type: TrainingType; emoji: string; label: string }[] = [
  { type: 'boxing', emoji: '🥊', label: 'Boxing' },
  { type: 'baseball', emoji: '⚾', label: 'Baseball' },
  { type: 'both', emoji: '🥊⚾', label: 'Both' },
  { type: 'rest', emoji: '😴', label: 'Rest Day' },
];

export default function BootSequence() {
  const navigate = useNavigate();
  const { completeBoot, state } = useDailyState();
  const { addXP, profile } = useProfile();
  const { vault } = useVault();
  const { syncProgress } = useFamily();

  const [step, setStep] = useState(1);
  const [sleepHours, setSleepHours] = useState(8);
  const [energy, setEnergy] = useState(3);
  const [trainingType, setTrainingType] = useState<TrainingType>('rest');
  const [trainingTime, setTrainingTime] = useState('16:00');
  const [moodLevel, setMoodLevel] = useState<MoodLevel>(3);
  const [moodNote, setMoodNote] = useState('');

  const batteryMax = calculateBatteryMax(energy, trainingType, sleepHours);

  // If already booted today, go to dashboard
  if (state.bootDone) {
    navigate('/', { replace: true });
    return null;
  }

  function handleFinish() {
    const training: TrainingInfo = {
      type: trainingType,
      time: trainingType !== 'rest' ? trainingTime : undefined,
    };
    const mood: MoodEntry = {
      timestamp: new Date().toISOString(),
      level: moodLevel,
      note: moodNote || undefined,
    };
    completeBoot(energy, training, mood, batteryMax, sleepHours);
    addXP(BOOT_XP);
    // Push fresh state to parent portal (fire-and-forget). Build a local copy
    // because the hook state won't update synchronously.
    syncProgress(
      { ...state, bootDone: true, energy, sleepHours, training, mood, batteryMax },
      profile,
      vault,
    );
    navigate('/', { replace: true });
  }

  const sleepLabel =
    sleepHours >= 8 ? 'Fully charged' :
    sleepHours >= 7 ? 'Solid rest' :
    sleepHours >= 6 ? 'Good enough' :
    sleepHours >= 5 ? 'Running light' :
    sleepHours >= 4 ? 'Rough night' :
    'Survival mode';
  const sleepColor =
    sleepHours >= 7 ? '#22d3ee' :
    sleepHours >= 6 ? '#10b981' :
    sleepHours >= 5 ? '#f59e0b' :
    sleepHours >= 4 ? '#f97316' :
    '#f43f5e';

  return (
    <div className="min-h-screen flex flex-col px-5 py-8 animate-fade-in">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: s <= step ? '#22d3ee' : '#2a2a3a' }}
          />
        ))}
      </div>

      {/* Step 1: Sleep */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
          <h1 className="text-2xl font-bold text-center">
            {profile.userName ? `Morning ${profile.userName}.` : 'Morning.'}
            <br />
            <span className="text-xl font-medium text-[#8888a0]">How much sleep last night?</span>
          </h1>
          <div className="w-full max-w-xs">
            <div className="text-center mb-6">
              <div className="font-mono text-6xl font-bold" style={{ color: sleepColor }}>
                {sleepHours}
                <span className="text-2xl text-[#8888a0] ml-1">hrs</span>
              </div>
              <p className="mt-2 text-lg font-medium" style={{ color: sleepColor }}>
                {sleepLabel}
              </p>
            </div>
            <input
              type="range"
              min={3}
              max={10}
              step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-[#22d3ee]"
            />
            <div className="flex justify-between text-xs text-[#555570] mt-1 font-mono">
              <span>3</span>
              <span>6</span>
              <span>8+</span>
            </div>
            <p className="text-xs text-[#555570] text-center mt-4 max-w-xs">
              Sleep sets your real ceiling. 8+ hours = full battery. Less = less.
            </p>
          </div>
          <Button size="lg" className="w-full max-w-xs" onClick={() => setStep(2)}>
            Next
          </Button>
        </div>
      )}

      {/* Step 2: Energy */}
      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
          <h1 className="text-2xl font-bold">
            How does your body feel?
          </h1>
          <div className="relative w-full max-w-xs">
            {/* Battery visual */}
            <div className="mx-auto w-24 h-40 rounded-xl border-3 border-[#2a2a3a] bg-[#111118] relative overflow-hidden mb-6">
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-b-lg"
                style={{
                  height: `${energy * 20}%`,
                  background: ENERGY_COLORS[energy],
                }}
              />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 bg-[#2a2a3a] rounded-t-md" />
            </div>
            {/* Slider */}
            <input
              type="range"
              min={1}
              max={5}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-[#22d3ee]"
            />
            <p className="text-center mt-3 text-lg font-medium" style={{ color: ENERGY_COLORS[energy] }}>
              {ENERGY_LABELS[energy]}
            </p>
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button size="md" className="flex-1" onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 3: Training */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-slide-up">
          <h1 className="text-2xl font-bold">Training today?</h1>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {TRAINING_OPTIONS.map((opt) => (
              <Card
                key={opt.type}
                className={`flex flex-col items-center gap-2 py-5 cursor-pointer transition-all
                  ${trainingType === opt.type ? 'border-[#22d3ee] bg-[#22d3ee]/10' : 'hover:bg-[#1a1a24]'}`}
                onClick={() => setTrainingType(opt.type)}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </Card>
            ))}
          </div>
          {trainingType !== 'rest' && (
            <div className="flex items-center gap-3 animate-fade-in">
              <span className="text-[#8888a0]">What time?</span>
              <input
                type="time"
                value={trainingTime}
                onChange={(e) => setTrainingTime(e.target.value)}
                className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white"
              />
            </div>
          )}
          {trainingType === 'rest' && (
            <p className="text-[#8888a0] text-sm">Recovery is part of performance 💪</p>
          )}
          <div className="flex gap-3 w-full max-w-xs">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(2)}>Back</Button>
            <Button size="md" className="flex-1" onClick={() => setStep(4)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 4: Mood */}
      {step === 4 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-slide-up">
          <h1 className="text-2xl font-bold">Mood check</h1>
          <div className="flex gap-2">
            {MOOD_EMOJIS.map((m) => (
              <button
                key={m.level}
                onClick={() => setMoodLevel(m.level)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                  ${moodLevel === m.level
                    ? 'bg-[#22d3ee]/10 scale-110 border border-[#22d3ee]'
                    : 'hover:bg-[#1a1a24] border border-transparent'}`}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-[10px] text-[#8888a0]">{m.label}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Quick note (optional)"
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            className="w-full max-w-xs bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white placeholder:text-[#555570]"
          />
          <div className="flex gap-3 w-full max-w-xs">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(3)}>Back</Button>
            <Button size="md" className="flex-1" onClick={() => setStep(5)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 5: Day Summary */}
      {step === 5 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-slide-up">
          <h1 className="text-2xl font-bold">Here's Your Day</h1>
          <Card className="w-full max-w-xs space-y-4">
            {/* Battery */}
            <div className="flex items-center justify-between">
              <span className="text-[#8888a0]">Battery</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(batteryMax, 12) }, (_, i) => (
                  <div
                    key={i}
                    className="w-2 h-6 rounded-sm"
                    style={{ background: ENERGY_COLORS[energy] }}
                  />
                ))}
                <span className="ml-2 font-mono text-sm" style={{ color: ENERGY_COLORS[energy] }}>
                  {batteryMax}
                </span>
              </div>
            </div>
            {/* Sleep */}
            <div className="flex items-center justify-between">
              <span className="text-[#8888a0]">Sleep</span>
              <span className="font-mono" style={{ color: sleepColor }}>{sleepHours} hrs</span>
            </div>
            {/* Training */}
            <div className="flex items-center justify-between">
              <span className="text-[#8888a0]">Training</span>
              <span>
                {TRAINING_OPTIONS.find((o) => o.type === trainingType)?.emoji}{' '}
                {TRAINING_OPTIONS.find((o) => o.type === trainingType)?.label}
                {trainingType !== 'rest' && ` @ ${trainingTime}`}
              </span>
            </div>
            {/* Mood */}
            <div className="flex items-center justify-between">
              <span className="text-[#8888a0]">Mood</span>
              <span>{MOOD_EMOJIS.find((m) => m.level === moodLevel)?.emoji} {MOOD_EMOJIS.find((m) => m.level === moodLevel)?.label}</span>
            </div>
            {/* Task slots */}
            <div className="flex items-center justify-between">
              <span className="text-[#8888a0]">Task slots</span>
              <span className="font-mono text-[#22d3ee]">
                {batteryMax} available
              </span>
            </div>
          </Card>
          {trainingType !== 'rest' && (
            <p className="text-xs text-[#555570] max-w-xs text-center">
              Hard tasks before training. Quick wins after.
            </p>
          )}
          <div className="flex gap-3 w-full max-w-xs">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(4)}>Back</Button>
            <Button size="lg" className="flex-1" onClick={handleFinish}>
              Let's Go 🚀
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
