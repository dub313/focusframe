import { useState } from 'react';

interface PinPadProps {
  onSubmit: (pin: string) => void;
  error?: boolean;
}

export function PinPad({ onSubmit, error = false }: PinPadProps) {
  const [pin, setPin] = useState('');

  function handleKey(key: string) {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      onSubmit(next);
      setPin('');
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dots */}
      <div className={`flex gap-3 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length ? 'bg-[#22d3ee] scale-110' : 'bg-[#2a2a3a]'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
          key === '' ? <div key="empty" /> : (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="w-16 h-16 rounded-2xl bg-[#1a1a24] border border-[#2a2a3a]
                flex items-center justify-center text-xl font-medium
                active:bg-[#22d3ee]/10 active:border-[#22d3ee] transition-all"
            >
              {key === 'del' ? '⌫' : key}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
