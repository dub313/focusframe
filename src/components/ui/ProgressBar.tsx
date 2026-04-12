interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  className?: string;
  animate?: boolean;
}

export function ProgressBar({ value, color = '#22d3ee', height = 8, className = '', animate = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`w-full rounded-full overflow-hidden ${className}`}
      style={{ height, background: '#1a1a24' }}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${animate ? 'animate-progress-fill' : ''}`}
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
