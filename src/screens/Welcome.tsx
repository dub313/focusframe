import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useProfile } from '../hooks/useProfile';
import { storageSet } from '../lib/storage';
import { KEYS } from '../lib/keys';

const APP_NAME_SUGGESTIONS = [
  'FocusFrame',
  'The Grind',
  'LockIn',
  'BeastMode',
  'MyZone',
  'GamePlan',
  'FlowState',
];

export default function Welcome() {
  const { profile, set: setProfile } = useProfile();

  const [step, setStep] = useState<'name' | 'appname'>('name');
  const [userName, setUserName] = useState('');
  const [appName, setAppName] = useState('FocusFrame');
  const [customName, setCustomName] = useState('');

  async function handleFinish() {
    const finalAppName = customName.trim() || appName;
    const updated = {
      ...profile,
      userName: userName.trim(),
      appName: finalAppName,
    };
    // Write directly to storage first, then update React state
    await storageSet(KEYS.PROFILE, updated);
    setProfile(updated);
    // Go to the guide first, then boot
    window.location.hash = '#/guide';
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-8 animate-fade-in">
      {step === 'name' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
          <div className="text-center">
            <span className="text-5xl mb-4 block">👋</span>
            <h1 className="text-3xl font-bold mt-4">What's your name?</h1>
            <p className="text-[#8888a0] text-sm mt-2">This is your app. Let's make it yours.</p>
          </div>

          <input
            type="text"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            autoFocus
            className="w-full max-w-xs bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-5 py-4
              text-xl text-center text-white placeholder:text-[#555570]
              focus:border-[#22d3ee] focus:outline-none transition-colors"
          />

          <Button
            size="lg"
            className="w-full max-w-xs"
            disabled={!userName.trim()}
            onClick={() => setStep('appname')}
          >
            Next
          </Button>
        </div>
      )}

      {step === 'appname' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-slide-up">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              Nice, {userName.trim()}. Name your app.
            </h1>
            <p className="text-[#8888a0] text-sm mt-2">Pick one or make your own.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {APP_NAME_SUGGESTIONS.map((name) => (
              <button
                key={name}
                onClick={() => { setAppName(name); setCustomName(''); }}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all
                  ${appName === name && !customName
                    ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]'
                    : 'border-[#2a2a3a] text-[#8888a0] hover:border-[#555570]'}`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="w-full max-w-xs">
            <p className="text-xs text-[#555570] text-center mb-2">Or type your own</p>
            <input
              type="text"
              placeholder="Custom name..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-3
                text-center text-white placeholder:text-[#555570]
                focus:border-[#22d3ee] focus:outline-none transition-colors"
            />
          </div>

          {/* Preview */}
          <div className="text-center mt-2">
            <p className="text-xs text-[#555570]">Your app will be called</p>
            <p className="text-2xl font-bold text-[#22d3ee] mt-1">
              {customName.trim() || appName}
            </p>
          </div>

          <div className="flex gap-3 w-full max-w-xs">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('name')}>
              Back
            </Button>
            <Button size="lg" className="flex-1" onClick={handleFinish}>
              Let's Go
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
