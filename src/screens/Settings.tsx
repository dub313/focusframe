import { Card } from '../components/ui/Card';
import { useProfile } from '../hooks/useProfile';

export default function SettingsScreen() {
  const { profile } = useProfile();

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-6">Settings</h1>

      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Profile</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Member since</span>
            <span>{profile.firstUseDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Days active</span>
            <span className="font-mono">{profile.daysActive}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8888a0]">Total XP</span>
            <span className="font-mono text-[#f59e0b]">{profile.totalXP}</span>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">About</h2>
        <p className="text-sm text-[#555570]">
          FocusFrame v1.0 — Built for athletes with ADHD brains.
          Your data stays on your device.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Parent Config</h2>
        <p className="text-sm text-[#555570]">PIN-protected settings coming soon.</p>
      </Card>
    </div>
  );
}
