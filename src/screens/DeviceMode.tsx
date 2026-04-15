import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { KEYS, type DeviceMode } from '../lib/keys';

export default function DeviceModeScreen() {
  const navigate = useNavigate();

  function pick(mode: DeviceMode) {
    localStorage.setItem(KEYS.DEVICE_MODE, mode);
    // Hard reload so App.tsx re-reads storage and routes correctly from scratch
    if (mode === 'parent') {
      window.location.hash = '#/parent';
    } else {
      window.location.hash = '#/';
    }
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-2 text-center">Who's this device?</h1>
      <p className="text-sm text-[#8888a0] mb-10 text-center">
        Choose once. You can switch later in Settings.
      </p>

      <div className="w-full max-w-xs space-y-4">
        <Card
          className="cursor-pointer active:scale-[0.98] transition-all border-[#22d3ee]/30 hover:border-[#22d3ee]/60"
          onClick={() => pick('kid')}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎯</span>
            <div className="flex-1">
              <p className="font-bold text-[#22d3ee]">I'm the athlete</p>
              <p className="text-xs text-[#8888a0]">Daily boot, tasks, focus, rewards</p>
            </div>
          </div>
        </Card>

        <Card
          className="cursor-pointer active:scale-[0.98] transition-all border-[#f59e0b]/30 hover:border-[#f59e0b]/60"
          onClick={() => pick('parent')}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🔐</span>
            <div className="flex-1">
              <p className="font-bold text-[#f59e0b]">I'm the parent</p>
              <p className="text-xs text-[#8888a0]">Portal only — assign tasks, manage rewards</p>
            </div>
          </div>
        </Card>
      </div>

      <button
        className="mt-10 text-xs text-[#555570] hover:text-[#8888a0]"
        onClick={() => navigate('/')}
      >
        Skip for now
      </button>
    </div>
  );
}
