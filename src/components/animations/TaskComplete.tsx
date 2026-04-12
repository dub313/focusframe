import { useEffect, useState } from 'react';

interface TaskCompleteProps {
  onDone?: () => void;
}

export function TaskComplete({ onDone }: TaskCompleteProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <svg className="w-16 h-16 animate-checkmark" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="25" fill="none" stroke="#10b981" strokeWidth="2" />
        <path
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
        />
      </svg>
    </div>
  );
}
