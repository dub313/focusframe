import { getBatteryPercent, getBatteryColor } from '../../lib/battery';

interface BatteryGaugeProps {
  max: number;
  used: number;
  className?: string;
  showLabel?: boolean;
}

export function BatteryGauge({ max, used, className = '', showLabel = true }: BatteryGaugeProps) {
  const percent = getBatteryPercent(max, used);
  const color = getBatteryColor(percent);
  const remaining = Math.max(0, max - used);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Battery icon */}
      <div className="relative w-12 h-6 rounded-md border-2 border-[#2a2a3a] bg-[#111118]">
        {/* Fill */}
        <div
          className="absolute inset-0.5 rounded-sm transition-all duration-500"
          style={{ width: `${percent}%`, background: color }}
        />
        {/* Cap */}
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-[#2a2a3a] rounded-r-sm" />
      </div>
      {showLabel && (
        <span className="font-mono text-sm" style={{ color }}>
          {remaining}/{max}
        </span>
      )}
    </div>
  );
}
