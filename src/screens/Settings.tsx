import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useProfile } from '../hooks/useProfile';
import { useStorage } from '../hooks/useStorage';
import { useFamily } from '../hooks/useFamily';
import { useDailyState } from '../hooks/useDailyState';
import { useVault } from '../hooks/useVault';
import { KEYS } from '../lib/keys';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  timerWorkMinutes: 25,
  timerBreakMinutes: 5,
  notificationsEnabled: false,
  hapticEnabled: true,
  seasonMode: 'auto',
};

export default function SettingsScreen() {
  const { profile, set: setProfile } = useProfile();
  const { data: settings, set: setSettings } = useStorage<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  const { familyCode, connected: familyConnected, connect: connectFamily, disconnect: disconnectFamily, syncProgress } = useFamily();
  const { state: dailyState } = useDailyState();
  const { vault } = useVault();
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey ?? '');
  const [saved, setSaved] = useState(false);
  const [nameEdit, setNameEdit] = useState(false);
  const [userName, setUserName] = useState(profile.userName ?? '');
  const [appName, setAppName] = useState(profile.appName ?? 'FocusFrame');
  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [familyError, setFamilyError] = useState('');

  function saveApiKey() {
    setSettings((prev) => ({ ...prev, apiKey: apiKeyInput.trim() || undefined }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function saveNames() {
    setProfile((prev) => ({
      ...prev,
      userName: userName.trim() || prev.userName,
      appName: appName.trim() || 'FocusFrame',
    }));
    setNameEdit(false);
  }

  return (
    <div className="px-5 pt-6 pb-4 animate-slide-up">
      <h1 className="text-xl font-bold mb-6">Settings</h1>

      {/* Personalization */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Personalization</h2>
        {!nameEdit ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8888a0]">Your name</span>
              <span>{profile.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8888a0]">App name</span>
              <span className="text-[#22d3ee]">{profile.appName || 'FocusFrame'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setNameEdit(true)}>Edit</Button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label className="text-xs text-[#555570]">Your name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white mt-1
                  focus:border-[#22d3ee] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#555570]">App name</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white mt-1
                  focus:border-[#22d3ee] focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveNames}>Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setNameEdit(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

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
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Vega Jr. API Key</h2>
        <p className="text-xs text-[#555570] mb-3">
          Enter your Anthropic API key to enable Vega Jr. AI chat.
        </p>
        <input
          type="password"
          placeholder="sk-ant-..."
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          className="w-full bg-[#111118] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white
            placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none mb-3 font-mono text-sm"
        />
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={saveApiKey}>Save Key</Button>
          {saved && <span className="text-xs text-[#10b981] animate-fade-in">Saved!</span>}
          {settings.apiKey && <span className="text-xs text-[#10b981]">Key set</span>}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Timer Defaults</h2>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-[#555570]">Work</span>
            <div className="flex gap-2 mt-1">
              {[15, 25, 45].map((m) => (
                <button
                  key={m}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-mono
                    ${settings.timerWorkMinutes === m
                      ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]'
                      : 'border-[#2a2a3a] text-[#8888a0]'}`}
                  onClick={() => setSettings((prev) => ({ ...prev, timerWorkMinutes: m }))}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-[#555570]">Break</span>
            <div className="flex gap-2 mt-1">
              {[3, 5, 10].map((m) => (
                <button
                  key={m}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-mono
                    ${settings.timerBreakMinutes === m
                      ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]'
                      : 'border-[#2a2a3a] text-[#8888a0]'}`}
                  onClick={() => setSettings((prev) => ({ ...prev, timerBreakMinutes: m }))}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Family Link</h2>
        {familyConnected ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">Connected:</span>
              <Badge color="#10b981">{familyCode}</Badge>
            </div>
            <p className="text-xs text-[#555570] mb-2">
              Your parent can see your tasks, XP, and streaks. They cannot see your mood, notes, or chats.
            </p>
            <Button variant="ghost" size="sm" onClick={disconnectFamily}>Disconnect</Button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-[#555570] mb-3">
              Enter the family code your parent gave you to link your accounts.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. MASON-2026"
                value={familyCodeInput}
                onChange={(e) => { setFamilyCodeInput(e.target.value.toUpperCase()); setFamilyError(''); }}
                className="flex-1 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-white font-mono text-sm
                  placeholder:text-[#555570] focus:border-[#22d3ee] focus:outline-none uppercase"
              />
              <Button size="sm" onClick={async () => {
                if (!familyCodeInput.trim()) return;
                const ok = await connectFamily(familyCodeInput);
                if (!ok) {
                  setFamilyError('Code not found. Ask your parent to set it up first.');
                } else {
                  // Push initial state so the parent portal sees something immediately
                  syncProgress(dailyState, profile, vault);
                }
              }}>
                Link
              </Button>
            </div>
            {familyError && <p className="text-xs text-[#f43f5e] mt-2">{familyError}</p>}
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">Device Mode</h2>
        <p className="text-xs text-[#555570] mb-3">
          This device is in athlete mode. Switch if you're setting it up as a parent portal device.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem(KEYS.DEVICE_MODE);
            window.location.hash = '#/mode';
            window.location.reload();
          }}
        >
          Switch device
        </Button>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-[#8888a0] mb-3">About</h2>
        <p className="text-sm text-[#555570]">
          FocusFrame v1.0 — Built for athletes with ADHD brains.
          Your data stays on your device. No accounts, no cloud, no tracking.
        </p>
      </Card>
    </div>
  );
}
