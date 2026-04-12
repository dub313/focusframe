import { useEffect, useState } from 'react';

interface XPBurstProps {
  amount: number;
  onDone?: () => void;
}

export function XPBurst({ amount, onDone }: XPBurstProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 800);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <span className="font-mono text-2xl font-bold text-[#f59e0b] animate-xp-burst">
        +{amount} XP
      </span>
    </div>
  );
}
