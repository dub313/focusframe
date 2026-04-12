import { useEffect, useState, useMemo } from 'react';

interface ConfettiRainProps {
  duration?: number;
  onDone?: () => void;
}

const COLORS = ['#22d3ee', '#f59e0b', '#10b981', '#a78bfa', '#f43f5e', '#f97316'];

export function ConfettiRain({ duration = 2000, onDone }: ConfettiRainProps) {
  const [visible, setVisible] = useState(true);

  const pieces = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 6,
      duration: 1.5 + Math.random() * 1,
    })),
  []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
