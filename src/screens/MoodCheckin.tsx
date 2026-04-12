import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDailyState } from '../hooks/useDailyState';
import { useProfile } from '../hooks/useProfile';
import { MOOD_CHECKIN_XP, BREATHING_XP } from '../lib/xp';
import type { MoodLevel } from '../types';

const MOODS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: '😤', label: 'Frustrated' },
  { level: 2, emoji: '😔', label: 'Low' },
  { level: 3, emoji: '😐', label: 'Meh' },
  { level: 4, emoji: '🙂', label: 'Good' },
  { level: 5, emoji: '🔥', label: 'Locked In' },
];

type BreathingType = 'box' | '478' | null;

export default function MoodCheckin() {
  const { state, setMood, addXP: addDailyXP, addRecovery } = useDailyState();
  const { addXP: addProfileXP } = useProfile();

  const [selectedMood, setSelectedMood] = useState<MoodLevel>(state.mood.level);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [breathing, setBreathing] = useState<BreathingType>(null);
  const [breathPhase, setBreathPhase] = useState('');

  function saveMood() {
    setMood({
      timestamp: new Date().toISOString(),
      level: selectedMood,
      note: note || undefined,
    });
    addDailyXP(MOOD_CHECKIN_XP);
    addProfileXP(MOOD_CHECKIN_XP);
    setSaved(true);
  }

  function startBreathing(type: BreathingType) {
    setBreathing(type);
    runBreathingCycle(type!);
  }

  function runBreathingCycle(type: 'box' | '478') {
    const phases = type === 'box'
      ? [{ label: 'Breathe In', ms: 4000 }, { label: 'Hold', ms: 4000 }, { label: 'Breathe Out', ms: 4000 }, { label: 'Hold', ms: 4000 }]
      : [{ label: 'Breathe In', ms: 4000 }, { label: 'Hold', ms: 7000 }, { label: 'Breathe Out', ms: 8000 }];

    let i = 0;
    let cycle = 0;
    const maxCycles = 3;

    function next() {
      if (cycle >= maxCycles) {
        setBreathing(null);
        setBreathPhase('');
        addDailyXP(BREATHING_XP);
        addProfileXP(BREATHING_XP);
        addRecovery(1);
        return;
      }
      setBreathPhase(phases[i].label);
      setTimeout(() => {
        i++;
        if (i >= phases.length) {
          i = 0;
          cycle++;
        }
        next();
      }, phases[i].ms);
    }
    next();
  }

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-6">Mood Check</h1>

      {/* Breathing Exercise Overlay */}
      {breathing && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col items-center justify-center">
          <div className="w-40 h-40 rounded-full border-2 border-[#22d3ee] animate-breathe flex items-center justify-center">
            <span className="text-lg font-medium text-[#22d3ee]">{breathPhase}</span>
          </div>
          <p className="text-[#8888a0] mt-8 text-sm">{breathing === 'box' ? 'Box Breathing' : '4-7-8 Breathing'}</p>
          <Button variant="ghost" className="mt-4" onClick={() => setBreathing(null)}>Cancel</Button>
        </div>
      )}

      {/* Mood Selector */}
      {!saved ? (
        <>
          <div className="flex justify-center gap-2 mb-6">
            {MOODS.map((m) => (
              <button
                key={m.level}
                onClick={() => setSelectedMood(m.level)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                  ${selectedMood === m.level
                    ? 'bg-[#22d3ee]/10 scale-110 border border-[#22d3ee]'
                    : 'border border-transparent hover:bg-[#1a1a24]'}`}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-[10px] text-[#8888a0]">{m.label}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Quick note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white placeholder:text-[#555570] mb-4"
          />
          <Button size="lg" className="w-full" onClick={saveMood}>Save</Button>
        </>
      ) : (
        <Card className="text-center py-6 mb-6 animate-bounce-in">
          <span className="text-4xl">{MOODS.find((m) => m.level === selectedMood)?.emoji}</span>
          <p className="text-[#8888a0] mt-2">Logged +{MOOD_CHECKIN_XP} XP</p>
        </Card>
      )}

      {/* Breathing Exercises */}
      <h2 className="text-sm font-semibold text-[#8888a0] mt-8 mb-3 uppercase tracking-wider">Breathing</h2>
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="text-center py-4 cursor-pointer active:scale-[0.97]"
          onClick={() => startBreathing('box')}
        >
          <p className="text-2xl mb-1">◻️</p>
          <p className="text-sm font-medium">Box Breathing</p>
          <p className="text-[10px] text-[#555570]">4-4-4-4 · +1 bar +10 XP</p>
        </Card>
        <Card
          className="text-center py-4 cursor-pointer active:scale-[0.97]"
          onClick={() => startBreathing('478')}
        >
          <p className="text-2xl mb-1">🔵</p>
          <p className="text-sm font-medium">4-7-8</p>
          <p className="text-[10px] text-[#555570]">Calm down · +1 bar +10 XP</p>
        </Card>
      </div>
    </div>
  );
}
