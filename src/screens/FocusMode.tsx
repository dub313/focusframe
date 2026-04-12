import { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useDailyState } from '../hooks/useDailyState';
import { useProfile } from '../hooks/useProfile';
import { POMODORO_XP } from '../lib/xp';

export default function FocusMode() {
  const { addXP: addDailyXP } = useDailyState();
  const { addXP: addProfileXP, addFocusMinutes } = useProfile();

  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);

  const totalSeconds = (isBreak ? breakMinutes : workMinutes) * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isBreak) {
            // Work session complete
            addDailyXP(POMODORO_XP);
            addProfileXP(POMODORO_XP);
            addFocusMinutes(workMinutes);
            setSessions((s) => s + 1);
            setIsBreak(true);
            return breakMinutes * 60;
          } else {
            // Break complete
            setIsBreak(false);
            setIsRunning(false);
            return workMinutes * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak, workMinutes, breakMinutes, addDailyXP, addProfileXP, addFocusMinutes]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workMinutes * 60);
  }, [workMinutes]);

  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-6">Focus Mode</h1>

      {/* Timer Ring */}
      <div className="flex justify-center mb-8">
        <div className="relative w-64 h-64">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="120" fill="none" stroke="#1a1a24" strokeWidth="8" />
            <circle
              cx="130" cy="130" r="120" fill="none"
              stroke={isBreak ? '#10b981' : '#22d3ee'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-bold">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-sm text-[#8888a0] mt-1">
              {isBreak ? 'Break' : 'Focus'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={isRunning ? 'secondary' : 'primary'}
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? 'Pause' : (timeLeft === workMinutes * 60 ? 'Start' : 'Resume')}
        </Button>
        {(isRunning || timeLeft !== workMinutes * 60) && (
          <Button variant="ghost" size="lg" onClick={reset}>Reset</Button>
        )}
      </div>

      {/* Duration Selector (when not running) */}
      {!isRunning && !isBreak && timeLeft === workMinutes * 60 && (
        <div className="flex justify-center gap-3 mb-8">
          {[15, 25, 45].map((min) => (
            <button
              key={min}
              className={`px-4 py-2 rounded-lg border text-sm font-mono transition-all
                ${workMinutes === min
                  ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]'
                  : 'border-[#2a2a3a] text-[#8888a0]'}`}
              onClick={() => { setWorkMinutes(min); setTimeLeft(min * 60); }}
            >
              {min}m
            </button>
          ))}
        </div>
      )}

      {/* Sessions */}
      <Card className="text-center">
        <p className="font-mono text-2xl font-bold text-[#f59e0b]">{sessionsCompleted}</p>
        <p className="text-xs text-[#8888a0]">Sessions today · {sessionsCompleted * POMODORO_XP} XP earned</p>
      </Card>
    </div>
  );
}
