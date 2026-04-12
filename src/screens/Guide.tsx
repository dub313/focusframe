import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

interface GuideSlide {
  emoji: string;
  title: string;
  description: string;
  tip?: string;
  color: string;
}

const SLIDES: GuideSlide[] = [
  {
    emoji: '🌅',
    title: 'Morning Boot',
    description: 'Every day starts here. Rate your energy, log training, check your mood. Takes under 60 seconds. This sets up your whole day.',
    tip: 'Do this first thing — before checking your phone.',
    color: '#22d3ee',
  },
  {
    emoji: '🔋',
    title: 'Your Battery',
    description: "Your energy is limited. The battery shows how much you've got. Hard tasks drain it, recovery fills it back up. When it's empty — quick wins and recharge only.",
    tip: "It's not about doing everything. It's about doing the right things.",
    color: '#10b981',
  },
  {
    emoji: '📋',
    title: 'Top 3 Tasks',
    description: 'Pick your 3 most important tasks each day. Complete all 3 and you keep your streak going. That\'s the baseline — everything after is bonus.',
    tip: 'Start with something easy to build momentum.',
    color: '#a78bfa',
  },
  {
    emoji: '⚡',
    title: 'Quick Wins',
    description: 'Tiny tasks under 5 minutes. Take out trash, reply to a text, put something away. These are your secret weapon when you feel stuck.',
    tip: 'Starting is the hardest part. Quick Wins get you moving.',
    color: '#22d3ee',
  },
  {
    emoji: '⚡',
    title: 'Surge Mode',
    description: 'Finish your Top 3? You unlock Surge Mode. Keep going for escalating XP multipliers. This is for those days when you\'re locked in.',
    tip: "It's optional. Finishing Top 3 is already a win. No guilt if you stop.",
    color: '#f97316',
  },
  {
    emoji: '🏦',
    title: 'The Vault',
    description: 'After earning XP, you choose: BANK it (grows 5% daily in the Vault) or BURN it (spend now). Banking teaches your brain that waiting = more.',
    tip: 'Watch your Vault grow. Diamond tier = 5x value after 30 days.',
    color: '#f59e0b',
  },
  {
    emoji: '🔥',
    title: 'Streaks',
    description: 'Complete your Top 3 daily and your streak grows. Longer streaks = bigger XP multipliers (up to 5x at 30 days). Miss a day? Multiplier resets, but your XP stays.',
    tip: 'Consistency beats intensity. 3 tasks for 30 days > 10 tasks for 3 days.',
    color: '#f43f5e',
  },
  {
    emoji: '⏱️',
    title: 'Focus Mode',
    description: 'A timer for deep work. Set 15, 25, or 45 minutes. Pick what you\'re working on. Earn XP for each completed session.',
    tip: 'Pair it with something — homework, reading, cleaning your room.',
    color: '#22d3ee',
  },
  {
    emoji: '🥊',
    title: 'Training = XP',
    description: 'Boxing and baseball earn major XP. Exercise is medicine for your brain — the app treats it that way. Log your training and watch your mood improve on training days.',
    tip: 'Check your Growth Map after 2 weeks — you\'ll see the pattern.',
    color: '#10b981',
  },
  {
    emoji: '😊',
    title: 'Mood Check',
    description: 'Quick emoji tap to track how you feel. Over time, you\'ll see patterns — what makes good days good and tough days tough. Breathing exercises are here too.',
    tip: 'This is private. Nobody sees it but you.',
    color: '#a78bfa',
  },
  {
    emoji: '📊',
    title: 'Growth Map',
    description: 'Your stats, charts, and personal records. See your XP trend, mood patterns, and how training affects your productivity. The app learns YOU.',
    tip: 'After 14 days, insights start appearing automatically.',
    color: '#3b82f6',
  },
  {
    emoji: '🤖',
    title: 'Vega Jr.',
    description: 'Your AI coach. Ask for help getting unstuck, breaking down tasks, or planning your day. It sees your current state and gives specific advice.',
    tip: 'Try "I\'m stuck" or "What should I do next?" to get started.',
    color: '#22d3ee',
  },
  {
    emoji: '📅',
    title: 'Calendar',
    description: 'Schedule events, appointments, and recurring commitments. Set something once and repeat it weekly — like drivers training every Saturday.',
    tip: 'Check your calendar in the morning to know what\'s coming.',
    color: '#3b82f6',
  },
  {
    emoji: '💪',
    title: 'You Got This',
    description: 'This app doesn\'t judge. Bad days are low battery days — they\'re part of the system, not failures. Show up, do what you can, and let the streaks compound.',
    tip: 'The goal isn\'t perfection. The goal is showing up.',
    color: '#f59e0b',
  },
];

export default function Guide() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      {/* Progress dots */}
      <div className="flex gap-1 mb-6 px-2">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= current ? slide.color : '#2a2a3a' }}
          />
        ))}
      </div>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-fade-in" key={current}>
        <span className="text-6xl">{slide.emoji}</span>
        <h1 className="text-2xl font-bold" style={{ color: slide.color }}>
          {slide.title}
        </h1>
        <p className="text-[#c0c0cc] text-base leading-relaxed max-w-sm">
          {slide.description}
        </p>
        {slide.tip && (
          <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-3 max-w-sm">
            <p className="text-sm text-[#8888a0]">
              <span className="text-[#f59e0b]">Tip:</span> {slide.tip}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        {current > 0 && (
          <Button variant="secondary" className="flex-1" onClick={() => setCurrent(current - 1)}>
            Back
          </Button>
        )}
        {current === 0 && (
          <Button variant="ghost" className="flex-1" onClick={() => navigate(-1)}>
            Skip
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1"
          style={isLast ? { background: slide.color } : undefined}
          onClick={() => {
            if (isLast) {
              navigate('/', { replace: true });
            } else {
              setCurrent(current + 1);
            }
          }}
        >
          {isLast ? "Let's Go" : 'Next'}
        </Button>
      </div>

      {/* Slide counter */}
      <p className="text-center text-xs text-[#555570] mt-3">
        {current + 1} / {SLIDES.length}
      </p>
    </div>
  );
}
